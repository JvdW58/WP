const { chromium } = require('playwright');
const fs = require('fs'); fs.mkdirSync('results',{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1000}});
 const api=[];
 page.on('request',r=>{if(r.url().includes('api.configurator.fensterblick.de'))api.push({kind:'req',method:r.method(),url:r.url(),postData:r.postData()})});
 page.on('response',async r=>{if(r.url().includes('api.configurator.fensterblick.de')){let body='';try{body=(await r.text()).slice(0,100000)}catch{}api.push({kind:'res',status:r.status(),url:r.url(),body})}});
 await page.goto('https://www.fensterblick.de/fenster-konfigurator.html?profile=205',{waitUntil:'domcontentloaded',timeout:45000}); await sleep(4000);
 for(const t of ['Alle akzeptieren','Akzeptieren']){try{const x=page.getByText(t,{exact:false}).first();if(await x.count())await x.click({timeout:1000})}catch{}}
 await sleep(800);
 const clickItem=async(txt)=>{const s=page.locator('span.item-name',{hasText:txt}).last(); await s.locator('xpath=ancestor::div[contains(@class,"step-item")][1]').click(); await sleep(900)};
 await clickItem('IDEAL Neo MD 76mm Cube');
 await page.getByText('Typ',{exact:true}).first().click(); await sleep(400);
 await clickItem('Dreh-Kipp links');
 await page.getByText('Maße',{exact:true}).first().click(); await sleep(400);
 const nums=page.locator('input[type=number]');
 await nums.nth(0).fill('1055'); await nums.nth(0).dispatchEvent('change'); await nums.nth(0).blur(); await sleep(900);
 await nums.nth(1).fill('1175'); await nums.nth(1).dispatchEvent('change'); await nums.nth(1).blur(); await sleep(1200);
 await page.getByText('Glas',{exact:true}).first().click(); await sleep(400);
 await clickItem('3-fach Verglasung (warme Kante)');
 await page.getByText('Zusätze',{exact:true}).first().click(); await sleep(900);
 const dump=await page.evaluate(()=>({
   text:document.body.innerText.slice(0,50000),
   items:[...document.querySelectorAll('.step-item,.option-item,label,button,input')].map(x=>({tag:x.tagName,type:x.type||'',value:x.value||'',checked:!!x.checked,text:(x.innerText||x.textContent||'').trim().replace(/\s+/g,' ').slice(0,240),cls:String(x.className||''),outer:x.outerHTML.slice(0,1000)})).filter(x=>/maco|verdeckt|beschlag|scharn|band|power|griff|sicherheit|bohr/i.test(JSON.stringify(x))).slice(0,200),
   summary:(document.body.innerText.match(/Ihre Konfiguration:[\s\S]*?In meinen Warenkorb/)||[''])[0]
 }));
 fs.writeFileSync('results/neo-exact.json',JSON.stringify({dump,api},null,2));
 await browser.close();
})();
