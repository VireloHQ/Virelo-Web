import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  Quality,
  canEncodeAudio,
  canEncodeVideo
} from 'mediabunny';
import { registerAc3Decoder } from '@mediabunny/ac3';
import { registerAacEncoder } from '@mediabunny/aac-encoder';
import matroskaSubtitlesUrl from 'matroska-subtitles/dist/matroska-subtitles.min.js?url';
import type { PlaybackInfo, PlaybackTrack } from './types';

const DIRECT_AUDIO_CODECS=new Set(['aac','flac','mp3','opus','vorbis']);
const MATROSKA_EXTENSIONS=new Set(['mkv','mka','mks','webm']);
const audioCache=new Map<string,string>();
const qualityCache=new Map<string,string>();
const subtitleCache=new Map<string,Promise<Map<number,string>>>();
const probeCache=new WeakMap<File,Promise<PlaybackInfo>>();
let encoderReady:Promise<void>|null=null;
let parserReady:Promise<MatroskaSubtitleModule>|null=null;

registerAc3Decoder();

export function probeBrowserPlayback(file:File){
  const cached=probeCache.get(file);
  if(cached)return cached;
  const result=probe(file);
  probeCache.set(file,result);
  return result;
}

async function probe(file:File):Promise<PlaybackInfo>{
  const input=createInput(file);
  try{
    const [allTracks,videoTracks,audioTracks,primaryAudio,subtitleTracks]=await Promise.all([
      input.getTracks(),
      input.getVideoTracks(),
      input.getAudioTracks(),
      input.getPrimaryAudioTrack(),
      probeMatroskaSubtitleTracks(file)
    ]);
    const audioInfo=await Promise.all(audioTracks.map(async(track,typeIndex)=>{
      const [codec,language,title,channels,disposition]=await Promise.all([
        track.getCodec(),
        track.getLanguageCode(),
        track.getName(),
        track.getNumberOfChannels(),
        track.getDisposition()
      ]);
      return {
        index:allTracks.indexOf(track),
        typeIndex,
        codec:codec||String(await track.getInternalCodecId()||'unknown').toLowerCase(),
        language:language==='und'?null:language,
        title,
        channels,
        channelLayout:channelLabel(channels),
        default:disposition.default||disposition.primary,
        forced:disposition.forced,
        supported:codec==='ac3'||codec==='eac3'||await track.canDecode()
      } satisfies PlaybackTrack;
    }));
    const subtitleInfo=subtitleTracks.map((track,typeIndex)=>({
      index:track.number,
      typeIndex,
      codec:track.type==='utf8'?'subrip':track.type,
      language:track.language||null,
      title:track.name||null,
      channels:null,
      channelLayout:null,
      default:false,
      forced:false,
      supported:true
    } satisfies PlaybackTrack));
    const defaultAudioIndex=primaryAudio?allTracks.indexOf(primaryAudio):(audioInfo[0]?.index??null);
    const defaultAudio=audioInfo.find((track)=>track.index===defaultAudioIndex)??audioInfo[0];
    const requiresAudioTranscode=Boolean(defaultAudio&&!DIRECT_AUDIO_CODECS.has(defaultAudio.codec));
    const primaryVideo=videoTracks[0];
    const [width,height]=primaryVideo?await Promise.all([primaryVideo.getDisplayWidth(),primaryVideo.getDisplayHeight()]):[null,null];
    const canCreateLowerQualities=Boolean(primaryVideo&&await canEncodeVideo('avc'));
    return {
      videoCodec:await primaryVideo?.getCodec()??null,
      width,
      height,
      qualityOptions:playbackQualities(height,canCreateLowerQualities),
      audioTracks:audioInfo,
      subtitleTracks:subtitleInfo,
      defaultAudioStream:defaultAudio?.index??null,
      requiresVideoTranscode:false,
      requiresAudioTranscode,
      requiresTranscode:requiresAudioTranscode
    };
  }finally{input.dispose();}
}

