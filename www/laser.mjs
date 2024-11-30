// mi:muz:lsr driver

import pomidi from "./pomidi.mjs";

class Laser{
  constructor(){
    this.midi = null;
    this.deviceNames = [];
    this.onchange = null;
    this.onTrig = null;
    this.onGone = null;
    this.dataHigh = 0;
    this.dataHighReceived = false;
  }
  async init(){
    console.log("Laser.init()");
    let midi = new pomidi();
    this.midi = await midi.init();
    if(this.midi != null){
      this.midi.setOnChange(this._onChange.bind(this));
      await this._getDeviceList();
      if(this.onChange != null){
        this.onChange(this.deviceNames);
      }
    }
    if(this.midi == null){
      return null;
    }else{
      return this;
    }
  }
  _getDeviceList(){
    console.log("Laser._getDeviceList()====>");
    this.deviceNames = [];
    let devCnt = 0;

    for(var cnt=0;cnt<this.midi.outputs.length;cnt++){
      let device = this.midi.outputs[cnt].name;
      if(device.startsWith("mi:muz:lsr-")){
        devCnt ++;
        this.deviceNames.push(device);
      }
    }
    this.midi.setHandler(this._onMidiEvent.bind(this),this.deviceNames);
  }
  _onMidiEvent(e,device){
    console.log("Laser._onMidiEvent()");
    let message = e.data[0] & 0xF0;
    let ch = e.data[0] & 0x0F;
    let num = e.data[1];
    let val = e.data[2];
    console.log("["+device+"] mes:0x"+message.toString(16)+" ch:"+ch+" num:"+num+" val:"+val);
    let bName = "";
    if(message == 0xB0){ // CC
      switch(num){
      case 80:
        this.dataHighReceived = true;
        this.dataHigh = val;
        break;
      case 81:
        if(this.dataHighReceived == true){
          if(this.onTrig != null){
            if(val != 0){
              let sendVal = (this.dataHigh << 7)+val;
              this.onTrig(sendVal,device);
            }
          }
          this.dataHighReceived = false;
        }
        break;
      case 82:
        if(this.onGone != null){
          this.onGone(device);
        }
        this.dataHighReceived = false;
        break;
      default:break;
      }      
    }
  }
  _onChange(){
    console.log("Laser._onChange()");
    this._getDeviceList();
    if(this.onChange != null){
      this.onChange(this.deviceNames);
    }
  }
  setOnChange(func){
    console.log("Laser.setOnChange()");
    this.onChange = func;
  }
  setOnTrig(func){
    console.log("Laser.setOnTrig()");
    this.onTrig = func;
  }
  setOnGone(func){
    console.log("Laser.setOnGone()");
    this.onGone = func;
  }
  wait(ms){
    return new Promise((resolve)=>{setTimeout(resolve,ms);});
  }
}

export default Laser;