namespace radioptest {
    // Message rate tracking variables
    let messageCount = 0;
    let startTime = input.runningTime();
    let lastRateUpdate = 0;
    let messagesPerSecond = 0;

    export function testRecvPayload() {

        radiop.init(1,1)

        radiop.onPayload(function (payload: radiop.RadioPayload) {
            messageCount++;
            let currentTime = input.runningTime();
            let elapsedSeconds = (currentTime - startTime) / 1000;
            messagesPerSecond = Math.round(messageCount / elapsedSeconds * 100) / 100; // Round to 2 decimal places
            lastRateUpdate = currentTime;
            serial.writeLine("" + messageCount + " " + messagesPerSecond + " m/s " + payload.str);
        });

        serial.writeLine("Listening for payloads...");
    }
    
}
