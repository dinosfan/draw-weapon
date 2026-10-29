(function(root){
 const fixtures=[
  {id:'ball',name:'손바느질 야구공',note:'원본 자체를 투척',asset:'ball',size:66,grip:[.5,.5],moves:[
   {name:'강속 직구',element:'normal',detail:'실밥이 보이는 원본 공이 빠르게 회전하며 직선으로 꽂힌다.',path:'line',duration:1050,flight:260,spin:8,impact:'slam',damage:32},
   {name:'바깥쪽 커브',element:'normal',detail:'원본 공이 바깥으로 크게 휘었다가 수호자 옆으로 꺾여 들어온다.',path:'curve',duration:1500,flight:650,spin:12,impact:'slam',damage:28},
   {name:'바운드 볼',element:'ground',detail:'공이 바닥을 두 번 튕긴다. 착지 먼지와 공의 위치가 함께 움직인다.',path:'bounce',duration:1700,flight:850,spin:7,impact:'dust',damage:26},
   {name:'높이 뜬 플라이',element:'flying',detail:'공이 화면 위로 솟은 뒤 그림자가 좁아지며 수직으로 떨어진다.',path:'drop',duration:2100,flight:1100,spin:5,impact:'slam',damage:40}]},
  {id:'gun',name:'네모난 낙서 권총',note:'본체 유지 · 탄약 발사',asset:'gun',size:100,hold:{x:298,y:260,angle:-.2},muzzle:{x:329,y:237},grip:[.36,.66],moves:[
   {name:'한 발의 정밀 사격',element:'metal',detail:'총은 손에 남는다. 총구에서 작은 탄두가 출발하고 탄피는 뒤로 떨어진다.',path:'line',duration:1100,flight:180,spin:0,impact:'pierce',damage:30,emission:'bullet'},
   {name:'세 번의 방아쇠',element:'metal',detail:'총구 반동과 함께 세 발을 시간차로 발사한다. 명중도 세 번 따로 일어난다.',path:'line',duration:1600,flight:210,spin:0,impact:'pierce',damage:33,emission:'bullet',count:3,spacing:150},
   {name:'관통 탄두',element:'metal',detail:'가늘고 긴 탄두가 수호자를 통과한다. 폭발 대신 짧은 관통 흔적을 남긴다.',path:'pierce',duration:1250,flight:250,spin:0,impact:'pierce',damage:36,emission:'bullet',scale:.75},
   {name:'도탄 사격',element:'metal',detail:'아래쪽 바닥에 먼저 부딪힌 탄환이 각도를 바꾸어 수호자에게 튄다.',path:'ricochet',duration:1550,flight:700,spin:0,impact:'pierce',damage:29,emission:'bullet'}]},
  {id:'bird',name:'접힌 날개의 종이 낙서',note:'자유 낙서 · 접힘과 활공',asset:'bird',size:94,grip:[.35,.62],moves:[
   {name:'접힌 날개의 활공',element:'flying',detail:'그린 종이새 자체가 넓은 곡선을 따라 활공하고 손으로 돌아온다.',path:'glide',duration:2000,flight:900,spin:0,impact:'paper',damage:24,returns:true},
   {name:'종이 조각 소나기',element:'flying',detail:'종이새는 손에 남고 접힌 종이 조각 다섯 장이 서로 다른 궤적으로 퍼진다.',path:'curve',duration:1850,flight:750,spin:5,impact:'paper',damage:27,emission:'paper',count:5,spacing:55,spread:32},
   {name:'나선 급강하',element:'flying',detail:'종이새가 크게 한 바퀴 말려 들어간 뒤 뾰족한 부리부터 급강하한다.',path:'spiral',duration:2100,flight:1100,spin:1,impact:'paper',damage:34,returns:true},
   {name:'접힌 바람의 칼날',element:'flying',detail:'종이새의 접힌 면을 따라 얇은 종이 날 세 장이 빠르게 연달아 날아간다.',path:'line',duration:1500,flight:400,spin:0,impact:'paper',damage:30,emission:'paper',count:3,spacing:90,scale:.65}]}
 ];
 const api={fixtures};if(typeof module!=='undefined'&&module.exports)module.exports=api;else Object.assign(root.IdentityLab,api);
})(typeof window!=='undefined'?window:globalThis);

