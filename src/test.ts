// Initialize radiop
radiop.init();

// Message rate tracking variables
let messageCount = 0;
let startTime = input.runningTime();
let lastRateUpdate = 0;
let messagesPerSecond = 0;

// Set up radio packet received handler
radio.onReceivedBuffer(function (receivedBuffer: Buffer) {
    // Check if it's a JoyPacket by looking at packet type
    let packetType = receivedBuffer.getNumber(NumberFormat.UInt8LE, 0);
    if (packetType == radiop.PACKET_TYPE_JOY) {
        messageCount++;
        
        // Calculate rate every second
        let currentTime = input.runningTime();
        if (currentTime - lastRateUpdate >= 1000) {
            let elapsedSeconds = (currentTime - startTime) / 1000;
            messagesPerSecond = Math.round(messageCount / elapsedSeconds * 100) / 100; // Round to 2 decimal places
            lastRateUpdate = currentTime;
            
            serial.writeLine("=== RECEIVED JOY PACKET ===");
            let receivedPayload = radiop.JoyPayload.fromBuffer(receivedBuffer);
            serial.writeLine("Received: " + receivedPayload.str);
            serial.writeLine("Hash: " + receivedPayload.hash);
            serial.writeLine("Rate: " + messagesPerSecond + " messages/sec");
            serial.writeLine("Total messages: " + messageCount);
            serial.writeLine("========================");
        }
    } else {
        serial.writeLine("Received unknown packet type: " + packetType);
    }
});

// Main test loop
let lastPayload: radiop.JoyPayload | null = null;
basic.forever(function () {


    let jp = radiop.JoyPayload.fromHardware();
   
    // 6) Send the packet to the radio
    if (lastPayload && lastPayload.hash != jp.hash) {
        radio.sendBuffer(jp.getBuffer());
    }

    lastPayload = jp; 
  
});

