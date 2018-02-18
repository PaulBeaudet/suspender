// suspenders.ino ~ Copyright 2018 Paul Beaudet ~ License MIT
// Gives a computer ability to sleep for a period of time
// Server gives a signal with a timeout durration to sleep, arduino wakes system with a key press on durration lapse
#include <Keyboard.h>                   // Built in library for HID keyboard actions
#include <JS_Timer.h>                   // library from - https://github.com/paulbeaudet/JS_Timer
#include <Adafruit_CircuitPlayground.h> // Library of prebuild functions for a specfic arduino compatiple from adafruit

#define LEFTBUTTON 4
#define RIGHTBUTTON 19
#define BOUNCETIME 5
#define HOLDSTATE 300

JS_Timer timer = JS_Timer(); // create an instance of our timer object from timer library

void setup() {
  Keyboard.begin();            // allows to act as USB HID device
  Serial.begin(115200);        // comunicate with server
  byte buttonArray[]= {LEFTBUTTON, RIGHTBUTTON};
  for(byte whichPin=0; whichPin < sizeof(buttonArray); whichPin++){
      pinMode(buttonArray[whichPin], INPUT);
  }
  pinMode(LED_BUILTIN, OUTPUT);   // set up LED on pin 13
  digitalWrite(LED_BUILTIN, LOW); // turn the LED off by making the voltage LOW
}

void loop() {
  timer.todoChecker(); // Runs continually to see if timer callback needs to be executed

  static bool pressed = false; // only gets set first interation of loop
  byte leftButtonPress = leftPressEvent();
  if(leftButtonPress){        // logic to prevent continually actuating event while button is pressed
    if(!pressed){
      wake();
      pressed = true;
    }
  } else {pressed = false;} // wait until button is done being pressed before actuating event again

  int newTime = recieveNextTime();
  if(newTime){
    timer.setTimeout(wake, newTime);
  }
}

//---- Functions ------
void wake(){
  Keyboard.print(" "); // Send a keystroke any keystroke to wake machine up
}

//======================== Serial Data Transfer (INTERFACE)
#define START_MARKER '<'
#define END_MARKER '>'

int recieveNextTime(){
  static String placeholder= "";
  static boolean inProgress = false;  // note if read started

  if(Serial.available()) {            // is there anything to be read
    char readChar = Serial.read();    // yes? read it
    if(inProgress){                   // did we read start maker?
      if(readChar == END_MARKER){     // did we read end marker
        inProgress = false;               // note finished
        int result = placeholder.toInt(); // return int
        placeholder = "";
        return result;
      } else {                        // given still in progress
        placeholder += readChar;      // concat this char
      }
    } else if(readChar == START_MARKER){inProgress = true;} // indicate when to read when start marker is seen
  }
  return 0; // in the case the message has yet to be recieved
}


// checks for a debounced button press event // TODO needs to be modified to handle more than one button
byte leftPressEvent() {     // remove default value to use in main sketch
  static unsigned long pressTime = millis();
  static boolean timingState = false;
                                          // low is a press with the pullup
  if(digitalRead(LEFTBUTTON) == HIGH){    // if the button has been pressed
    if(timingState) {                     // given timer has started
      if(millis() - pressTime > BOUNCETIME){ // check if bounce time has elapesed
        if(millis() - pressTime > HOLDSTATE){// case button held longer return state 2
          return 2;                       // return hold state
        }
        return 1;                         // return debounced press state
      }
      return 0;                           // still in potential "bounce" window
    }
    timingState = true; // note that the timing state is set
    pressTime = millis();    // placemark when time press event started
    return 0;           // return with the timestate placeholder set
  }                     // outside of eventcases given no reading
  timingState = false;  // in case the timing state was set, unset
  return 0;             // not pressed
}

