// Initialize radiop
radiop.init();

// Message rate tracking variables
let messageCount = 0;
let startTime = input.runningTime();
let lastRateUpdate = 0;
let messagesPerSecond = 0;

// Set up joystick receive handler using the new joystick namespace
joystick.onReceive(function () {
    messageCount++;
    
    // Calculate rate every second
    let currentTime = input.runningTime();
    if (currentTime - lastRateUpdate >= 100) {
        let elapsedSeconds = (currentTime - startTime) / 1000;
        messagesPerSecond = Math.round(messageCount / elapsedSeconds * 100) / 100; // Round to 2 decimal places
        lastRateUpdate = currentTime;
        
        if (false) {
            serial.writeLine("=== RECEIVED JOY PACKET ===");
            serial.writeLine("X: " + joystick.getValue(joystick.JoystickValue.X) + ", Y: " + joystick.getValue(joystick.JoystickValue.Y));
            // Display pressed buttons as a list of button numbers (A=0, B=1, ..., F=5)
            let pressedButtons: number[] = [];
            for (let i = 0; i <= 5; i++) {
                if (joystick.buttonPressed(i)) pressedButtons.push(i);
            }
            serial.writeLine("Buttons pressed: [" + pressedButtons.join(", ") + "]");
            serial.writeLine("Accel: X=" + joystick.getValue(joystick.JoystickValue.AccelX) +
                " Y=" + joystick.getValue(joystick.JoystickValue.AccelY) +
                " Z=" + joystick.getValue(joystick.JoystickValue.AccelZ));
            serial.writeLine("Rate: " + messagesPerSecond + " messages/sec");
            serial.writeLine("Total messages: " + messageCount);
            serial.writeLine("========================");
        } else {
            serial.writeLine("Rate: " + messagesPerSecond + " messages/sec " + messageCount);
        }
    }
});

// Main test loop
let lastPayload: radiop.JoyPayload | null = null;
basic.forever(function () {

    let jp = radiop.JoyPayload.fromHardware();
   
    if (lastPayload && lastPayload.hash != jp.hash) {
        radio.sendBuffer(jp.getBuffer());
    }

    lastPayload = jp; 
  
});

