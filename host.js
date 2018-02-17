// host.js ~ Copyright 2018 Paul Beaudet ~ MIT License

var child = require('child_process');   // to suspend
var SerialPort = require('serialport'); // to talk to arduino NOTE yun DO NOT NPM INSTALL -> opkg install node-serialport, use global lib

var arduino = {                         // does not need to be connected to an arduino, will try to connect to one though
    serial: null,
    RETRY_DELAY: 2000,                  // if port closes wait at least this amount of time before trying to reopen it
    init: function(arduinoPort, onOpen){
        arduino.serial = new SerialPort(arduinoPort, {
            baudRate: 115200        // remember to set you sketch to go this same speed
        });
        arduino.serial.pipe(new SerialPort.parsers.Readline({delimiter: '\n'}));
        arduino.serial.on('open', arduino.open(arduinoPort, onOpen));
        arduino.serial.on('data', arduino.read);
        arduino.serial.on('close', arduino.retry(arduinoPort, onOpen, 'close'));
        arduino.serial.on('error', arduino.retry(arduinoPort, onOpen, 'error'));
    },
    open: function(port, onOpen){                                // what to do when serial connection opens up with arduino
        return function(){
            console.log('connected to: ' + port);
            onOpen();
        }
    },
    read: function(data){                                        // getting data from Arduino, only expect a card
        var sanitizeReturns = data.replace(/[^\x2F-\x7F]/g, ''); // remove everything except 0x2F through 0x7F on the ASCII table
    },
    retry: function(port, onOpen, type){                         // given something went wrong try to re-establish connection
        return function(error){
            console.log('Serial port ' + type + ' ' + error);
            // setTimeout(function(){arduino.init(port, onOpen)}, arduino.RETRY_DELAY);  // retry every half a minute NOTE this will keep a heroku server awake
        }
    }
};

var getMillis = {
    toNextDay: function(hour, addDays){
        var day = 1;
        if(addDays){day = addDays;}
        var date = new Date();
        var currentTime = date.getTime();       // current millis from epoch
        date.setDate(date.getDate() + addDays); // point date to tomorrow
        date.setHours(hour, 0, 0, 0);           // set hour to send tomorrow
        return date.getTime() - currentTime;    // subtract tomo millis from epoch from current millis from epoch
    }
};

var suspender = {
    test: function(){
        arduino.serial.write('<20000>'); // ask arduino to wake us up in x time
        child.exec('systemctl suspend');
    }
}

arduino.init('/dev/ttyACM0', suspender.test);


