const { chromium } = require('playwright');
const fs=require('fs');fs.mkdirSync('results',{recursive:true});const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1000}});try{
 await page.goto('https://www.fensterblick.de/fenster-konfigurator.html',{waitUntil:'domcontentloaded',timeout:35000});await sleep(3000);
 for(const t of ['Alle akzeptieren','Akzeptieren']){try{const x=page.getByText(t,{exact:false}).first();if(await x.count())await x.click({timeout:1200,force:true})}catch{}}
 await page.getByText('Gealan',{exact:true}).last().click({force:true});await sleep(900);
 await page.evaluate(()=>{const items=[...document.querySelectorAll('.step-item')].filter(x=>x.offsetParent!==null);const h=items.find(x=>(x.querySelector('.item-name')?.textContent||'').trim()==='Gealan S 9000 Light');if(!h)throw new Error('profile not found');h.click();});await sleep(900);
 await page.getByText('Typ',{exact:true}).first().click({force:true});await page.getByText('Dreh-Kipp links',{exact:false}).last().click({force:true});await sleep(900);
 await page.getByText('Maße',{exact:true}).first().click({force:true});await sleep(900);
 const dump=await page.evaluate(()=>({text:(document.body?.innerText||'').slice(0,18000),controls:[...document.querySelectorAll('input,select,textarea')].map(x=>({tag:x.tagName,type:x.type||'',name:x.name||'',id:x.id||'',value:x.value||'',min:x.min||'',max:x.max||'',step:x.step||'',placeholder:x.placeholder||'',outer:x.outerHTML.slice(0,1000)})),buttons:[...document.querySelectorAll('button,.step-item')].filter(x=>x.offsetParent!==null).map(x=>({tag:x.tagName,text:(x.innerText||x.textContent||'').trim().replace(/\s+/g,' ').slice(0,240),outer:x.outerHTML.slice(0,800)})).filter(x=>/500|1055|1175|breite|höhe|mm/i.test(JSON.stringify(x))).slice(0,120)}));
 fs.writeFileSync('results/lumaxx-controls.json',JSON.stringify(dump,null,2));
}catch(e){fs.writeFileSync('results/error.txt',String(e)+'\n'+(await page.locator('body').innerText().catch(()=>'' )).slice(0,14000));}await browser.close();})();
