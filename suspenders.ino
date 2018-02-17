// suspenders.ino ~ Copyright 2018 Paul Beaudet ~ License MIT
// Gives a computer ability to sleep for a period of time
// Server gives a signal with a timeout durration to sleep, arduino wakes system with a key press on durration lapse
#include <Keyboard.h>
#include <JS_Timer.h>        // library from - https://github.com/paulbeaudet/JS_Timer

JS_Timer timer = JS_Timer(); // create an instance of our timer object from timer library

void setup() {
  Keyboard.begin();            // allows to act as USB HID device
  Serial.begin(115200);        // comunicate with server
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
  delay(500);
  digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
  // timer.setTimeout(wake, 20000);
}

void loop() {
  timer.todoChecker();
  int newTime = recieveNextTime();
  if(newTime){
    timer.setTimeout(wake, newTime);
  }
}

//---- Functions ------
void wake(){
  Keyboard.print(" "); // Send a keystroke any keystroke to wake machine up
  digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
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