export async function prepareBrowserQuality(file:File,height:number,audioStream:number|null,onProgress?:(progress:number)=>void){
  const key=`${file.name}:${file.size}:${file.lastModified}:quality:${height}:audio:${audioStream??'none'}`;
  const cached=qualityCache.get(key);
  if(cached)return cached;
  if(!(await canEncodeVideo('avc')))throw new Error('This browser cannot create a lower-resolution AVC version.');
  await ensureAacEncoder();
  const input=createInput(file);
  const target=new BufferTarget();
  const output=new Output({format:new Mp4OutputFormat({fastStart:'in-memory'}),target});
  try{
    const allTracks=await input.getTracks();
    const selectedAudio=audioStream===null?null:allTracks[audioStream];
    const conversion=await Conversion.init({
      input,
      output,
      video:{codec:'avc',height,quality:new Quality({bitrate:qualityBitrate(height)}),keyFrameInterval:2,forceTranscode:true},
      audio:(track)=>track===selectedAudio
        ?{codec:'aac',quality:new Quality({bitrate:192_000}),numberOfChannels:Math.min(2,track.numberOfChannels||2),forceTranscode:true}
        :{discard:true},
      showWarnings:false
    });
    if(!conversion.isValid)throw new Error(conversion.discardedTracks[0]?.reason||'This quality cannot be created in this browser.');
    conversion.onProgress=(progress)=>onProgress?.(Math.max(0,Math.min(1,progress)));
    await conversion.execute();
    if(!target.buffer)throw new Error('The converted video was empty.');
    const url=URL.createObjectURL(new Blob([target.buffer],{type:'video/mp4'}));
    qualityCache.set(key,url);
    onProgress?.(1);
    return url;
  }finally{input.dispose();}
}

export async function prepareBrowserAudio(file:File,stream:number,onProgress?:(progress:number)=>void){
  const key=`${file.name}:${file.size}:${file.lastModified}:audio:${stream}`;
  const cached=audioCache.get(key);
  if(cached)return cached;
  await ensureAacEncoder();
  const input=createInput(file);
  const target=new BufferTarget();
  const output=new Output({format:new Mp4OutputFormat({fastStart:'in-memory'}),target});
  try{
    const allTracks=await input.getTracks();
    const selected=allTracks[stream];
    if(!selected?.isAudioTrack())throw new Error('The selected audio track no longer exists.');
    const conversion=await Conversion.init({
      input,
      output,
      video:{discard:true},
      audio:(track)=>track===selected
        ?{codec:'aac',quality:new Quality({bitrate:192_000}),numberOfChannels:Math.min(2,track.numberOfChannels||2),forceTranscode:true}
        :{discard:true},
      showWarnings:false
    });
    if(!conversion.isValid)throw new Error(conversion.discardedTracks.find(({track})=>track===selected)?.reason||'The selected audio track cannot be converted.');
    conversion.onProgress=(progress)=>onProgress?.(Math.max(0,Math.min(1,progress)));
    await conversion.execute();
    if(!target.buffer)throw new Error('The converted audio was empty.');
    const url=URL.createObjectURL(new Blob([target.buffer],{type:'audio/mp4'}));
    audioCache.set(key,url);
    onProgress?.(1);
    return url;
  }finally{input.dispose();}
}

export async function prepareBrowserSubtitle(file:File,stream:number){
  const key=`${file.name}:${file.size}:${file.lastModified}`;
  let extraction=subtitleCache.get(key);
  if(!extraction){
    extraction=extractMatroskaSubtitles(file);
    subtitleCache.set(key,extraction);
  }
  const url=(await extraction).get(stream);
  if(!url)throw new Error('The selected subtitle track could not be extracted.');
  return url;
}

function createInput(file:File){
  return new Input({formats:ALL_FORMATS,source:new BlobSource(file)});
}

function ensureAacEncoder(){
  return encoderReady??=(async()=>{
    if(!(await canEncodeAudio('aac')))registerAacEncoder();
  })();
}

async function probeMatroskaSubtitleTracks(file:File){
  if(!MATROSKA_EXTENSIONS.has(extension(file.name)))return [] as MatroskaSubtitleTrack[];
  const {SubtitleParser}=await loadSubtitleParser();
  const parser=new SubtitleParser();
  const reader=file.stream().getReader();
  let tracks:MatroskaSubtitleTrack[]|null=null;
  let parserError:unknown;
  parser.once('tracks',(value)=>{tracks=value;});
  parser.once('error',(error)=>{parserError=error;});
  try{
    while(!tracks&&!parserError){
      const chunk=await reader.read();
      if(chunk.done)break;
      parser.write(chunk.value);
    }
    if(parserError)throw parserError;
    return tracks??[];
  }finally{
    await reader.cancel().catch(()=>undefined);
    parser.destroy();
  }
}

