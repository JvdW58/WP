const {chromium}=require('playwright'); const fs=require('fs'); fs.mkdirSync('results',{recursive:true}); const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function cookies(page){for(const t of ['Alle akzeptieren','Akzeptieren','Alles akzeptieren','Ich akzeptiere','Zustimmen','NUR TECHNISCH NOTWENDIGE']){try{let x=page.getByText(t,{exact:false}).first();if(await x.count())await x.click({force:true,timeout:700})}catch{}}}
async function dfs(browser,key,profile,direct){const page=await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1200}});let o={key,shop:'Deutscher Fenstershop',profile};try{await page.goto(direct||'https://deutscher-fenstershop.de/konfigurator/fenster',{waitUntil:'domcontentloaded',timeout:35000});await sleep(3000);await cookies(page);
 if(!direct){
  await page.getByText('2 Hersteller & Profile',{exact:false}).first().click({force:true}); await sleep(800);
  // click desired profile card directly; text uniquely identifies profile
  let p=page.getByText(profile,{exact:false}).last(); if(!await p.count()) throw new Error('profile not found '+profile); await p.click({force:true}); await sleep(1000);
  await page.getByText('3 Fenstertyp',{exact:false}).first().click({force:true}); await sleep(500); let one=page.getByText('Einteiliges Fenster',{exact:false}).last(); if(await one.count()) await one.click({force:true}); await sleep(700);
 }
 await page.getByText('4 Maße & Öffnungsart',{exact:false}).first().click({force:true}); await sleep(500);
 let dk=page.getByText('Dreh/Kipp L',{exact:true}).last(); if(!await dk.count()) dk=page.getByText('Dreh/Kipp L',{exact:false}).last(); await dk.click({force:true}); await sleep(600);
 await page.locator('#input-width').fill('1055'); await page.locator('#input-width').dispatchEvent('change'); await page.locator('#input-width').blur(); await sleep(600);
 await page.locator('#input-height').fill('1175'); await page.locator('#input-height').dispatchEvent('change'); await page.locator('#input-height').blur(); await sleep(1300);
 await page.getByText('6 Verglasung',{exact:false}).first().click({force:true}); await sleep(700);
 const glassTexts=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(x=>x.offsetParent!==null&&x.children.length===0).map(x=>(x.textContent||'').trim()).filter(x=>/3-fach|Ug\s*=?\s*0[,.]5/i.test(x)).slice(0,120));
 let g=page.getByText(/3-fach.*0[,.]5/i).last(); if(!await g.count()) g=page.getByText(/3-fach/i).last(); if(await g.count()){await g.click({force:true}); await sleep(1000);}
 await page.getByText('8 Beschläge & Zubehör',{exact:false}).first().click({force:true}); await sleep(700);
 const hardwareText=(await page.locator('body').innerText()).match(/.{0,100}(verdeckt|unsichtbar).{0,180}/ig)||[]; let concealed=false;
 for(const rx of [/verdeckt[^\n]{0,120}/i,/unsichtbar[^\n]{0,120}/i]){let x=page.getByText(rx).last(); if(await x.count()){try{await x.click({force:true});concealed=true;await sleep(800);break}catch{}}}
 const text=await page.locator('body').innerText(); const priceMatches=[...text.matchAll(/PREIS\s*([0-9.,]+)\s*€\s*([0-9.,]+)\s*€/g)]; const single=[...text.matchAll(/PREIS\s*([0-9.,]+)\s*€/g)];
 const summary=(text.match(/IHRE KONFIGURATION[\s\S]*?Lieferzeit[\s\S]*?(?=Versand|Haben Sie|$)/)||[''])[0];
 o={...o,url:page.url(),glassTexts,hardwareText,concealed,summary,pricePair:priceMatches.length?priceMatches.at(-1).slice(1):null,priceSingle:single.length?single.at(-1)[1]:null};
 }catch(e){o.error=String(e);o.url=page.url();o.text=(await page.locator('body').innerText().catch(()=>'' )).slice(0,15000)} await page.close();return o}
