// host.js ~ Copyright 2018 Paul Beaudet ~ MIT License

var child = require('child_process');   // to suspend
var serialport = require('serialport'); // to talk to arduino NOTE yun DO NOT NPM INSTALL -> opkg install node-serialport, use global lib

var arduino = {                          // does not need to be connected to an arduino, will try to connect to one though
    serial: null,
    RETRY_DELAY: 5000,
    init: function(arduinoPort){
        arduino.serial = new serialport.SerialPort(arduinoPort, {
            baudrate: 115200,            // remember to set you sketch to go this same speed
            parser: serialport.parsers.readline('\n'),
            autoOpen: false
        });
        arduino.serial.on('open', function(){arduino.open(arduinoPort);});
        arduino.serial.on('data', arduino.read);
        arduino.serial.on('close', arduino.retry(arduinoPort, 'close'));
        arduino.serial.on('error', arduino.retry(arduinoPort, 'error'));
    },
    open: function(port){console.log('connected to: ' + port);}, // what to do when serial connection opens up with arduino
    read: function(data){                                        // getting data from Arduino, only expect a card
        var id = data.replace(/[^\x2F-\x7F]/g, '');              // remove everything except 0x2F through 0x7F on the ASCII table
        auth.orize(id, arduino.grantAccess, arduino.denyAccess); // check if this card has access
    },
    retry: function(port, type){                                  // given something went wrong try to re-establish connection
        return function(error){
            console.log('Serial port ' + type + ' ' + error);
            setTimeout(function(){arduino.init(port)}, arduino.RETRY_DELAY);  // retry every half a minute NOTE this will keep a heroku server awake
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
        setTimeout(function(){
            child.exec('systemctl suspend');
        }, 200);
    }
}

suspender.test();


