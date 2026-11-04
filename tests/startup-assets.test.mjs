import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('the splash uses responsive lossless assets with a PNG fallback and matching early preload',async()=>{
  const [component,html]=await Promise.all(['web/src/components/SplashScreen.tsx','web/index.html'].map(path=>readFile(new URL('../'+path,import.meta.url),'utf8')));
  for(const name of ['virelo-icon-512.webp','virelo-icon.webp']){
    const bytes=await readFile(new URL('../web/public/'+name,import.meta.url));
    const png=await readFile(new URL('../web/public/'+name.replace('.webp','.png'),import.meta.url));
    assert.equal(bytes.toString('ascii',0,4),'RIFF');
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
    assert.ok(bytes.length<png.length*.8,name+': worthwhile lossless compression');
    assert.ok(component.includes('/'+name+'?v=ribbon-2'));
    assert.ok(html.includes('/'+name+'?v=ribbon-2'));
  }
  assert.match(component,/<picture>/);
  assert.match(component,/type="image\/webp"/);
  assert.match(component,/src="\/virelo-icon-512\.png\?v=ribbon-1"/);
  assert.match(html,/rel="preload" as="image" type="image\/webp"/);
});
