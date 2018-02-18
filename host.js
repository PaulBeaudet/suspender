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
        arduino.parser = new SerialPort.parsers.Readline({delimiter: '\r\n'});
        arduino.serial.pipe(arduino.parser);
        arduino.serial.on('open', onOpen);
        arduino.parser.on('data', suspender.onData);                             // receive data piped into parser
        arduino.serial.on('close', arduino.retry(arduinoPort, onOpen, 'close')); // Close can signal that we have resumed from suspend
        arduino.serial.on('error', arduino.retry(arduinoPort, onOpen, 'error'));
    },
    retry: function(port, onOpen, type){                         // given something went wrong try to re-establish connection
        return function(error){
            console.log('Serial port ' + type + ' ' + error);
            setTimeout(function(){arduino.init(port, onOpen)}, arduino.RETRY_DELAY);
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
    toggle: false,
    sleep: function(){
        setTimeout(function(){
            console.log('going to sleep now');
            arduino.serial.write('<20000>'); // ask arduino to wake us up in x time
            var proc = child.exec('systemctl suspend');
            proc.stderr.on('data', console.log);
            proc.stdout.on('data', console.log);
        }, 8000);
    },
    onData: function(data){
        console.log(data);
        if(data === 'i'){                             // Base case to interupts sleep cycles, or continue them
            suspender.toggle = !suspender.toggle;     // toggle action
            if(suspender.toggle) {suspender.sleep();} // when toggled on go to sleep
            else                 {console.log('sleep cycle was toggled off')};
        } else if (data === 'c'){                     // c represents continueing opporations
            suspender.sleep();
        }
    }
};

arduino.init('/dev/ttyACM0', function(){console.log('connected on port: /dev/ttyACM0');});

