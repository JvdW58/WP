const { chromium } = require('playwright');
const fs = require('fs'); fs.mkdirSync('results',{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1000}});
 await page.goto('https://www.fensterblick.de/fenster-konfigurator.html?profile=205',{waitUntil:'domcontentloaded',timeout:45000}); await sleep(3000);
 for(const t of ['Alle akzeptieren','Akzeptieren']){try{const x=page.getByText(t,{exact:false}).first();if(await x.count())await x.click({timeout:1000})}catch{}}
 const clickItem=async(txt)=>{const s=page.locator('span.item-name',{hasText:txt}).last(); await s.locator('xpath=ancestor::div[contains(@class,"step-item")][1]').click(); await sleep(500)};
 await clickItem('IDEAL Neo MD 76mm Cube');
 await page.getByText('Typ',{exact:true}).first().click(); await clickItem('Dreh-Kipp links');
 await page.getByText('Maße',{exact:true}).first().click(); await sleep(250);
 const nums=page.locator('input[type=number]');
 for (const [i,v] of [[0,'1055'],[1,'1175']]) { await nums.nth(i).fill(v); await nums.nth(i).dispatchEvent('change'); await nums.nth(i).blur(); await sleep(600); }
 await page.getByText('Glas',{exact:true}).first().click(); await clickItem('3-fach Verglasung (warme Kante)');
 await page.getByText('Zusätze',{exact:true}).first().click(); await sleep(350);
 const hiddenPanel=page.locator('app-panel-step',{hasText:'Verdeckt liegender Beschlag'}).first();
 const yes=hiddenPanel.locator('.step-item').filter({hasText:/^\s*Ja\s*$/}).first();
 let hiddenSelected=false;
 if(await yes.count()) { await yes.click(); hiddenSelected=true; await sleep(800); }
 const configured=await page.evaluate((hiddenSelected)=>({summary:(document.body?.innerText.match(/Ihre Konfiguration:[\s\S]*?In meinen Warenkorb/)||[''])[0],url:location.href,hiddenSelected}),hiddenSelected);
 fs.writeFileSync('results/configured.json',JSON.stringify(configured,null,2));
 try {
   await page.getByText('In meinen Warenkorb',{exact:false}).first().click(); await sleep(2500);
   await page.evaluate(()=>{const s=document.querySelector('#cart-shipping-country'); if(s){s.value='150';s.dispatchEvent(new Event('change',{bubbles:true}));}}); await sleep(1800);
   await page.evaluate(()=>{const s=document.querySelector('#cart-shipping-module'); if(s){s.value='flat_flat';s.dispatchEvent(new Event('change',{bubbles:true}));}}); await sleep(2200);
   const cart=await page.evaluate(()=>({url:location.href,text:(document.body?.innerText||'').slice(0,60000),country:document.querySelector('#cart-shipping-country')?.value||null,module:document.querySelector('#cart-shipping-module')?.value||null}));
   fs.writeFileSync('results/cart-nl-delivery.json',JSON.stringify(cart,null,2));
 } catch(e) { fs.writeFileSync('results/cart-error.txt',String(e)+'\nURL='+page.url()); }
 await browser.close();
})();
