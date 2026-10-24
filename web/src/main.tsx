import React, { useCallback, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource-variable/inter';
import { SplashScreen } from './components/SplashScreen';
import { router } from './router';
import './styles.css';
import './streaming-ui.css';
import './ui-motion.css';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .catch(error => console.warn('Offline caching is unavailable; the app will keep working.', error));
  });
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 20_000, refetchOnWindowFocus: false, retry: 1 } }
});

// A repair/rescan replaces blob URLs. All artwork consumers must stop using the revoked URL.
window.addEventListener('virelo-thumbnail-updated',event=>{
  const {id,url}=(event as CustomEvent<{id:number;url:string|null}>).detail;
  queryClient.setQueriesData({queryKey:['thumbnail',id]},url);
});

function App() {
  const [showSplash, setShowSplash] = useState(() => window.location.pathname === '/app' || window.location.pathname.startsWith('/app/'));
  const finishSplash = useCallback(() => setShowSplash(false), []);

  return (
    <>
      <RouterProvider router={router} />
      {showSplash && <SplashScreen onDone={finishSplash} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
