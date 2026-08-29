const { chromium } = require('playwright');
const fs = require('fs');
fs.mkdirSync('results', { recursive: true });

const pages = [
  ['fensterblick-neo','https://www.fensterblick.de/aluplast-ideal-neo.html'],
  ['fensterblick-edge','https://www.fensterblick.de/drutex-iglo-edge.html'],
  ['fensterblick-config','https://www.fensterblick.de/fenster-konfigurator.html?profile=205'],
  ['kozijnenblik-neo','https://www.kozijnenblik.nl/aluplast-ideal-neo.html'],
  ['kozijnenblik-edge','https://www.kozijnenblik.nl/drutex-iglo-edge.html']
];

(async()=>{
  const browser = await chromium.launch({headless:true});
  const context = await browser.newContext({locale:'de-DE', viewport:{width:1440,height:1200}});
  for (const [name,url] of pages) {
    const page = await context.newPage();
    const net=[];
    page.on('response', async r=>{
      const u=r.url();
      if (/config|price|preis|ajax|cart|quote|product|option|shipping|versand/i.test(u)) net.push({status:r.status(),url:u,ct:r.headers()['content-type']||''});
    });
    let err=null;
    try {
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
      await page.waitForTimeout(5000);
      for (const txt of ['Alle akzeptieren','Akzeptieren','Accept all','Alles accepteren','Accepteren']) {
        const b=page.getByText(txt,{exact:false}).first();
        if (await b.count()) { try { await b.click({timeout:1500}); } catch{} }
      }
      await page.waitForTimeout(1500);
    } catch(e){ err=String(e); }
    const data=await page.evaluate(()=>({
      title:document.title,url:location.href,
      inputs:[...document.querySelectorAll('input')].map(x=>({name:x.name,id:x.id,type:x.type,value:x.value,placeholder:x.placeholder,aria:x.getAttribute('aria-label')})),
      selects:[...document.querySelectorAll('select')].map(x=>({name:x.name,id:x.id,value:x.value,html:x.outerHTML.slice(0,1000)})),
      buttons:[...document.querySelectorAll('button,a')].map(x=>({tag:x.tagName,text:(x.innerText||'').trim().replace(/\s+/g,' ').slice(0,180),href:x.href||'',id:x.id,cls:x.className})).filter(x=>/preis|price|bereken|konfigur|configur|warenkorb|cart|weiter|next|glas|verglas|beschlag|scharn|dreh|kipp|maß|mas|breed|hoog|höhe/i.test(x.text+' '+x.href)).slice(0,250),
      euro:[...document.querySelectorAll('body *')].map(x=>(x.innerText||'').trim()).filter(t=>/€|EUR/.test(t)&&t.length<220).slice(0,300),
      text:document.body.innerText.slice(0,30000)
    }));
    data.error=err; data.network=net.slice(-400);
    fs.writeFileSync(`results/${name}.json`,JSON.stringify(data,null,2));
    await page.screenshot({path:`results/${name}.png`,fullPage:true});
    await page.close();
  }
  await browser.close();
})();
