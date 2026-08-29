const { chromium } = require('playwright');
const fs = require('fs'); fs.mkdirSync('results',{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1000}});
 await page.goto('https://www.fensterblick.de/fenster-konfigurator.html?profile=205',{waitUntil:'domcontentloaded',timeout:45000}); await sleep(4000);
 for(const t of ['Alle akzeptieren','Akzeptieren']){try{const x=page.getByText(t,{exact:false}).first();if(await x.count())await x.click({timeout:1000})}catch{}}
 const clickItem=async(txt)=>{const s=page.locator('span.item-name',{hasText:txt}).last(); await s.locator('xpath=ancestor::div[contains(@class,"step-item")][1]').click(); await sleep(900)};
 await clickItem('IDEAL Neo MD 76mm Cube');
 await page.getByText('Typ',{exact:true}).first().click(); await clickItem('Dreh-Kipp links');
 await page.getByText('Maße',{exact:true}).first().click(); await sleep(300);
 const nums=page.locator('input[type=number]');
 for (const [i,v] of [[0,'1055'],[1,'1175']]) { await nums.nth(i).fill(v); await nums.nth(i).dispatchEvent('change'); await nums.nth(i).blur(); await sleep(900); }
 await page.getByText('Glas',{exact:true}).first().click(); await clickItem('3-fach Verglasung (warme Kante)');
 await page.getByText('Zusätze',{exact:true}).first().click(); await sleep(500);
 const hiddenPanel=page.locator('app-panel-step',{hasText:'Verdeckt liegender Beschlag'}).first();
 const yes=hiddenPanel.locator('.step-item').filter({hasText:/^\s*Ja\s*$/}).first();
 if(await yes.count()) { await yes.click(); await sleep(1200); }
 const configured=await page.evaluate(()=>({summary:(document.body.innerText.match(/Ihre Konfiguration:[\s\S]*?In meinen Warenkorb/)||[''])[0],url:location.href}));
 // cart
 await page.getByText('In meinen Warenkorb',{exact:false}).first().click(); await sleep(2500);
 const cart=await page.evaluate(()=>({url:location.href,text:document.body.innerText.slice(0,40000),inputs:[...document.querySelectorAll('input,select,button')].map(x=>({tag:x.tagName,type:x.type||'',name:x.name||'',id:x.id||'',value:x.value||'',placeholder:x.placeholder||'',text:(x.innerText||x.textContent||'').trim().slice(0,150),outer:x.outerHTML.slice(0,800)})).filter(x=>/plz|post|zip|land|country|versand|shipping|liefer|adresse|address|weiter|checkout|kasse/i.test(JSON.stringify(x))).slice(0,200)}));
 fs.writeFileSync('results/neo-hidden-cart.json',JSON.stringify({configured,cart},null,2));
 await browser.close();
})();
