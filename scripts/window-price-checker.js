const { chromium } = require('playwright');
const fs = require('fs');
fs.mkdirSync('results', { recursive: true });
(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1000}});
  const net=[];
  page.on('response', r=>{
    const u=r.url();
    if (/config|price|preis|ajax|cart|quote|product|option|shipping|versand|calculate|calc/i.test(u)) net.push({status:r.status(),url:u,ct:r.headers()['content-type']||''});
  });
  const url='https://www.fensterblick.de/fenster-konfigurator.html?profile=205';
  let err=null;
  try {
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForTimeout(3500);
    for (const txt of ['Alle akzeptieren','Akzeptieren','Accept all']) {
      const b=page.getByText(txt,{exact:false}).first();
      if (await b.count()) { try { await b.click({timeout:1000}); } catch{} }
    }
    await page.waitForTimeout(1000);
  } catch(e){err=String(e)}
  const data=await page.evaluate(()=>({
    title:document.title,url:location.href,
    inputs:[...document.querySelectorAll('input')].map(x=>({name:x.name,id:x.id,type:x.type,value:x.value,placeholder:x.placeholder,min:x.min,max:x.max,step:x.step,aria:x.getAttribute('aria-label'),outer:x.outerHTML.slice(0,600)})),
    selects:[...document.querySelectorAll('select')].map(x=>({name:x.name,id:x.id,value:x.value,options:[...x.options].map(o=>({text:o.text,value:o.value})).slice(0,100)})),
    clickable:[...document.querySelectorAll('button,a,label,[role=button]')].map(x=>({tag:x.tagName,text:(x.innerText||x.textContent||'').trim().replace(/\s+/g,' ').slice(0,180),href:x.href||'',id:x.id,cls:String(x.className||'')})).filter(x=>/preis|price|weiter|glas|verglas|beschlag|dreh|kipp|maß|breite|höhe|warm|abstand|maco|verdeckt|hidden|scharn/i.test(x.text+' '+x.href)).slice(0,300),
    prices:[...document.querySelectorAll('body *')].map(x=>(x.innerText||'').trim()).filter(t=>/(€|EUR|Preis|price)/i.test(t)&&t.length<180).slice(0,300),
    text:document.body.innerText.slice(0,40000)
  }));
  data.error=err; data.network=net.slice(-500);
  fs.writeFileSync('results/fast-inspect.json',JSON.stringify(data,null,2));
  await browser.close();
})();
