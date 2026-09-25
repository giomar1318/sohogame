(() => {
'use strict';
const $ = id => document.getElementById(id);
const types = [
 {emoji:'🦴',points:10,weight:24},{emoji:'🍪',points:20,weight:23},
 {emoji:'🥩',points:30,weight:17},{emoji:'⭐',points:50,weight:9},
 {emoji:'🍫',bad:true,weight:6},{emoji:'🧅',bad:true,weight:6},{emoji:'🍇',bad:true,weight:6},
 {emoji:'🌈',special:'double',weight:5},{emoji:'✨',special:'power',weight:4}
];
let best=0, best2=0, level2Unlocked=false, badgeEarned=false, sound=true, audio;
try{best2=Number(localStorage.getItem('snack-best-2'))||0;level2Unlocked=localStorage.getItem('snack-level-2')==='yes';badgeEarned=localStorage.getItem('snack-picnic-badge')==='yes';}catch{}
const duration=()=>state.level===2?35:30;
const levelBest=()=>state.level===2?best2:best;
function saveProgress(){try{localStorage.setItem('snack-level-2',level2Unlocked?'yes':'no');localStorage.setItem('snack-picnic-badge',badgeEarned?'yes':'no');}catch{}}
function levelUI(){document.querySelectorAll('[data-level]').forEach(b=>{const n=Number(b.dataset.level);b.disabled=n===2&&!level2Unlocked;b.setAttribute('aria-pressed',String(state.level===n));});$('level-2').textContent=level2Unlocked?'2 · 피크닉 대작전':'🔒 2 · 간식 10개로 열기';$('level-hint').textContent=state.level===2?'35초 안에 15개! 바구니가 나오면 함께 받아요.':'한 판에 간식 10개를 모으면 2레벨이 열려요.';}
try{best=Number(localStorage.getItem('snack-best'))||0;sound=localStorage.getItem('snack-sound')!=='off';}catch{}
const state={level:1,basketUntil:0,basketStage:0,screen:'home',selected:'takju',score:0,lives:3,elapsed:0,x:.5,items:[],doubleUntil:0,invincible:0,powerUntil:0,count:0,spawn:0,paused:false,collected:0,streak:0,catchUntil:0,cheerUntil:0};
let keys=new Set(), held=new Set(), dragging=false,last=0,toastUntil=0;
const fmt=n=>String(n).padStart(3,'0');
function character(img,key){const c=window.CHARACTERS[key];img.src=c.image;img.style.objectPosition=c.position||'center';img.style.objectFit=c.position?'cover':'contain';img.alt=c.name;}
document.querySelectorAll('[data-character]').forEach(img=>character(img,img.dataset.character));
function show(screen){state.screen=screen;levelUI();for(const id of ['home','select','play','result'])$(id).hidden=id!==screen;$('countdown').hidden=true;keys.clear();held.clear();dragging=false;}
function updateSound(){$('sound').textContent=sound?'♪':'♪̸';$('sound').setAttribute('aria-label',sound?'소리 끄기':'소리 켜기');$('sound').setAttribute('aria-pressed',String(sound));}
function unlock(){try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
function tone(kind){if(!sound)return;unlock();if(!audio)return;const notes=kind==='bad'?[180,125]:kind==='end'?[523,659,784,1047]:kind==='power'?[523,784,1047]:kind==='gold'?[784,1047]:[660,880];notes.forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type=kind==='bad'?'triangle':'sine';const t=audio.currentTime+i*.09;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.13,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+.17);o.start(t);o.stop(t+.18);});}
function hud(){$('score').textContent=fmt(state.score);$('time').textContent=Math.max(0,Math.ceil(duration()-state.elapsed));$('best').textContent=fmt(levelBest());$('lives').textContent='♥ '.repeat(state.lives)+'♡ '.repeat(3-state.lives);$('lives').setAttribute('aria-label',`생명 ${state.lives}개`);document.querySelector('.timer').classList.toggle('urgent',duration()-state.elapsed<=10);$('double').hidden=state.elapsed>=state.doubleUntil;$('double-time').textContent=Math.ceil(state.doubleUntil-state.elapsed);}
function move(x){const w=$('field').clientWidth||360;const half=$('player').offsetWidth/2;state.x=Math.max(half/w,Math.min(1-half/w,x));$('player').style.left=`${state.x*100}%`;}
function begin(key,level=state.level){if(level===2&&!level2Unlocked)return;state.level=level;state.selected=key;Object.assign(state,{basketUntil:0,basketStage:0,score:0,lives:3,elapsed:0,items:[],doubleUntil:0,invincible:0,powerUntil:0,count:3.6,spawn:.15,paused:false,collected:0,streak:0,catchUntil:0,cheerUntil:0});$('game').classList.toggle('picnic',state.level===2);$('basket').hidden=true;$('mission').textContent=state.level===2?'피크닉 대작전 · 간식 0 / 15':'1레벨 · 간식 0 / 10';$('items').replaceChildren();$('effects').replaceChildren();$('partner').hidden=true;$('player').className='player';$('cheer').hidden=true;$('warmup').hidden=false;$('toast').classList.remove('visible');toastUntil=0;show('play');character($('player').querySelector('img'),key);character($('partner').querySelector('img'),key==='takju'?'choco':'takju');move(.5);hud();$('countdown').hidden=false;$('count').textContent='3';unlock();}
function message(text){$('toast').textContent=text;$('toast').classList.add('visible');toastUntil=state.elapsed+1.4;}
function sparkle(x,y,text){const el=document.createElement('span');el.className='spark';el.textContent=text;el.style.left=`${x-20}px`;el.style.top=`${y}px`;$('effects').append(el);el.addEventListener('animationend',()=>el.remove(),{once:true});}
function remove(item){item.el.remove();state.items=state.items.filter(i=>i!==item);}
function addScore(points,item){const n=points*(state.elapsed<state.doubleUntil?2:1);state.score+=n;state.collected++;if(state.level===1&&state.collected>=10&&!level2Unlocked){level2Unlocked=true;saveProgress();message('2레벨이 열렸어!');}if(item)sparkle(item.x,item.y,`+${n} ✦`);}
function celebrate(){state.streak++;state.catchUntil=state.elapsed+.42;state.cheerUntil=state.elapsed+1;$('cheer').textContent=state.streak%5===0?'최고야!':state.streak%3===0?`${state.streak}개 연속!`:'냠냠!';$('cheer').hidden=false;const img=$('player').querySelector('img');img.classList.remove('catch-bounce');void img.offsetWidth;img.classList.add('catch-bounce');}
function collect(item){remove(item);if(item.type.bad){if(state.elapsed<state.invincible)return;state.streak=0;state.lives--;state.invincible=state.elapsed+.9;message('앗! 피해야 해!');$('game').classList.remove('shake');void $('game').offsetWidth;$('game').classList.add('shake');tone('bad');if(state.lives<=0)finish();}
else if(item.type.special==='double'){state.doubleUntil=state.elapsed+5;message('DOUBLE SCORE! ×2');tone('gold');}
else if(item.type.special==='power'){for(const other of [...state.items])if(other.type.points){addScore(other.type.points,other);remove(other);}state.score+=100;state.powerUntil=state.elapsed+1.6;$('partner').hidden=false;$('player').classList.add('power');message('탁주·쪼코 파워! +100');tone('power');}
else{addScore(item.type.points,item);celebrate();tone(item.type.points===50?'gold':'good');}hud();if(state.level===2&&state.collected>=15&&state.screen==='play')finish();}
function spawn(){const easy=state.elapsed<5,pool=easy?types.filter(t=>t.points):types.filter(t=>!(state.level===2&&t.bad&&state.items.filter(i=>i.type.bad).length>=2));let roll=Math.random()*pool.reduce((n,t)=>n+t.weight,0);let type=pool[pool.length-1];for(const t of pool){roll-=t.weight;if(roll<0){type=t;break;}}const w=$('field').clientWidth,h=$('field').clientHeight,el=document.createElement('div');el.className='item'+(type.bad?' bad':'');el.textContent=type.emoji;el.setAttribute('aria-hidden','true');const travel=Math.max(130,h-130);const x=easy?Math.max(28,Math.min(w-28,state.x*w+(Math.random()-.5)*70)):28+Math.random()*(w-56);const item={type,x,y:-28,speed:easy?travel/3.3:travel/(2.9-Math.min(state.elapsed,30)*.025)*(state.level===2?1.12:1),el};state.items.push(item);$('items').append(el);}
function finish(){if(state.screen!=='play')return;const lost=state.lives===0,success=state.level===2&&state.collected>=15;
if(state.level===2)best2=Math.max(best2,state.score);else best=Math.max(best,state.score);
if(success){badgeEarned=true;saveProgress();}try{localStorage.setItem('snack-best',String(best));localStorage.setItem('snack-best-2',String(best2));}catch{}
$('final-score').textContent=state.score.toLocaleString('ko-KR');$('final-best').textContent=levelBest().toLocaleString('ko-KR');$('home-best').textContent=fmt(best);
$('result-title').textContent=state.level===2?(success?'피크닉 대작전 성공!':'끝까지 잘했어!'):(lost?'끝까지 잘했어!':'🎉 간식 대소동 성공!');
$('collected').textContent=state.collected>0?`간식 ${state.collected}개를 모았어!`:'멋진 첫 도전이었어!';
$('message').textContent=state.level===2?(success?'친구들과 나눠 먹을 준비 끝!':`다음엔 ${15-state.collected}개만 더 모아보자!`):(level2Unlocked?'새로운 모험! 2레벨에 도전해봐!':`${10-state.collected}개 더 모으면 2레벨이 열려!`);
$('badge').hidden=!success;$('next-level').hidden=!(state.level===1&&level2Unlocked);$('result').classList.toggle('has-next',state.level===1&&level2Unlocked);show('result');tone('end');}
function update(dt){if(state.screen!=='play'||state.paused)return;if(state.count>0){state.count=Math.max(0,state.count-dt);$('count').textContent=state.count>.6?String(Math.ceil(state.count-.6)):'START!';if(state.count===0)$('countdown').hidden=true;return;}
state.elapsed=Math.min(duration(),state.elapsed+dt);if(state.elapsed>=duration()){hud();finish();return;}
const direction=(keys.has('ArrowRight')||held.has('right')?1:0)-(keys.has('ArrowLeft')||held.has('left')?1:0);if(direction)move(state.x+direction*dt*.9);
state.spawn-=dt;if(state.spawn<=0){spawn();state.spawn=state.elapsed<5?.85:.55+Math.random()*.2;}
const w=$('field').clientWidth,h=$('field').clientHeight,px=state.x*w;
if(state.level===2&&state.basketStage<2&&state.elapsed>=(state.basketStage===0?8:20)){state.basketStage++;state.basketUntil=state.elapsed+5;message('피크닉 바구니! 함께 받아요!');tone('power');}
const basketActive=state.level===2&&state.elapsed<state.basketUntil;$('basket').hidden=!basketActive;$('basket').style.left=px+'px';$('basket').textContent='🧺';
if(basketActive){$('partner').hidden=false;$('partner').style.left=Math.max(56,Math.min(w-56,px+(px>w/2?-76:76)))+'px';}
$('mission').textContent=state.level===2?`피크닉 대작전 · 간식 ${state.collected} / 15${basketActive?' · 함께 받기!':''}`:`1레벨 · 간식 ${state.collected} / 10${level2Unlocked?' · 2레벨 열림!':''}`;
for(const item of [...state.items]){if(!state.items.includes(item))continue;const before=item.y;item.y+=item.speed*dt;item.el.style.transform=`translate(${item.x-21}px,${item.y-21}px)`;if(Math.abs(item.x-px)<(basketActive&&item.type.points?110:51)&&item.y+18>=h-140&&before-18<=h-10){collect(item);if(state.screen!=='play')break;}else if(item.y>h+45){if(item.type.points)state.streak=0;remove(item);}}
$('warmup').hidden=state.elapsed>=5;$('cheer').hidden=state.elapsed>=state.cheerUntil;if(state.elapsed>=state.catchUntil)$('player').querySelector('img').classList.remove('catch-bounce');
$('player').classList.toggle('hurt',state.elapsed<state.invincible);if(state.elapsed>=state.powerUntil&&!basketActive){$('partner').hidden=true;$('partner').style.left='65%';$('player').classList.remove('power');}if(state.elapsed>=toastUntil)$('toast').classList.remove('visible');hud();}
function frame(now){const dt=last?Math.min((now-last)/1000,.05):0;last=now;update(dt);requestAnimationFrame(frame);}
document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.level);if(n===2&&!level2Unlocked)return;state.level=n;levelUI();});$('next-level').onclick=()=>begin(state.selected,2);
$('start').onclick=()=>{unlock();show('select');};$('back').onclick=()=>show('home');document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>begin(b.dataset.pick));$('retry').onclick=()=>begin(state.selected);$('change').onclick=()=>show('select');$('sound').onclick=()=>{sound=!sound;unlock();updateSound();try{localStorage.setItem('snack-sound',sound?'on':'off');}catch{}};
window.addEventListener('keydown',e=>{if(state.screen==='play'&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();keys.add(e.key);}});window.addEventListener('keyup',e=>keys.delete(e.key));
for(const id of ['left','right']){const el=$(id);el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);held.add(id);});for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,()=>held.delete(id));}
const field=$('field');function drag(e){if(state.screen!=='play'||state.count>0)return;const rect=field.getBoundingClientRect();move((e.clientX-rect.left)/rect.width);}
field.addEventListener('pointerdown',e=>{dragging=true;field.setPointerCapture(e.pointerId);drag(e);});field.addEventListener('pointermove',e=>{if(dragging)drag(e);});for(const event of ['pointerup','pointercancel','lostpointercapture'])field.addEventListener(event,()=>dragging=false);
function pause(){keys.clear();held.clear();dragging=false;state.paused=true;}window.addEventListener('blur',pause);window.addEventListener('focus',()=>{state.paused=false;last=0;});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else{state.paused=false;last=0;}});window.addEventListener('resize',()=>move(state.x));
$('home-best').textContent=fmt(best);updateSound();show('home');requestAnimationFrame(frame);
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'read_snack_game',description:'현재 간식 게임의 화면, 점수, 생명, 남은 시간을 확인합니다.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({screen:state.screen,score:state.score,lives:state.lives,level:state.level,time:Math.ceil(duration()-state.elapsed)})})).catch(()=>{});}catch{}}
})();
