import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { Button, Input } from '@heroui/react';
import { MagnifyingGlass, Gear } from '@phosphor-icons/react';
import { useUIStore } from '../store';

export function Header() {
  const navigate = useNavigate();
  const pathname = useLocation({select:location=>location.pathname});
  const isHome = pathname === '/app' || pathname === '/app/';
  const isFavorites = pathname === '/app/favorites';
  const searchDestination = isFavorites ? '/app/favorites' : '/app/library';
  const homeFilter = useUIStore(s=>s.homeFilter);
  const setHomeFilter = useUIStore(s=>s.setHomeFilter);
  const search = useUIStore((s)=>s.search);
  const setSearch = useUIStore((s)=>s.setSearch);
  const searchOpen = useUIStore((s)=>s.mobileSearchOpen);
  const setMobileSearchOpen = useUIStore((s)=>s.setMobileSearchOpen);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    const frame = window.requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [searchOpen]);
  const toggleSearch = () => {
    const nextOpen = !searchOpen;
    setMobileSearchOpen(nextOpen);
    if (nextOpen) void navigate({to:searchDestination});
  };
  return (
    <header className={'topbar'+(isHome?' home-header':'')}>
      <div className="topbar-inner">
        <Link to="/app" className="brand" aria-label="Virelo app home" onClick={()=>setHomeFilter('all')}>
          <span className="brand-mark"><img src="/virelo-icon.png?v=transparent-1" alt="" /></span>
          <span className="brand-name">Virelo</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link to="/app" activeOptions={{exact:true}} activeProps={homeFilter==='all'?{className:'active'}:{}} onClick={()=>setHomeFilter('all')}>Home</Link>
          {isHome&&<><button className="home-header-category" aria-pressed={homeFilter==='movie'} onClick={()=>setHomeFilter('movie')}>Movies</button>
            <button className="home-header-category" aria-pressed={homeFilter==='series'} onClick={()=>setHomeFilter('series')}>Series</button></>}
          <Link to="/app/library" activeProps={{className:'active'}}>Library</Link>
          <Link to="/app/shorts" search={{}} activeProps={{className:'active'}}>Shorts</Link>
          <Link to="/app/favorites" activeProps={{className:'active'}}>Favorites</Link>
          <Link to="/app/playlists" activeProps={{className:'active'}}>Playlists</Link>
        </nav>
        <div className="topbar-actions">
          <div className={`header-search-shell ${searchOpen ? 'open' : ''}`}>
            <div className="header-search-motion">
              <Button
                className="header-search-toggle"
                isIconOnly
                variant="ghost"
                aria-label={searchOpen ? 'Close search' : 'Search'}
                aria-expanded={searchOpen}
                onPress={toggleSearch}
              >
                <MagnifyingGlass size={20}/>
              </Button>
              <Input
                className="header-search-input"
                aria-label={isFavorites ? 'Search favorites' : 'Search library'}
                placeholder="Search"
                value={search}
                ref={searchInputRef}
                tabIndex={searchOpen ? 0 : -1}
                onChange={(e)=>setSearch(e.target.value)}
                onKeyDown={(e)=>{
                  if (e.key === 'Enter') void navigate({to:searchDestination});
                  if (e.key === 'Escape') setMobileSearchOpen(false);
                }}
              />
            </div>
          </div>
          <Button className="desktop-only icon-button settings-button" isIconOnly variant="ghost" aria-label="Settings" onPress={()=>void navigate({to:'/app/settings'})}>
            <Gear size={28}/>
          </Button>
        </div>
      </div>
    </header>
  );
}
