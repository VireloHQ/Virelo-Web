import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CaretLeft, CaretRight, Play, Queue as QueueIcon } from '@phosphor-icons/react';
import { api, artwork } from '../api';
import type { MediaItem } from '../types';
import { RepeatControl } from './RepeatControl';
import { useRowWheel } from '../hooks/useRowWheel';
import type { RepeatMode } from '../utils/playback-repeat';

interface PlaybackQueueProps {
  items: MediaItem[];
  activeIndex: number;
  repeatMode: RepeatMode;
  onRepeatChange: (mode:RepeatMode) => void;
  onSelect: (index: number) => void;
}

export function PlaybackQueue({items,activeIndex,repeatMode,onRepeatChange,onSelect}:PlaybackQueueProps) {
  const activeItem = useRef<HTMLButtonElement | null>(null);
  const queueList = useRef<HTMLOListElement | null>(null);
  const scroll=useRowWheel(queueList,items.length);
  const [edges,setEdges]=useState({left:false,right:false});
  useEffect(()=>{
    const list=queueList.current;if(!list)return;
    const update=()=>{const next={left:list.scrollLeft>2,right:list.scrollLeft+list.clientWidth<list.scrollWidth-2};setEdges(old=>old.left===next.left&&old.right===next.right?old:next);};
    const observer=new ResizeObserver(update);observer.observe(list);
    list.addEventListener('scroll',update,{passive:true});update();
    return()=>{observer.disconnect();list.removeEventListener('scroll',update);};
  },[items.length]);

  useEffect(()=>{
    const list=queueList.current;
    const item=activeItem.current;
    if(!list||!item)return;
    const tile=item.parentElement as HTMLElement|null;
    if(!tile)return;
    const bounds=tile.getBoundingClientRect(),rail=list.getBoundingClientRect();
    if(bounds.left<rail.left||bounds.right>rail.right)scroll(bounds.left-rail.left-(list.clientWidth-tile.clientWidth)/2);
  },[activeIndex,items.length,scroll]);
  const browse=(direction:number)=>scroll(direction*(queueList.current?.clientWidth??300)*.85);

  return <section className="playback-queue" aria-labelledby="playback-queue-title">
    <header className="playback-queue-head">
      <div className="playback-queue-title">
        <QueueIcon/>
        <div><h2 id="playback-queue-title">Queue</h2><span>{activeIndex+1} of {items.length}</span></div>
      </div>
      <div className="playback-queue-nav">
        <RepeatControl mode={repeatMode} hasQueue queueOnly onChange={onRepeatChange}/>
        <button type="button" onClick={()=>browse(-1)} disabled={!edges.left} aria-label="Scroll queue left"><CaretLeft/></button>
        <button type="button" onClick={()=>browse(1)} disabled={!edges.right} aria-label="Scroll queue right"><CaretRight/></button>
      </div>
    </header>
    <ol className="playback-queue-list" ref={queueList} tabIndex={0} aria-label="Videos in queue"
      onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==='ArrowRight'||event.key==='ArrowLeft')){event.preventDefault();browse(event.key==='ArrowRight'?1:-1);}}}>
      {items.map((item,index)=>{
        const active=index===activeIndex;
        return <li key={item.id}>
          <button ref={active?(element)=>{activeItem.current=element;}:undefined} type="button" className={`playback-queue-item${active?' active':''}`} onClick={()=>onSelect(index)} aria-current={active?'true':undefined}>
            <QueueArtwork item={item}/>
            <span className="playback-queue-copy">
              <small>{active?'Now playing':index===activeIndex+1?'Up next':`Video ${index+1}`}</small>
              <strong title={item.title}>{item.title}</strong>
              <span>{queueMeta(item)}</span>
            </span>
          </button>
        </li>;
      })}
    </ol>
  </section>;
}

function QueueArtwork({item}:{item:MediaItem}) {
  const element=useRef<HTMLSpanElement>(null);
  const [visible,setVisible]=useState(false);
  useEffect(()=>{
    if(!element.current)return;
    const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setVisible(true);observer.disconnect();}},{rootMargin:'200px'});
    observer.observe(element.current);
    return()=>observer.disconnect();
  },[item.id]);
  const thumbnail=useQuery({queryKey:['thumbnail',item.id,item.size,item.mtime],queryFn:()=>api.thumbnail(item.id),enabled:visible,staleTime:Infinity,retry:false});
  const resolved={...item,thumbnail_path:thumbnail.data===undefined?item.thumbnail_path:thumbnail.data};
  const sources=[...new Set((['backdrop','thumbnail','poster'] as const)
    .filter(kind=>Boolean(kind==='thumbnail'?resolved.thumbnail_path:kind==='backdrop'?resolved.backdrop_path:resolved.poster_path))
    .map(kind=>artwork(resolved,kind)))];
  return <span className="playback-queue-art" ref={element}>
    <span className="playback-queue-fallback"><Play weight="fill"/></span>
    {sources.length>0&&<QueueImage key={sources.join('|')} sources={sources}/>}
  </span>;
}

function QueueImage({sources}:{sources:string[]}) {
  const [index,setIndex]=useState(0);
  return index<sources.length?<img src={sources[index]} alt="" loading="lazy" decoding="async" onError={()=>setIndex(current=>current+1)}/>:null;
}

function queueMeta(item:MediaItem) {
  const episode=item.kind==='series'&&item.season!=null&&item.episode!=null
    ? `S${String(item.season).padStart(2,'0')} · E${String(item.episode).padStart(2,'0')}`
    : '';
  if(!item.duration||!Number.isFinite(item.duration)) return episode;
  const total=Math.round(item.duration);
  const hours=Math.floor(total/3600);
  const minutes=Math.floor(total%3600/60);
  const seconds=total%60;
  const duration=hours?`${hours}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`:`${minutes}:${String(seconds).padStart(2,'0')}`;
  return episode?`${episode} · ${duration}`:duration;
}
