const { chromium } = require('playwright');
const fs = require('fs'); fs.mkdirSync('results',{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'}); const out={};
 for(const brand of ['aluplast','Gealan','Salamander','Drutex']){
   const page=await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1000}});
   try{
     await page.goto('https://www.fensterblick.de/fenster-konfigurator.html',{waitUntil:'domcontentloaded',timeout:30000}); await sleep(2200);
     for(const t of ['Alle akzeptieren','Akzeptieren']){try{const x=page.getByText(t,{exact:false}).first();if(await x.count())await x.click({timeout:700})}catch{}}
     const s=page.locator('span.item-name',{hasText:brand}).last();
     await s.locator('xpath=ancestor::div[contains(@class,"step-item")][1]').click({timeout:4000}); await sleep(800);
     out[brand]=await page.evaluate(()=>[...document.querySelectorAll('span.item-name')].map(x=>(x.textContent||'').trim()).filter(Boolean));
   }catch(e){out[brand]={error:String(e),text:(await page.locator('body').innerText()).slice(0,7000)}}
   await page.close();
 }
 fs.writeFileSync('results/profiles.json',JSON.stringify(out,null,2)); await browser.close();
})();
