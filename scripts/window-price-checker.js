const { chromium } = require('playwright');
const fs=require('fs');fs.mkdirSync('results',{recursive:true});const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const candidates=[
 {key:'green-76-md',brand:'Salamander',profile:'greenEvolution 76 MD'},
 {key:'lumaxx',brand:'Gealan',profile:'Gealan S 9000 Light'},
 {key:'energy-classic',brand:'Drutex',profile:'Iglo Energy Classic'},
 {key:'edge',brand:'Drutex',profile:'Iglo Edge'}
];
async function accept(page){for(const t of ['Alle akzeptieren','Akzeptieren']){try{const x=page.getByText(t,{exact:false}).first();if(await x.count())await x.click({timeout:1200,force:true})}catch{}}}
async function chooseVisibleStep(page,name){const result=await page.evaluate((name)=>{const items=[...document.querySelectorAll('.step-item')].filter(x=>x.offsetParent!==null);const hit=items.find(x=>((x.querySelector('.item-name')?.textContent||'').trim()===name));if(!hit)return {ok:false,visible:items.map(x=>(x.querySelector('.item-name')?.textContent||'').trim()).filter(Boolean).slice(0,80)};hit.click();return {ok:true};},name);if(!result.ok)throw new Error('visible step not found '+name+'; '+JSON.stringify(result.visible));await sleep(900)}
async function waitPrice(page){let p='';for(let i=0;i<8;i++){await sleep(650);const q=await page.evaluate(()=>(document.body?.innerText.match(/Aktionspreis:\s*([0-9.,]+)\s*€/s)||[])[1]||'');if(q&&q===p)return q;p=q;}return p;}
async function selectHidden(page){try{await page.getByText('Zusätze',{exact:true}).first().click({force:true});await sleep(500);const result=await page.evaluate(()=>{const panels=[...document.querySelectorAll('app-panel-step')].filter(x=>x.offsetParent!==null);const p=panels.find(x=>(x.textContent||'').includes('Verdeckt liegender Beschlag'));if(!p)return {available:false,selected:false};const items=[...p.querySelectorAll('.step-item')].filter(x=>x.offsetParent!==null);const y=items.find(x=>(x.querySelector('.item-name')?.textContent||x.textContent||'').trim()==='Ja');if(!y)return {available:true,selected:false};y.click();return {available:true,selected:true};});await sleep(900);return result;}catch(e){return {available:false,selected:false,error:String(e)}}}
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});const out={};
for(const c of candidates){const page=await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1000}});try{
 await page.goto('https://www.fensterblick.de/fenster-konfigurator.html',{waitUntil:'domcontentloaded',timeout:35000});await sleep(3000);await accept(page);await sleep(500);
 await page.getByText(c.brand,{exact:true}).last().click({timeout:5000,force:true});await sleep(900);await chooseVisibleStep(page,c.profile);
 await page.getByText('Typ',{exact:true}).first().click({force:true});await sleep(400);await page.getByText('Dreh-Kipp links',{exact:false}).last().click({timeout:6000,force:true});await sleep(1000);
 await page.getByText('Maße',{exact:true}).first().click({force:true});await sleep(400);const nums=page.locator('input[type=number]');await nums.nth(0).fill('1055');await nums.nth(0).dispatchEvent('change');await nums.nth(0).blur();await sleep(1000);await nums.nth(1).fill('1175');await nums.nth(1).dispatchEvent('change');await nums.nth(1).blur();await sleep(1400);
 await page.getByText('Glas',{exact:true}).first().click({force:true});await sleep(400);await page.getByText('3-fach Verglasung (warme Kante)',{exact:false}).last().click({timeout:6000,force:true});await waitPrice(page);
 const hidden=await selectHidden(page);await waitPrice(page);
 const summary=await page.evaluate(()=>({text:(document.body?.innerText.match(/Ihre Konfiguration:[\s\S]*?In meinen Warenkorb/)||[''])[0]}));
 const ok=/Dreh-Kipp links/.test(summary.text)&&/1055 mm x 1175 mm/.test(summary.text)&&/3-fach Verglasung \(warme Kante\)/.test(summary.text)&&summary.text.includes(c.profile);
 let cart=null;if(ok){try{await page.getByText('In meinen Warenkorb',{exact:false}).first().click({force:true});await sleep(2200);await page.evaluate(()=>{const $=window.jQuery;const c=document.querySelector('#cart-shipping-country');if(c){c.value='150';if($)$(c).trigger('change');else c.dispatchEvent(new Event('change',{bubbles:true}));}});await sleep(1600);await page.evaluate(()=>{const $=window.jQuery;const s=document.querySelector('#cart-shipping-module');if(s){s.value='flat_flat';if($)$(s).trigger('change');else s.dispatchEvent(new Event('change',{bubbles:true}));}});await sleep(2200);cart=await page.evaluate(()=>({text:(document.body?.innerText||'').slice(0,42000),country:document.querySelector('#cart-shipping-country')?.value||null,module:document.querySelector('#cart-shipping-module')?.value||null,url:location.href}));}catch(e){cart={error:String(e),url:page.url()};}}
 out[c.key]={candidate:c,hidden,ok,summary,cart};
 }catch(e){out[c.key]={candidate:c,error:String(e),url:page.url(),text:(await page.locator('body').innerText().catch(()=>'' )).slice(0,14000)}}await page.close();}
fs.writeFileSync('results/batch-de.json',JSON.stringify(out,null,2));await browser.close();})();
