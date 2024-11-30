#include <Adafruit_TinyUSB.h>
#include <Adafruit_NeoPixel.h>
#include <MIDI.h>
#include "makeUUID.h"
#include "Adafruit_VL53L0X.h"

extern "C" void flash_get_unique_id(uint8_t *p);

Adafruit_VL53L0X lox = Adafruit_VL53L0X();

Adafruit_USBD_MIDI usb_midi;
MIDI_CREATE_INSTANCE(Adafruit_USBD_MIDI, usb_midi, MIDI);

#define LED_PIN 16
Adafruit_NeoPixel pixels(1, LED_PIN);

void LED_BLUE(){
  pixels.setPixelColor(0, pixels.Color(0, 0,24));
  pixels.show();
}

void LED_RED(){
  pixels.setPixelColor(0, pixels.Color(24, 0, 0));
  pixels.show();
}

void LED_YELLOW(){
  pixels.setPixelColor(0, pixels.Color(12, 12, 0));
  pixels.show();
}

void LED_GREEN(){
  pixels.setPixelColor(0, pixels.Color(0, 24, 0));
  pixels.show();
}

void LED_OFF(){
  pixels.clear();
  pixels.show();
}

char prdDescStr[33];

void makePrdDescStr(){
  uint8_t uuid[8];
  int cnt;
  
  flash_get_unique_id(uuid);
  prdDescStr[0] = 'm';
  prdDescStr[1] = 'i';
  prdDescStr[2] = ':';
  prdDescStr[3] = 'm';
  prdDescStr[4] = 'u';
  prdDescStr[5] = 'z';
  prdDescStr[6] = ':';
  prdDescStr[7] = 'l';
  prdDescStr[8] = 's';
  prdDescStr[9] = 'r';
  prdDescStr[10] = '-';
  prdDescStr[22] = 0;
  convert8bitToAscii(uuid,&(prdDescStr[11]));
  // prdDescStr[11] ++; // For patching when duplicate uuids are obtained
}  

void setup() {
#if defined(ARDUINO_ARCH_MBED) && defined(ARDUINO_ARCH_RP2040)
  TinyUSB_Device_Init(0);
#endif  
  USBDevice.setManufacturerDescriptor("TripArts Music");
  makePrdDescStr();
  USBDevice.setProductDescriptor((const char *)prdDescStr);
  USBDevice.setSerialDescriptor((const char *)&(prdDescStr[11]));

  SerialTinyUSB.begin(115200);
  MIDI.begin(MIDI_CHANNEL_OMNI);

  delay(1500);

  LED_YELLOW();
  delay(500);
  LED_OFF();
  delay(500);

  SerialTinyUSB.println("Adafruit VL53L0X test.");
  if (!lox.begin()) {
    SerialTinyUSB.println(F("Failed to boot VL53L0X"));
    while(1);
  }
  // start continuous ranging
  lox.startRangeContinuous();


  SerialTinyUSB.println("start vl53l0x OK!");


  LED_RED();
  delay(500);
  LED_OFF();
  delay(500);
}

#define LED_CNT_MAX 4
int led_cnt = 0;
int prevRange = 0;

void loop() {
  SerialTinyUSB.print("Distance in mm: ");
  SerialTinyUSB.println(lox.readRange());
  int range = lox.readRange();
  if(range < 1000){
    if(prevRange != range){
      led_cnt = LED_CNT_MAX;
      LED_GREEN();
      uint8_t valhigh = (uint8_t)(range >> 7);
      uint8_t vallow  = (uint8_t)(range & 0x007f);
      MIDI.sendControlChange(80, valhigh, 16);
      MIDI.sendControlChange(81, vallow,  16);
    }
  }else{
    if(prevRange != range){
      MIDI.sendControlChange(82, 16, 16); // Sound Off
    }
  }
  prevRange = range;
  if(led_cnt > 0){
    led_cnt --;
    if(led_cnt == 0){
      LED_OFF();
    }
  }
  delay(20);
}
