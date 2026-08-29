const { chromium } = require('playwright');
const fs=require('fs');fs.mkdirSync('results',{recursive:true});const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const items=[
 ['neo','https://www.widuro.de/konfigurator/aluplast-pvc-fenster','IDEAL Neo 76 MD'],
 ['green','https://www.widuro.de/konfigurator/salamander-pvc-fenster','greenEvolution 76 MD'],
 ['energy','https://www.widuro.de/konfigurator/drutex-pvc-fenster','Iglo Energy Classic'],
 ['edge','https://www.widuro.de/konfigurator/drutex-pvc-fenster','Iglo Edge']
];
async function cookies(page){for(const t of ['Alle akzeptieren','Akzeptieren','Alles akzeptieren','OK','ICH STIMME ZU']){try{const x=page.getByText(t,{exact:false}).first();if(await x.count())await x.click({force:true,timeout:800})}catch{}}}
async function price(page){const t=await page.locator('body').innerText();const m=t.match(/Aktionspreis\s*([0-9.,]+)\s*€/);return m?m[1]:null}
async function clickExact(page,txt){const x=page.getByText(txt,{exact:true}).last();if(!await x.count())throw new Error('not found '+txt);await x.click({force:true});await sleep(1000)}
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});const out={};for(const [key,url,profile] of items){const page=await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1200}});try{
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});await sleep(4200);await cookies(page);await clickExact(page,profile);await clickExact(page,'Dreh-Kipp Links');
 let stages={afterBase:await price(page)};
 await clickExact(page,'Maße');
 const controls=await page.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].filter(x=>x.offsetParent!==null).map(x=>({tag:x.tagName,type:x.type||'',name:x.name||'',id:x.id||'',value:x.value||'',placeholder:x.placeholder||'',min:x.min||'',max:x.max||'',step:x.step||'',parent:(x.parentElement?.innerText||'').trim().replace(/\s+/g,' ').slice(0,300),outer:x.outerHTML.slice(0,1000)})));
 const dims=page.locator('input:visible');let chosen=[];for(let i=0;i<await dims.count();i++){const x=dims.nth(i);const inf=await x.evaluate(el=>({type:el.type,name:el.name,id:el.id,ph:el.placeholder,parent:(el.parentElement?.innerText||'')}));if(/breit|width|höhe|height|mm|maß|mass/i.test(JSON.stringify(inf))&&['number','text'].includes(inf.type))chosen.push(x)}
 if(chosen.length<2){for(let i=0;i<await dims.count()&&chosen.length<2;i++){const x=dims.nth(i);const typ=await x.getAttribute('type');if(['number','text'].includes(typ||'text'))chosen.push(x)}}
 if(chosen.length>=2){await chosen[0].fill('1055');await chosen[0].dispatchEvent('input');await chosen[0].dispatchEvent('change');await chosen[0].blur();await sleep(900);await chosen[1].fill('1175');await chosen[1].dispatchEvent('input');await chosen[1].dispatchEvent('change');await chosen[1].blur();await sleep(1600);}stages.afterSize=await price(page);
 await clickExact(page,'Glas');const glassText=(await page.locator('body').innerText()).match(/Glas[\s\S]*?(?=Sprossen|Rollladen|Sonstiges|Originalpreis)/)?.[0]||'';
 await clickExact(page,'Sonstiges');const miscText=(await page.locator('body').innerText()).match(/Sonstiges[\s\S]*?(?=Originalpreis|Copyright)/)?.[0]||'';
 const summary=await page.locator('body').innerText();out[key]={profile,url:page.url(),stages,controls,glassText:glassText.slice(0,18000),miscText:miscText.slice(0,18000),summary:summary.slice(-18000)};
 }catch(e){out[key]={profile,error:String(e),url:page.url(),text:(await page.locator('body').innerText().catch(()=>'' )).slice(0,16000)}}await page.close();}fs.writeFileSync('results/widuro-stage2.json',JSON.stringify(out,null,2));await browser.close();})();