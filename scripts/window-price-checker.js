const { chromium }=require('playwright');const fs=require('fs');fs.mkdirSync('results',{recursive:true});const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const targets=[
 ['dfs-neo','https://deutscher-fenstershop.de/konfigurator/fenster?pid=455688'],
 ['dfs-energy','https://deutscher-fenstershop.de/konfigurator/fenster'],
 ['mein24-energy','https://www.meinfenster24.de/konfigurator.php?produkt_id=103'],
 ['bew-green','https://www.bew24-fenster.de/salamander-greenevolution-76-md-basic-kunststofffenster-konfigurieren.html'],
 ['boss-green','https://bossmann-store.de/Salamander-greenEvolution-76-MD-Basic-Kunststoff/FENS-110.40-MAT'],
 ['fensteralf','https://fensteralf.de/konfigurator-fenster'],
 ['wds','https://wds2000.de/index.php?product=window&route=configurators%2Faddons']
];
async function one(browser,key,url){const page=await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1200}});let r={key,url};try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});await sleep(3500);for(const t of ['Alle akzeptieren','Akzeptieren','Alles akzeptieren','Ich akzeptiere','Zustimmen']){try{const x=page.getByText(t,{exact:false}).first();if(await x.count())await x.click({timeout:800,force:true})}catch{}}
if(key==='mein24-energy'){try{await page.getByText('Konfigurieren',{exact:true}).first().click({force:true});await sleep(2500)}catch{}}
if(key==='fensteralf'){try{const x=page.getByText('Kunststoff',{exact:true}).last();await x.click({force:true});await sleep(2200)}catch{}}
const frames=[];for(const f of page.frames()){try{frames.push({url:f.url(),controls:await f.evaluate(()=>[...document.querySelectorAll('input,select,textarea,button')].filter(x=>x.offsetParent!==null).map(x=>({tag:x.tagName,type:x.type||'',name:x.name||'',id:x.id||'',value:x.value||'',min:x.min||'',max:x.max||'',step:x.step||'',placeholder:x.placeholder||'',text:(x.innerText||x.textContent||'').trim().replace(/\s+/g,' ').slice(0,160),parent:(x.parentElement?.innerText||'').trim().replace(/\s+/g,' ').slice(0,260),outer:x.outerHTML.slice(0,700)})).slice(0,800)),text:(await f.locator('body').innerText().catch(()=>'' )).slice(0,35000)});}catch{}}
r={key,url:page.url(),title:await page.title(),frames};}catch(e){r.error=String(e);r.url=page.url();r.text=(await page.locator('body').innerText().catch(()=>'' )).slice(0,12000)}await page.close();return r}
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});const out={};const arr=await Promise.all(targets.map(([k,u])=>one(browser,k,u)));for(const x of arr)out[x.key]=x;fs.writeFileSync('results/focused-inspect.json',JSON.stringify(out,null,2));await browser.close();})();
