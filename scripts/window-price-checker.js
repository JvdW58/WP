const { chromium } = require('playwright');
const fs = require('fs'); fs.mkdirSync('results',{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1000}});
 const log=[]; page.on('request',r=>{if(r.url().includes('api.configurator.fensterblick.de'))log.push({kind:'req',method:r.method(),url:r.url(),postData:r.postData()})});
 page.on('response',async r=>{if(r.url().includes('api.configurator.fensterblick.de')){let b='';try{b=(await r.text()).slice(0,60000)}catch{}log.push({kind:'res',status:r.status(),url:r.url(),body:b})}});
 await page.goto('https://www.fensterblick.de/fenster-konfigurator.html?profile=205',{waitUntil:'domcontentloaded',timeout:45000}); await sleep(4000);
 for(const t of ['Alle akzeptieren','Akzeptieren']){try{let x=page.getByText(t,{exact:false}).first();if(await x.count())await x.click({timeout:1000})}catch{}}
 await sleep(800);
 // Neo MD
 try{await page.getByText('IDEAL Neo MD 76mm Cube',{exact:false}).last().click({timeout:5000});await sleep(1000)}catch(e){}
 // type and opening
 await page.getByText('Typ',{exact:true}).first().click(); await sleep(500);
 await page.getByText('1-Flügel',{exact:false}).last().click(); await sleep(500);
 await page.getByText('Dreh-Kipp links',{exact:false}).last().click(); await sleep(1000);
 // dimensions
 await page.getByText('Maße',{exact:true}).first().click(); await sleep(500);
 const nums=page.locator('app-root input[type=number]');
 await nums.nth(0).fill('1055'); await nums.nth(0).blur(); await sleep(800);
 await nums.nth(1).fill('1175'); await nums.nth(1).blur(); await sleep(1200);
 // glazing warm edge triple
 await page.getByText('Glas',{exact:true}).first().click(); await sleep(500);
 await page.getByText('3-fach Verglasung (warme Kante)',{exact:false}).last().click(); await sleep(1200);
 // extras
 await page.getByText('Zusätze',{exact:true}).first().click(); await sleep(1000);
 const extras=await page.evaluate(()=>document.body.innerText.slice(0,50000));
 const controls=await page.evaluate(()=>[...document.querySelectorAll('app-root input,app-root button,app-root label,app-root [role=button]')].map(x=>({tag:x.tagName,type:x.type||'',value:x.value||'',checked:!!x.checked,text:(x.innerText||x.textContent||'').trim().replace(/\s+/g,' ').slice(0,240),html:x.outerHTML.slice(0,1200)})).filter(x=>/maco|verdeckt|beschlag|scharn|sicherheit|griff|band|power/i.test(JSON.stringify(x))));
 const summary=await page.evaluate(()=>document.body.innerText.match(/Ihre Konfiguration:[\s\S]*?In meinen Warenkorb/)?.[0]||document.body.innerText.slice(0,20000));
 fs.writeFileSync('results/neo-config.json',JSON.stringify({extras,controls,summary,log},null,2));
 await browser.close();
})();