async function boss(browser){const page=await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1200}});let o={key:'boss-green',shop:'Bossmann',profile:'Salamander greenEvolution 76 MD Basic'};try{await page.goto('https://bossmann-store.de/Salamander-greenEvolution-76-MD-Basic-Kunststoff/FENS-110.40-MAT',{waitUntil:'domcontentloaded',timeout:35000});await sleep(3500);await cookies(page);
 const nums=page.locator('input[type=number]').filter({hasNot:page.locator('[name*=quantity]')}); const all=page.locator('input[type=number]');
 // first two number fields are dimensions on this product
 await all.nth(0).fill('1055');await all.nth(0).dispatchEvent('input');await all.nth(0).dispatchEvent('change');await all.nth(0).blur();await sleep(800);
 await all.nth(1).fill('1175');await all.nth(1).dispatchEvent('input');await all.nth(1).dispatchEvent('change');await all.nth(1).blur();await sleep(1200);
 await page.selectOption('#oeffnungsrichtung','a');await sleep(900); const text=await page.locator('body').innerText();const m=text.match(/Brutto:\s*([0-9.,]+)\s*€/);o={...o,url:page.url(),price:m?m[1]:null,summary:(text.match(/Brutto:[\s\S]*?Produktnummer:/)||[''])[0].slice(0,5000),triple:/Verglasung:\s*3-fach/.test(text),ug05:/Ug-Wert von 0,5/.test(text),concealed:false};
 }catch(e){o.error=String(e);o.url=page.url();o.text=(await page.locator('body').innerText().catch(()=>'' )).slice(0,15000)}await page.close();return o}
async function wds(browser,key,brand,profile){const page=await browser.newPage({locale:'de-DE',viewport:{width:1440,height:1200}});let o={key,shop:"W&D'S 2000 Hamburg",profile};try{await page.goto('https://wds2000.de/index.php?route=configurators/window',{waitUntil:'domcontentloaded',timeout:35000});await sleep(3200);await cookies(page);
 const click=async(txt)=>{const x=page.getByText(txt,{exact:true}).last();if(!await x.count())throw new Error('not found '+txt);await x.click({force:true});await sleep(650)};
 await click('KUNSTSTOFF');await click(brand);await click(profile);try{await click('WEISS')}catch{};try{await click('EINTEILIG')}catch{};await sleep(800);
 const text1=await page.locator('body').innerText();
 // opening option: choose first visible text containing DREH and KIPP and LINKS
 let op=page.getByText(/DREH.*KIPP.*LINK/i).last(); if(!await op.count()) op=page.getByText(/DREH-KIPP/i).last(); if(await op.count()){await op.click({force:true});await sleep(700)}
 // reveal size section if needed
 const more=page.getByText('Mehr...',{exact:true}); if(await more.count()){try{await more.last().click({force:true});await sleep(500)}catch{}}
 const inputs=page.locator('input:visible');const inputInfo=await inputs.evaluateAll(xs=>xs.map(x=>({type:x.type,name:x.name,id:x.id,value:x.value,placeholder:x.placeholder,min:x.min,max:x.max,outer:x.outerHTML})));
 // pick dimension number/text inputs by nearby labels or numeric range; otherwise first two empty numeric/text after config selection
 let dimLocs=[];for(let i=0;i<await inputs.count();i++){const x=inputs.nth(i);const inf=await x.evaluate(el=>({type:el.type,name:el.name,id:el.id,ph:el.placeholder,parent:(el.parentElement?.innerText||'')}));if(/breit|width|höhe|height|mm|maß|mass/i.test(JSON.stringify(inf)) && ['number','text'].includes(inf.type))dimLocs.push(x)}
 if(dimLocs.length<2){for(let i=0;i<await inputs.count();i++){let x=inputs.nth(i);let t=await x.getAttribute('type');if(['number','text'].includes(t||'text'))dimLocs.push(x);if(dimLocs.length>=2)break}}
 if(dimLocs.length>=2){await dimLocs[0].fill('1055');await dimLocs[0].dispatchEvent('input');await dimLocs[0].dispatchEvent('change');await dimLocs[0].blur();await sleep(600);await dimLocs[1].fill('1175');await dimLocs[1].dispatchEvent('input');await dimLocs[1].dispatchEvent('change');await dimLocs[1].blur();await sleep(1000)}
 // choose 3-fold if visible
 let gl=page.getByText(/3[- ]?FACH/i).last();if(await gl.count()){try{await gl.click({force:true});await sleep(800)}catch{}}
 const text=await page.locator('body').innerText();o={...o,url:page.url(),inputInfo,text:text.slice(0,20000),priceSnips:(text.match(/.{0,100}Preis.{0,180}/ig)||[]).slice(0,20)};
 }catch(e){o.error=String(e);o.url=page.url();o.text=(await page.locator('body').innerText().catch(()=>'' )).slice(0,18000)}await page.close();return o}
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});const results=await Promise.all([
 dfs(browser,'dfs-neo','Ideal Neo MD 76mm','https://deutscher-fenstershop.de/konfigurator/fenster?pid=455688'),
 dfs(browser,'dfs-energy','Iglo Energy Classic',null),
 dfs(browser,'dfs-edge','Iglo Edge',null),
 boss(browser),
 wds(browser,'wds-neo','ALUPLAST','IDEAL NEO MD'),
 wds(browser,'wds-s9000','GEALAN','S 9000'),
 wds(browser,'wds-green','SALAMANDER','GREENEVOLUTION 76')
]);fs.writeFileSync('results/exact-other-shops.json',JSON.stringify(results,null,2));await browser.close();})();
