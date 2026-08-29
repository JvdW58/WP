const fs=require('fs');fs.mkdirSync('results',{recursive:true});
(async()=>{
 const u='https://api.configurator.fensterblick.de/configurations/init-configuration';
 const bodies=[
  {configurator_id:1,selectedIds:{profile:null,material:null},country:'GERMANY'},
  {configurator_id:1,selectedIds:{profile:null,material:'10'},country:'GERMANY'}
 ];
 const out=[];
 for(const body of bodies){try{const r=await fetch(u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const t=await r.text();const matches=[];for(const q of ['Gealan S 9000 Light','Iglo Edge','Iglo Energy Classic','greenEvolution 76 MD','IDEAL Neo MD 76mm Cube']){let i=t.indexOf(q);while(i>=0){matches.push({q,context:t.slice(Math.max(0,i-1800),i+2600)});i=t.indexOf(q,i+1);if(matches.length>100)break;}}out.push({body,status:r.status,length:t.length,matches});}catch(e){out.push({body,error:String(e)})}}
 fs.writeFileSync('results/init-profiles.json',JSON.stringify(out,null,2));
})();
