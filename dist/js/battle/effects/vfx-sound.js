window.BattleVfxSound={mount(){
 let context,enabled=false;const live=new Set();
 function stop(){for(const node of live){try{node.stop();}catch{}}live.clear();}
 function tone(frequency,end,duration,type='triangle',volume=.1){
  if(!enabled||!context)return;const now=context.currentTime,osc=context.createOscillator(),gain=context.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,now);osc.frequency.exponentialRampToValueAtTime(end,now+duration);gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.connect(gain).connect(context.destination);osc.onended=()=>{live.delete(osc);osc.disconnect();gain.disconnect();};live.add(osc);osc.start();osc.stop(now+duration);
 }
 function air(duration=.18,volume=.08){
  if(!enabled||!context)return;const size=Math.ceil(context.sampleRate*duration),buffer=context.createBuffer(1,size,context.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<size;i++)data[i]=(Math.random()*2-1)*(1-i/size);
  const node=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();node.buffer=buffer;filter.type='bandpass';filter.frequency.setValueAtTime(1800,context.currentTime);filter.frequency.exponentialRampToValueAtTime(250,context.currentTime+duration);gain.gain.value=volume;node.connect(filter).connect(gain).connect(context.destination);node.onended=()=>{live.delete(node);node.disconnect();filter.disconnect();gain.disconnect();};live.add(node);node.start();node.stop(context.currentTime+duration);
 }
 return{async toggle(){enabled=!enabled;if(enabled){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){enabled=false;return false;}context??=new Audio();await context.resume();}else stop();return enabled;},prepare(ultimate){if(ultimate)tone(80,180,.6,'sine',.045);},swing(rank){air(.11+rank*.035,.045+rank*.008);},hit(rank,ultimate){air(ultimate?.55:.2,.08);tone(ultimate?100:170,32,ultimate?.6:.23,'triangle',ultimate?.16:.09);if(rank>1)tone(480,110,.2,'sine',.035);},stop};
}};
