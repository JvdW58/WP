const { chromium } = require('playwright');
const fs = require('fs'); fs.mkdirSync('results',{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1000}});
 await page.goto('https://www.fensterblick.de/fenster-konfigurator.html',{waitUntil:'domcontentloaded',timeout:45000}); await sleep(3000);
 for(const t of ['Alle akzeptieren','Akzeptieren']){try{const x=page.getByText(t,{exact:false}).first();if(await x.count())await x.click({timeout:1000})}catch{}}
 const clickItem=async(txt)=>{const s=page.locator('span.item-name',{hasText:txt}).last(); if(!await s.count()) throw new Error('not found '+txt); await s.locator('xpath=ancestor::div[contains(@class,"step-item")][1]').click(); await sleep(650)};
 const out={};
 for(const brand of ['aluplast','Gealan','Salamander','Drutex']){
   try{
     await page.getByText('Profil',{exact:true}).first().click(); await sleep(300);
     await clickItem(brand);
     out[brand]=await page.evaluate(()=>[...document.querySelectorAll('app-panel-step span.item-name')].map(x=>(x.textContent||'').trim()).filter(Boolean));
   }catch(e){out[brand]={error:String(e),text:(await page.locator('body').innerText()).slice(0,10000)}}
 }
 fs.writeFileSync('results/profiles.json',JSON.stringify(out,null,2));
 await browser.close();
})();