async function extractMatroskaSubtitles(file:File){
  if(!MATROSKA_EXTENSIONS.has(extension(file.name)))throw new Error('Embedded subtitle extraction is currently available for Matroska files.');
  const {SubtitleParser}=await loadSubtitleParser();
  const parser=new SubtitleParser();
  const reader=file.stream().getReader();
  const cues=new Map<number,SubtitleCue[]>();
  let parserError:unknown;
  parser.on('subtitle',(subtitle,trackNumber)=>{
    const list=cues.get(trackNumber)??[];
    list.push(subtitle);
    cues.set(trackNumber,list);
  });
  parser.once('error',(error)=>{parserError=error;});
  try{
    while(!parserError){
      const chunk=await reader.read();
      if(chunk.done)break;
      parser.write(chunk.value);
    }
    if(parserError)throw parserError;
    await new Promise<void>((resolve,reject)=>{
      parser.once('finish',resolve);
      parser.once('error',reject);
      parser.end();
    });
    return new Map([...cues].map(([trackNumber,items])=>[
      trackNumber,
      URL.createObjectURL(new Blob([toWebVtt(items)],{type:'text/vtt'}))
    ]));
  }finally{
    await reader.cancel().catch(()=>undefined);
    parser.destroy();
  }
}

function loadSubtitleParser(){
  if(parserReady)return parserReady;
  parserReady=new Promise((resolve,reject)=>{
    const existing=window.MatroskaSubtitles;
    if(existing){resolve(existing);return;}
    const script=document.createElement('script');
    script.src=matroskaSubtitlesUrl;
    script.async=true;
    script.onload=()=>window.MatroskaSubtitles?resolve(window.MatroskaSubtitles):reject(new Error('Subtitle parser did not initialize.'));
    script.onerror=()=>reject(new Error('Subtitle support could not be loaded.'));
    document.head.append(script);
  });
  return parserReady;
}

function toWebVtt(cues:SubtitleCue[]){
  const body=[...cues].sort((a,b)=>a.time-b.time).map((cue,index)=>{
    const start=Math.max(0,Number(cue.time)||0);
    const duration=Math.max(100,Number(cue.duration)||2_000);
    return `${index+1}\n${vttTime(start)} --> ${vttTime(start+duration)}\n${cleanSubtitleText(cue.text)}\n`;
  }).join('\n');
  return `WEBVTT\n\n${body}`;
}

function cleanSubtitleText(value:string){
  return value.replace(/\\N/gi,'\n').replace(/\{[^}]*\}/g,'').replace(/<br\s*\/?>/gi,'\n').trim();
}
function vttTime(milliseconds:number){
  const hours=Math.floor(milliseconds/3_600_000);
  const minutes=Math.floor(milliseconds%3_600_000/60_000);
  const seconds=Math.floor(milliseconds%60_000/1000);
  const millis=Math.floor(milliseconds%1000);
  return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(millis).padStart(3,'0')}`;
}
function extension(name:string){return name.split('.').at(-1)?.toLowerCase()||'';}
function channelLabel(channels:number){
  if(channels===1)return 'mono';
  if(channels===2)return 'stereo';
  return `${channels} channels`;
}
function playbackQualities(sourceHeight:number|null,includeLowerQualities:boolean){
  if(!sourceHeight||sourceHeight<1)return [];
  return [sourceHeight,...(includeLowerQualities?[2160,1440,1080,720,480,360]:[])]
    .filter((height,index,values)=>height<=sourceHeight&&values.indexOf(height)===index)
    .sort((a,b)=>b-a)
    .map((height)=>({height,label:qualityLabel(height),bitrate:qualityBitrate(height)}));
}
function qualityLabel(height:number){return height>=2160?'4K':`${height}p`;}
function qualityBitrate(height:number){
  if(height>=2160)return 12_000_000;
  if(height>=1440)return 8_000_000;
  if(height>=1080)return 5_000_000;
  if(height>=720)return 2_800_000;
  if(height>=480)return 1_400_000;
  return 800_000;
}

interface MatroskaSubtitleTrack{number:number;language?:string;type:string;name?:string}
interface SubtitleCue{text:string;time:number;duration:number}
interface SubtitleParserLike{
  once(event:string,listener:(value:any)=>void):this;
  on(event:'subtitle',listener:(subtitle:SubtitleCue,trackNumber:number)=>void):this;
  on(event:string,listener:(value:any)=>void):this;
  write(chunk:Uint8Array):boolean;
  end():void;
  destroy():void;
}
interface MatroskaSubtitleModule{SubtitleParser:new()=>SubtitleParserLike}
declare global{interface Window{MatroskaSubtitles?:MatroskaSubtitleModule}}
