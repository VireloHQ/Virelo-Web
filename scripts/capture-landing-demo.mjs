// Capture the shipping UI using an isolated, explicitly synthetic library.
// No user profile, personal files or persisted browser storage are accessed.
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const require = createRequire(process.env.VIRELO_TEST_NODE_PACKAGE || import.meta.url);
const { chromium } = require('playwright');
const base = process.env.VIRELO_DEMO_URL || 'http://127.0.0.1:5199';
const output = resolve('web/public/landing');
const titles = [
  ['Small Hours','night',5400,1120,'A quiet city. A late-night diner. One more story before the sun comes up.'],
  ['The Long Way Home','coast',6120,1820,'A journey along the coast, where the road ends and the next adventure begins.'],
  ['Beyond the Horizon','orbit',6600,780,'Far from home, a new world is waiting.'],
  ['Coastlines','coast',2100,0,'A closer look at the places where land meets sea.'],
  ['After Midnight','night',5100,0,'The city takes on a different life after dark.'],
  ['A Distant World','orbit',4800,0,'A quiet expedition across an unfamiliar landscape.']
];
const items = titles.map(([title,art,duration,progress,overview],i) => ({
  id:i+1,library_id:1,path:title+'.mp4',source_path:title+'.mp4',filename:title+'.mp4',title,
  sort_title:title.toLowerCase(),kind:'movie',series_title:null,season:null,episode:null,year:null,
  duration,width:854,height:480,video_codec:'h264',audio_codec:'aac',container:'mp4',folder:'Films',
  size:1,mtime:6-i,thumbnail_path:'browser',poster_path:null,backdrop_path:'/landing/'+art+'-cinema.webp',
  overview,genres:null,external_id:null,liked:i<3?1:0,progress_position:progress,progress_duration:duration,
  progress_updated_at:6-i,progress_completed:0
}));
const playback = {width:854,height:480,videoCodec:'h264',requiresTranscode:false,requiresVideoTranscode:false,
  defaultAudioStream:1,audioTracks:[{index:1,typeIndex:0,codec:'aac',language:'eng',title:'English',supported:true,channels:2}],
  subtitleTracks:[{index:2,typeIndex:0,codec:'srt',language:'eng',title:'English',supported:true}],
  qualityOptions:[{height:480,label:'480p',bitrate:1400000},{height:360,label:'360p',bitrate:800000}]};
const footage = await readFile(process.env.VIRELO_DEMO_VIDEO);
const browser = await chromium.launch({headless:true,executablePath:process.env.VIRELO_TEST_CHROMIUM});
try {
  const context = await browser.newContext({viewport:{width:1440,height:1050},serviceWorkers:'block',reducedMotion:'reduce',deviceScaleFactor:1});
  const page = await context.newPage();
  await page.addInitScript(()=>document.addEventListener('play',event=>{if(event.target instanceof HTMLMediaElement)event.target.pause();},true));
  page.on('pageerror',error=>console.error(error.message));
  console.log('Capture browser ready');
  await page.route('**/__landing-demo.mp4',route => {
    const range=route.request().headers().range?.match(/^bytes=(\d+)-(\d*)$/);
    if(!range)return route.fulfill({body:footage,contentType:'video/mp4'});
    const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),footage.length-1):footage.length-1;
    return route.fulfill({status:206,body:footage.subarray(start,end+1),contentType:'video/mp4',headers:{'Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${footage.length}`}});
  });
  await page.route(url=>url.pathname==='/src/api.ts'&&!url.search,async route=>{
    const response=await route.fetch();
    return route.fulfill({response,body:await response.text()+"\napi.mediaSource=async()=>'/__landing-demo.mp4';api.mediaFile=async()=>new File([],'demo.mp4',{type:'video/mp4'});"});
  });
  await page.route(url=>url.pathname==='/src/browser-transcode.ts'&&!url.search,route=>route.fulfill({contentType:'text/javascript',body:
    'export async function probeBrowserPlayback(){return '+JSON.stringify(playback)+';} export async function prepareBrowserAudio(){throw Error("Demo has native audio");} export async function prepareBrowserQuality(){throw Error("Do not convert the screenshot fixture");} export async function prepareBrowserSubtitle(){return "";}'}));
  await page.goto(base+'/app/settings');
  console.log('Settings loaded');
  await page.locator('.settings-heading').waitFor();
  await page.locator('.splash-screen').waitFor({state:'hidden'});
  await page.evaluate(async items=>{
    const {saveStoredMedia}=await import('/src/local-library.ts');
    for(const item of items)await saveStoredMedia(item);
    const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('virelo-web',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    const images=await Promise.all(items.map(async item=>({id:item.id,blob:await(await fetch(item.backdrop_path)).blob()})));
    await new Promise((resolve,reject)=>{const tx=db.transaction(['thumbnails','libraries'],'readwrite');for(const image of images)tx.objectStore('thumbnails').put(image);tx.objectStore('libraries').put({id:1,label:'My videos',path:'My videos',created_at:0,persistent:false});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
    db.close();
  },items);
  console.log('Synthetic library installed');
  const settle=async()=>{await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>[...document.images].filter(image=>{const bounds=image.getBoundingClientRect();return bounds.top<innerHeight&&bounds.bottom>0&&bounds.left<innerWidth&&bounds.right>0;}).every(image=>image.complete&&image.naturalWidth>1));await page.mouse.move(1,1);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));};
  for(const [label,width,height] of [['desktop',1440,1050],['mobile',390,820]]){
    await page.setViewportSize({width,height});
    console.log('Rendering',label);
    await page.goto(base+'/app');await page.locator('.hero-banner').waitFor();await settle();
    await page.screenshot({path:join(output,'library-'+label+'.png')});
    await page.goto(base+'/app/watch/2?queue=true');await page.locator('.player video').waitFor();
    await page.getByRole('button',{name:'Quality',exact:true}).waitFor();
    await page.waitForFunction(()=>document.querySelector('.player video')?.readyState>=2);
    await page.locator('.player video').evaluate(video=>{video.pause();video.currentTime=12;});
    await settle();await page.locator('.player').hover({position:{x:4,y:4}});
    await page.screenshot({path:join(output,'player-'+label+'.png')});
    console.log('Captured',label);
  }
  await context.close();
} finally {await browser.close();}
