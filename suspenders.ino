// suspenders.ino ~ Copyright 2018 Paul Beaudet ~ License MIT
// Gives a computer ability to sleep for a period of time
// Server gives a signal with a timeout durration to sleep, arduino wakes system with a key press on durration lapse
#include <Keyboard.h>
#include <JS_Timer.h>        // library from - https://github.com/paulbeaudet/JS_Timer

JS_Timer timer = JS_Timer(); // create an instance of our timer object from timer library

void setup() {
  Keyboard.begin();          // allows to act as USB HID device
  timer.setTimeout(erm, 1000); // set command in x amount of time
}
 
 
void loop() {
  timer.todoChecker();
}

void erm(){
  Keyboard.print("ERM");  
}

