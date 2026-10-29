(function(root){
  const families=['firearm','bow','blade','blunt','spear','throwable','sprayer','focus','plant','clock','shield','flexible','other'];
  const modes=['shot','swing','thrust','smash','throw','spray','beam','wave','grow','bind','ward','mend','time'];
  const payloads=['none','bullet','pellet','rocket','arrow','water','flame','seed','shard','bolt','orb','spore'];
  const paths=['straight','arc','spiral'];
  function infer(weapon={}){
    const text=(weapon.name||'')+' '+(weapon.type||'');
    let family=weapon.kind==='clock'?'clock':weapon.kind==='sword'?'blade':weapon.kind==='flower'?'plant':'other';
    for(const [pattern,value]of [[/분사|분무기|호스|물총|화염방사|spray|hose|flamethrower/i,'sprayer'],[/로켓|바주카|런처|rocket|bazooka|launcher|권총|소총|산탄총|기관총|저격총|총(?:$|\s)|gun|rifle|pistol/i,'firearm'],[/석궁|화살|활(?:$|\s)|보우|bow|crossbow/i,'bow'],[/시계|태엽|clock/i,'clock'],[/배트|망치|몽둥이|도끼|hammer|bat\b/i,'blunt'],[/검|칼|블레이드|sword|blade/i,'blade'],[/창|바늘|송곳|spear|needle/i,'spear'],[/수리검|부메랑|폭탄|boomerang|bomb/i,'throwable'],[/채찍|사슬|whip|chain/i,'flexible'],[/방패|우산|shield|umbrella/i,'shield'],[/꽃|식물|나뭇|flower|plant/i,'plant']])if(pattern.test(text)){family=value;break;}
    return{family,gripX:.3,gripY:.7,tipX:.9,tipY:.25};
  }
  function normalize(data,weapon={}){
    if(!data)return infer(weapon);
    if(!families.includes(data.family))throw Error('무기 작동 방식 형식 오류');
    const result={family:data.family};for(const key of ['gripX','gripY','tipX','tipY']){if(!Number.isFinite(data[key]))throw Error('무기 기준점 형식 오류');result[key]=Math.max(0,Math.min(1,data[key]));}
    if(Math.hypot(result.tipX-result.gripX,result.tipY-result.gripY)<.1)throw Error('손잡이와 끝점이 너무 가깝습니다');return result;
  }
  function delivery(data){
    if(!data||!modes.includes(data.mode)||!payloads.includes(data.payload)||!paths.includes(data.path))throw Error('발사체·동작 형식 오류');
    if(!Number.isFinite(data.count)||!Number.isFinite(data.spread))throw Error('발사체 수치 형식 오류');
    return{mode:data.mode,payload:data.payload,path:data.path,count:Math.round(Math.max(1,Math.min(6,data.count))),spread:Math.max(0,Math.min(30,data.spread))};
  }
  function forMove(move,weapon={}){
    const rig=normalize(weapon.rig,weapon),family=rig.family;
    let mode='wave',payload='orb',count=1,spread=0,path='straight';
    if(family==='clock')mode='time';
    else if(move.heal||move.rule?.kind==='recover')mode='mend';
    else if(move.rule?.kind==='protect'||move.mechanic?.kind==='field')mode='ward';
    else if(!move.damage)mode=['poison','burn','paralysis','attackDown','defenseDown'].includes(move.rule?.kind)?'bind':'ward';
    else if(family==='firearm'){mode='shot';payload=/로켓|바주카|런처|rocket|bazooka|launcher/i.test((weapon.name||'')+' '+(weapon.type||''))?'rocket':'bullet';}
    else if(family==='bow'){mode='shot';payload='arrow';}
    else if(family==='blade'){mode='swing';payload='none';}
    else if(family==='blunt'){mode='smash';payload='none';}
    else if(family==='shield'){mode='smash';payload='none';}
    else if(family==='spear'){mode='thrust';payload='none';}
    else if(family==='throwable'){mode='throw';payload='none';path='arc';}
    else if(family==='sprayer'){mode='spray';payload=move.element==='fire'?'flame':'water';count=6;spread=16;}
    else if(family==='flexible'){mode='bind';payload='none';}
    else if(family==='plant'){mode='shot';payload='seed';count=3;spread=12;path='arc';}
    else if(move.vfx?.motion==='beam')mode='beam';
    const result=move.delivery?delivery(move.delivery):{mode,payload,count,spread,path};
    // A gun/bow may be used as a club, but never replaces its ammunition in flight.
    if(['firearm','bow'].includes(family)&&result.mode==='throw')result.mode='shot';
    if(family==='firearm'&&result.mode==='shot'&&!['bullet','pellet','rocket','bolt'].includes(result.payload))result.payload=payload==='rocket'?'rocket':'bullet';
    if(family==='firearm'&&result.mode==='shot'&&/로켓|바주카|런처|rocket|bazooka|launcher/i.test((weapon.name||'')+' '+(weapon.type||'')))result.payload='rocket';
    if(family==='bow'&&result.mode==='shot')result.payload='arrow';
    if(result.mode==='shot'&&result.payload==='none')result.payload='orb';
    return{rig,...result};
  }
  const api={families,modes,payloads,paths,normalize,delivery,forMove,infer};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Craft.WeaponRig=api;
})(typeof window!=='undefined'?window:globalThis);

