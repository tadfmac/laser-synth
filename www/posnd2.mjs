// posnd.mjs

var loglevel = 0;
function infoLog(str){
  if(loglevel > 1){
    console.log("info: "+str);
  }
}

function errLog(str){
  if(loglevel > 0){
    console.log("error: "+str);
  }
}

class posnd2{
  constructor(){
    this.audioctx = null;
  }
  init (opt) {
    if(opt != null){
      if(typeof opt.log === 'number'){
        loglevel = opt.log;
      }
    }
    infoLog("posnd:init()");
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    this.isPlaying = false;
    this.freq = 220;
    this.audioctx = new AudioContext();
    this.osc = this.audioctx.createOscillator();
    this.osc.frequency.value = this.freq;
    this.osc.type = "sine";
    this.gain = this.audioctx.createGain();
    this.gain.gain.value = 0;
    this.osc.connect(this.gain);
    this.osc.start();
    this.gain.connect(this.audioctx.destination);
    this.adsr = [0,0,1.0,0];
    this.svol = 0;
    this.glide = 0;
  }
  noteOn(note,velocity){
    infoLog("posnd:noteOn("+note+","+velocity+")"+this.adsr);
    var volume = velocity / 127;
    this.freq = NOTE_FREQ[note];
    var ctime = this.audioctx.currentTime;
    this.osc.frequency.linearRampToValueAtTime(this.freq,ctime + this.glide);
    this.gain.gain.linearRampToValueAtTime(volume, ctime + this.adsr[0]);
    this.svol = this.adsr[2]*volume;
    this.gain.gain.setTargetAtTime(this.svol,ctime + this.adsr[0], this.adsr[1]);
    this.isPlaying = true;
  }
  play(value,velocity){
    infoLog("posnd:start("+value+","+velocity+")"+this.adsr);
    var volume = velocity / 127;
    this.freq = this.valueToFreq(value);
    var ctime = this.audioctx.currentTime;
    this.osc.frequency.linearRampToValueAtTime(this.freq,ctime + this.glide);
    this.gain.gain.linearRampToValueAtTime(volume, ctime + this.adsr[0]);
    this.svol = this.adsr[2]*volume;
    this.gain.gain.setTargetAtTime(this.svol,ctime + this.adsr[0], this.adsr[1]);
  }
  valueToFreq(value) {
//    const A4 = 800;
//    const A4_FREQUENCY = 55;
    const A4 = 276;
    const A4_FREQUENCY = 440;
    return A4_FREQUENCY * Math.pow(2, (value - A4) / 48);
  }
  stop(){
    this.noteOff();
  }
  noteOff(){
    infoLog("posnd:noteOff()");
    var ctime = this.audioctx.currentTime;
    this.gain.gain.linearRampToValueAtTime(0, ctime + this.adsr[3]);
  }
  note(note,velocity,duration){
    return new Promise((resolve)=>{
      infoLog("posnd:note("+note+","+velocity+","+duration+")");
      this.noteOn(note,velocity);
      setTimeout(()=>{
        this.noteOff();
        resolve();
      },duration);
    });
  }
  setADSR(adsr){
    infoLog("PoorSound setADSR("+adsr+")");
    if(adsr.length == 4){
      this.adsr = adsr;
    }else{
      errLog("setADSR() parameter error. Please set [a,d,s,r] ");
    }
  }
  setGlide(glide){
    infoLog("PoorSound setGlide("+glide+")");
    this.glide = glide;
  }
  setOsc(type){
    infoLog("PoorSound setOSCType("+type+")");
    switch(type){
    case 0:
    case "sine":
    case "sin":
      this.osc.type = "sine";
      break;
    case 1:
    case "square":
    case "sqr":
      this.osc.type = "square";
      break;
    case 2:
    case "sawtooth":
    case "saw":
      this.osc.type = "sawtooth";
      break;
    case 3:
    case "triangle":
    case "tri":
      this.osc.type = "triangle";
      break;
    default:
      errLog("setOSCType() parameter error");
      break;
    }
  }
  resume(){
    if(this.audioctx != null){
      this.audioctx.resume();
    }
  }
  wait(ms){
    return new Promise((resolve)=>{setTimeout(resolve,ms);});
  }
}
const NOTE_FREQ = [
  8.1757989156,8.6619572180,9.1770239974,9.7227182413,10.3008611535,10.9133822323,11.5623257097,12.2498573744,
  12.9782717994,13.7500000000,14.5676175474,15.4338531643,16.3515978313,17.3239144361,18.3540479948,19.4454364826,
  20.6017223071,21.8267644646,23.1246514195,24.4997147489,25.9565435987,27.5000000000,29.1352350949,30.8677063285,
  32.7031956626,34.6478288721,36.7080959897,38.8908729653,41.2034446141,43.6535289291,46.2493028390,48.9994294977,
  51.9130871975,55.0000000000,58.2704701898,61.7354126570,65.4063913251,69.2956577442,73.4161919794,77.7817459305,
  82.4068892282,87.3070578583,92.4986056779,97.9988589954,103.8261743950,110.0000000000,116.5409403795,123.4708253140,
  130.8127826503,138.5913154884,146.8323839587,155.5634918610,164.8137784564,174.6141157165,184.9972113558,195.9977179909,
  207.6523487900,220.0000000000,233.0818807590,246.9416506281,261.6255653006,277.1826309769,293.6647679174,311.1269837221, 
  329.6275569129,349.2282314330,369.9944227116,391.9954359817,415.3046975799,440.0000000000,466.1637615181,493.8833012561,
  523.2511306012,554.3652619537,587.3295358348,622.2539674442,659.2551138257,698.4564628660,739.9888454233,783.9908719635,
  830.6093951599,880.0000000000,932.3275230362,987.7666025122,1046.5022612024,1108.7305239075,1174.6590716696,1244.5079348883,
  1318.5102276515,1396.9129257320,1479.9776908465,1567.9817439270,1661.2187903198,1760.0000000000,1864.6550460724,1975.5332050245,
  2093.0045224048,2217.4610478150,2349.3181433393,2489.0158697766,2637.0204553030,2793.8258514640,2959.9553816931,3135.9634878540,
  3322.4375806396,3520.0000000000,3729.3100921447,3951.0664100490,4186.0090448096,4434.9220956300,4698.6362866785,4978.0317395533,
  5274.0409106059,5587.6517029281,5919.9107633862,6271.9269757080,6644.8751612791,7040.0000000000,7458.6201842894,7902.1328200980,
  8372.0180896192,8869.8441912599,9397.2725733570,9956.0634791066,10548.0818212118,11175.3034058561,11839.8215267723,12543.8539514160
];

export default posnd2;
