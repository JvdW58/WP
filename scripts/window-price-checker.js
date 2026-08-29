const fs=require('fs');fs.mkdirSync('results',{recursive:true});
(async()=>{
  const urls=['https://api.configurator.fensterblick.de/configurator/get-all-configurators','https://api.configurator.fensterblick.de/configurator/get-meta/1'];
  const out={};
  for(const u of urls){try{const r=await fetch(u);const t=await r.text();out[u]={status:r.status,text:t};}catch(e){out[u]={error:String(e)}}}
  const matches=[];
  for(const [u,v] of Object.entries(out)){
    const t=v.text||'';
    for(const q of ['Gealan S 9000 Light','Iglo Edge','Iglo Energy Classic','greenEvolution 76 MD']){
      let i=t.indexOf(q);while(i>=0){matches.push({url:u,q,context:t.slice(Math.max(0,i-1400),i+2200)});i=t.indexOf(q,i+1);if(matches.length>80)break;}
    }
  }
  fs.writeFileSync('results/api-profiles.json',JSON.stringify({matches,out:Object.fromEntries(Object.entries(out).map(([k,v])=>[k,{status:v.status,length:(v.text||'').length,error:v.error}]))},null,2));
})();
