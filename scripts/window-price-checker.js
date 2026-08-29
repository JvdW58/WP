const { chromium } = require('playwright');
const fs = require('fs'); fs.mkdirSync('results',{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1000}});
 await page.goto('https://www.fensterblick.de/fenster-konfigurator.html?profile=205',{waitUntil:'domcontentloaded',timeout:45000}); await sleep(4000);
 for(const t of ['Alle akzeptieren','Akzeptieren']){try{const x=page.getByText(t,{exact:false}).first();if(await x.count())await x.click({timeout:1000})}catch{}}
 await sleep(700);
 try{await page.getByText('IDEAL Neo MD 76mm Cube',{exact:false}).last().click({timeout:5000});await sleep(800)}catch{}
 await page.getByText('Typ',{exact:true}).first().click(); await sleep(500);
 const typDump=await page.evaluate(()=>({
   text:document.body.innerText.slice(0,22000),
   matches:[...document.querySelectorAll('*')].filter(x=>/Dreh-Kipp links|1-Flügel/.test((x.textContent||'').trim()) && (x.textContent||'').trim().length<120).map(x=>({tag:x.tagName,role:x.getAttribute('role'),cls:String(x.className||''),text:(x.textContent||'').trim(),outer:x.outerHTML.slice(0,1400)})).slice(0,80)
 }));
 await page.getByText('Maße',{exact:true}).first().click(); await sleep(500);
 const massDump=await page.evaluate(()=>({
   text:document.body.innerText.slice(0,22000),
   inputs:[...document.querySelectorAll('input')].map(x=>({type:x.type,name:x.name,id:x.id,value:x.value,placeholder:x.placeholder,min:x.min,max:x.max,step:x.step,cls:String(x.className||''),outer:x.outerHTML.slice(0,1200)})),
   near:[...document.querySelectorAll('*')].filter(x=>/Breite|Höhe|Zulässiger Bereich/.test((x.textContent||'').trim()) && (x.textContent||'').trim().length<250).map(x=>({tag:x.tagName,cls:String(x.className||''),text:(x.textContent||'').trim(),outer:x.outerHTML.slice(0,1800)})).slice(0,120)
 }));
 fs.writeFileSync('results/dom-inspect.json',JSON.stringify({typDump,massDump},null,2));
 await browser.close();
})();
