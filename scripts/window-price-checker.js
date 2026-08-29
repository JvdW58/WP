const { chromium } = require('playwright');
const fs = require('fs');
fs.mkdirSync('results', { recursive: true });
(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1000}});
  const api=[];
  page.on('request', r=>{
    const u=r.url();
    if (u.includes('api.configurator.fensterblick.de')) api.push({kind:'request',method:r.method(),url:u,postData:r.postData()||null,headers:r.headers()});
  });
  page.on('response', async r=>{
    const u=r.url();
    if (u.includes('api.configurator.fensterblick.de')) {
      let body=null; try { body=(await r.text()).slice(0,200000); } catch{}
      api.push({kind:'response',status:r.status(),url:u,body});
    }
  });
  await page.goto('https://www.fensterblick.de/fenster-konfigurator.html?profile=205',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(4000);
  for (const txt of ['Alle akzeptieren','Akzeptieren','Accept all']) {
    const b=page.getByText(txt,{exact:false}).first();
    if (await b.count()) { try { await b.click({timeout:1000}); } catch{} }
  }
  await page.waitForTimeout(1000);
  try {
    const md=page.getByText('IDEAL Neo MD 76mm Cube',{exact:false}).last();
    if(await md.count()) { await md.click(); await page.waitForTimeout(1500); }
  } catch{}

  async function dump(tab){
    try { await page.getByText(tab,{exact:true}).first().click({timeout:5000}); await page.waitForTimeout(1200); } catch{}
    return await page.evaluate((tab)=>({
      tab,
      text:document.body.innerText.slice(0,50000),
      controls:[...document.querySelectorAll('input,select,button,label,[role=button],a')].map(x=>({
        tag:x.tagName,type:x.type||'',name:x.name||'',id:x.id||'',value:x.value||'',checked:!!x.checked,
        text:(x.innerText||x.textContent||'').trim().replace(/\s+/g,' ').slice(0,220),
        cls:String(x.className||''),html:x.outerHTML.slice(0,1400)
      })).filter(x=>/breit|width|höhe|height|maß|mas|dreh|kipp|fest|glas|fach|ug|abstand|warm|maco|verdeckt|hidden|beschlag|scharn|flügel|fluegel|1-fl|typ|zusatz|extra/i.test(JSON.stringify(x))).slice(0,500)
    }),tab);
  }
  const tabs={};
  for (const t of ['Profil','Typ','Maße','Farbe','Glas','Zusätze']) tabs[t]=await dump(t);
  const summary=await page.evaluate(()=>({
    text:document.body.innerText.slice(0,50000),
    html:document.querySelector('app-root')?.innerHTML.slice(0,200000)||''
  }));
  fs.writeFileSync('results/tab-inspect.json',JSON.stringify({tabs,summary,api},null,2));
  await browser.close();
})();
