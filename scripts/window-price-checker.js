const { chromium } = require('playwright');
const fs=require('fs');fs.mkdirSync('results',{recursive:true});const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pages=[
 ['dfs-neo','https://deutscher-fenstershop.de/fenster/aluplast-ideal-neo-md-id429594'],
 ['dfs-energy','https://deutscher-fenstershop.de/fenster/kunststofffenster-iglo-energy-classic'],
 ['mein24-energy','https://www.meinfenster24.de/konfigurator.php?produkt_id=103'],
 ['hanse','https://hansefenster.shop/'],
 ['fensteralf','https://fensteralf.de/konfigurator-fenster'],
 ['fensterkoenig','https://xn--fensterknig-yfb.de/konfigurator/konfigurator-starten'],
 ['bew-green','https://www.bew24-fenster.de/salamander-greenevolution-76-md-basic-kunststofffenster.html'],
 ['boss-green','https://bossmann-store.de/Salamander-greenEvolution-76-MD-Basic-Kunststoff/FENS-110.40-MAT'],
 ['fensterpreiswert-neo','https://fensterpreiswert.de/fenster/pvc-fenster/ideal-produktlinie/ideal-neo-md-fenster/']
];
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});const out={};
for(const [key,url] of pages){const page=await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1200}});try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});await sleep(4500);for(const t of ['Alle akzeptieren','Akzeptieren','Zustimmen','Accept all','Alles akzeptieren']){try{const x=page.getByText(t,{exact:false}).first();if(await x.count())await x.click({timeout:800,force:true})}catch{}}
await sleep(1000);
const data=await page.evaluate(()=>({url:location.href,title:document.title,text:(document.body?.innerText||'').slice(0,50000),controls:[...document.querySelectorAll('input,select,textarea,button,a')].filter(x=>x.offsetParent!==null).map(x=>({tag:x.tagName,type:x.type||'',name:x.name||'',id:x.id||'',value:x.value||'',placeholder:x.placeholder||'',text:(x.innerText||x.textContent||'').trim().replace(/\s+/g,' ').slice(0,180),outer:x.outerHTML.slice(0,700)})).filter(x=>/breit|höhe|width|height|mass|maß|glas|verglas|profil|öffnung|dreh|kipp|preis|price|warenkorb|konfig|beschlag|scharnier|versand|liefer|abhol/i.test(JSON.stringify(x))).slice(0,450)}));out[key]=data;}catch(e){out[key]={error:String(e),url:page.url(),text:(await page.locator('body').innerText().catch(()=>'' )).slice(0,12000)}}await page.close();}
fs.writeFileSync('results/other-shops-inspect.json',JSON.stringify(out,null,2));await browser.close();})();
