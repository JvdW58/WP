const { chromium } = require('playwright');
const fs=require('fs');fs.mkdirSync('results',{recursive:true});const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const candidates=[
 {key:'ideal-neo-md',brand:'aluplast',profile:'IDEAL Neo MD 76mm Cube',url:'https://www.fensterblick.de/fenster-konfigurator.html?profile=205'},
 {key:'green-76-md',brand:'Salamander',profile:'greenEvolution 76 MD'},
 {key:'lumaxx',brand:'Gealan',profile:'Gealan S 9000 Light'},
 {key:'energy-classic',brand:'Drutex',profile:'Iglo Energy Classic'},
 {key:'edge',brand:'Drutex',profile:'Iglo Edge'}
];
async function clearCookie(page){await page.evaluate(()=>{document.querySelector('#cmpbox')?.remove();document.querySelector('#cmpbox2')?.remove();});}
async function clickItem(page,txt){const s=page.locator('span.item-name',{hasText:txt}).last();await s.locator('xpath=ancestor::div[contains(@class,"step-item")][1]').click({timeout:6000,force:true});await sleep(900)}
async function waitStable(page){let prev='';for(let i=0;i<8;i++){await sleep(900);const t=await page.evaluate(()=>(document.body?.innerText.match(/Aktionspreis:\s*([0-9.,]+)\s*€/s)||[])[1]||'');if(t&&t===prev)return t;prev=t;}return prev;}
async function selectHidden(page){return await page.evaluate(()=>{const all=[...document.querySelectorAll('*')];const h=all.find(x=>(x.textContent||'').trim()==='Verdeckt liegender Beschlag');if(!h)return {available:false,selected:false};let p=h;for(let i=0;i<8&&p;i++,p=p.parentElement){const items=[...p.querySelectorAll('.step-item')];const names=items.map(x=>(x.querySelector('.item-name')?.textContent||x.textContent||'').trim());if(names.includes('Nein')&&names.includes('Ja')&&items.length<=6){const y=items.find(x=>(x.querySelector('.item-name')?.textContent||x.textContent||'').trim()==='Ja');if(y){y.click();return {available:true,selected:true};}}}return {available:true,selected:false};});}
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});const out={};
for(const c of candidates){const page=await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1000}});try{
 await page.goto(c.url||'https://www.fensterblick.de/fenster-konfigurator.html',{waitUntil:'domcontentloaded',timeout:35000});await sleep(2500);await clearCookie(page);
 if(!c.url){await page.getByText(c.brand,{exact:true}).last().click({force:true,timeout:5000});await sleep(900);await clickItem(page,c.profile);}else{await clickItem(page,c.profile);}
 await page.getByText('Typ',{exact:true}).first().click({force:true});await clickItem(page,'Dreh-Kipp links');
 await page.getByText('Maße',{exact:true}).first().click({force:true});await sleep(300);const nums=page.locator('input[type=number]');
 await nums.nth(0).fill('1055');await nums.nth(0).dispatchEvent('change');await nums.nth(0).blur();await sleep(1600);
 await nums.nth(1).fill('1175');await nums.nth(1).dispatchEvent('change');await nums.nth(1).blur();await sleep(2200);
 await page.getByText('Glas',{exact:true}).first().click({force:true});await clickItem(page,'3-fach Verglasung (warme Kante)');await waitStable(page);
 await page.getByText('Zusätze',{exact:true}).first().click({force:true});await sleep(500);const hidden=await selectHidden(page);await waitStable(page);
 const summary=await page.evaluate(()=>({text:(document.body?.innerText.match(/Ihre Konfiguration:[\s\S]*?In meinen Warenkorb/)||[''])[0]}));
 let cart=null;try{await page.getByText('In meinen Warenkorb',{exact:false}).first().click({force:true});await sleep(2400);if(await page.locator('#cart-shipping-country').count()){await page.selectOption('#cart-shipping-country','150',{force:true});await sleep(1800);}if(await page.locator('#cart-shipping-module').count()){await page.selectOption('#cart-shipping-module','flat_flat',{force:true});await sleep(2200);}cart=await page.evaluate(()=>({text:(document.body?.innerText||'').slice(0,35000),country:document.querySelector('#cart-shipping-country')?.value||null,module:document.querySelector('#cart-shipping-module')?.value||null,url:location.href}));}catch(e){cart={error:String(e),url:page.url()};}
 out[c.key]={candidate:c,hidden,summary,cart};
 }catch(e){out[c.key]={candidate:c,error:String(e),url:page.url(),text:(await page.locator('body').innerText().catch(()=>'' )).slice(0,12000)}}await page.close();}
fs.writeFileSync('results/batch-de.json',JSON.stringify(out,null,2));await browser.close();})();
