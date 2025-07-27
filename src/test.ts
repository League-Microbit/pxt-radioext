// Initialize radiop
radiop.init();

// Message rate tracking variables
let messageCount = 0;
let startTime = input.runningTime();
let lastRateUpdate = 0;
let messagesPerSecond = 0;


radiop.onPayload(function (payload: radiop.RadioPayload) {
    messageCount++;
    let currentTime = input.runningTime();
    let elapsedSeconds = (currentTime - startTime) / 1000;
    messagesPerSecond = Math.round(messageCount / elapsedSeconds * 100) / 100; // Round to 2 decimal places
    lastRateUpdate = currentTime;
    serial.writeLine(payload.str);
    serial.writeLine("Rate: " + messagesPerSecond + " messages/sec " + messageCount);
}); 

// Main test loop

basic.forever(function () {

    joystickp.sendIfChanged();

});

