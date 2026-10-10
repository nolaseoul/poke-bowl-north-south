/* Original four-channel chiptunes composed for Poké Bowl. No sampled game audio. */
(function(root){
const tracks={
 victory:{name:'Route to Victory',bpm:152,roots:[48,53,55,48,57,53,55,48],chords:[[0,4,7],[0,4,7],[0,4,7],[0,4,7],[0,3,7],[0,4,7],[0,4,7],[0,4,7]],melody:[
 [76,0,79,0,74,76,0,72,0,0,74,0,79,0,76,0],
 [77,0,81,0,79,0,76,77,0,0,72,0,74,0,77,0],
 [79,0,74,0,83,0,81,79,0,0,78,0,74,76,79,0],
 [76,0,72,0,79,0,76,0,74,72,0,0,76,0,79,0],
 [81,0,76,0,84,0,83,81,0,0,79,0,76,0,81,0],
 [77,0,72,0,81,0,79,77,0,0,76,0,74,0,77,0],
 [74,0,79,0,83,81,79,0,78,0,74,0,79,0,83,0],
 [84,0,79,0,76,0,74,72,0,0,79,0,72,0,0,0]]},
 rivalry:{name:'Rivalry Night',bpm:164,roots:[45,41,48,43,45,41,40,45],chords:[[0,3,7],[0,4,7],[0,4,7],[0,4,7],[0,3,7],[0,4,7],[0,4,7],[0,3,7]],melody:[
 [81,0,76,79,0,81,0,84,83,0,79,0,76,0,79,0],
 [77,0,72,0,81,79,0,77,0,0,76,0,72,0,77,0],
 [79,0,84,0,83,0,79,76,0,0,74,76,79,0,0,0],
 [74,0,79,0,81,0,83,0,79,0,78,79,0,74,0,0],
 [84,0,81,0,88,0,86,84,83,0,81,0,79,0,76,0],
 [81,0,77,0,84,83,81,0,79,0,77,0,76,0,72,0],
 [80,0,83,0,88,0,86,83,80,0,76,0,80,0,83,0],
 [81,0,84,0,88,0,84,81,0,0,76,0,81,0,0,0]]}
};
class ChipMusic{
 constructor(){this.context=null;this.master=null;this.track='victory';this.volume=.35;this.enabled=false;this.step=0;this.nextTime=0;this.timer=null;this.voices=new Set();this.duckUntil=0;this.noise=null;this.onChange=()=>{};this.revision=0;}
 async prepare(){if(!this.context){const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)throw Error('This browser does not support Web Audio.');this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=0;let filter=this.context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=6500;let compressor=this.context.createDynamicsCompressor();compressor.threshold.value=-15;compressor.ratio.value=4;this.master.connect(filter);filter.connect(compressor);compressor.connect(this.context.destination);this.noise=this.context.createBuffer(1,this.context.sampleRate*.25,this.context.sampleRate);let data=this.noise.getChannelData(0),seed=481;for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=(seed/2147483647)*2-1}}
 if(this.context.state!=='running')await this.context.resume();}
 async play(){const revision=++this.revision;await this.prepare();if(revision!==this.revision)return;if(this.enabled&&this.timer!==null)return;this.enabled=true;this.step=0;this.nextTime=this.context.currentTime+.04;this.master.gain.cancelScheduledValues(this.context.currentTime);this.master.gain.setTargetAtTime(this.volume,this.context.currentTime,.04);this.schedule();this.timer=setInterval(()=>this.schedule(),25);this.onChange();}
 stop(){this.revision++;this.enabled=false;if(this.timer!==null)clearInterval(this.timer);this.timer=null;if(this.context){this.master.gain.cancelScheduledValues(this.context.currentTime);this.master.gain.setTargetAtTime(0,this.context.currentTime,.025);for(const voice of this.voices){try{voice.stop(this.context.currentTime+.08)}catch{}}}this.onChange();}
 setVolume(value){this.volume=Math.max(0,Math.min(1,value));if(this.context&&this.enabled)this.master.gain.setTargetAtTime(this.volume,this.context.currentTime,.04)}
 setTrack(id){if(!tracks[id])return;this.track=id;this.step=0;if(this.context){for(const voice of this.voices){try{voice.stop()}catch{}}this.nextTime=this.context.currentTime+.05;}this.onChange();}
 tone(note,time,duration,type='square',volume=.10){if(!note)return;let o=this.context.createOscillator(),g=this.context.createGain();o.type=type;o.frequency.setValueAtTime(440*2**((note-69)/12),time);g.gain.setValueAtTime(.0001,time);g.gain.linearRampToValueAtTime(volume,time+.004);g.gain.setValueAtTime(volume*.65,time+Math.min(.035,duration/2));g.gain.exponentialRampToValueAtTime(.0001,time+duration);o.connect(g);g.connect(this.master);this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect()};o.start(time);o.stop(time+duration+.01)}
 drum(time,snare=false){let source=this.context.createBufferSource(),filter=this.context.createBiquadFilter(),g=this.context.createGain();source.buffer=this.noise;filter.type='highpass';filter.frequency.value=snare?1000:5500;g.gain.setValueAtTime(snare?.13:.045,time);g.gain.exponentialRampToValueAtTime(.0001,time+(snare?.105:.035));source.connect(filter);filter.connect(g);g.connect(this.master);this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();filter.disconnect();g.disconnect()};source.start(time);source.stop(time+.12)}
 schedule(){if(!this.enabled||this.context.state!=='running')return;let track=tracks[this.track],tick=60/track.bpm/4;if(this.nextTime<this.context.currentTime-.15)this.nextTime=this.context.currentTime+.025;let count=0;while(this.nextTime<this.context.currentTime+.12&&count++<12){this.noteStep(this.step++,this.nextTime,tick);this.nextTime+=tick}}
 noteStep(step,time,tick){let track=tracks[this.track],bar=Math.floor(step/16),s=step%16,index=bar%8,section=Math.floor(bar/8)%4,rootNote=track.roots[index],chord=track.chords[index];let duck=time<this.duckUntil?.35:1;
 // Pulse 1: melody. Section B lifts the chorus an octave; C leaves breathing room.
 let melody=track.melody[index][s],melodyGain=section===2?.07:.11;if(section===1&&s<8)melody+=melody?12:0;if(section===2&&s%4===2)melody=0;this.tone(melody,time,tick*(s%4===0?1.65:.82),'square',melodyGain*duck);
 // Pulse 2: fast, quiet arpeggios, like a tiny handheld sound chip.
 if(s%2===0||section===1)this.tone(rootNote+12+chord[(s+bar)%3],time,tick*.7,'square',.032*duck);
 // Triangle channel: bouncy root/fifth bass in eighth notes.
 if(s%2===0)this.tone(rootNote-12+(s===6||s===14?7:s===10?12:0),time,tick*1.6,'triangle',.22*duck);
 // Noise channel: alternating snare / closed hats; low triangle kick.
 if(s===0||s===8)this.tone(28,time,tick*.8,'triangle',.3*duck);if(s===4||s===12)this.drum(time,true);else if(s%2===0)this.drum(time,false);}
 celebrate(final=false){if(!this.enabled||!this.context)return;let at=this.context.currentTime+.02;this.duckUntil=at+1.25;let phrase=final?[79,76,81,79,84,83,88,84]:[76,79,83,86,84];phrase.forEach((note,i)=>{this.tone(note,at+i*.11,i===phrase.length-1?.38:.09,'square',.16);this.tone(note-12,at+i*.11,.1,'triangle',.2)})}
}
root.PokeMusic={ChipMusic,tracks};if(typeof module!=='undefined')module.exports=root.PokeMusic;
})(typeof window!=='undefined'?window:globalThis);
