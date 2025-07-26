


// Initialize radiop
radiop.init();

// Set up radio packet received handler
radio.onReceivedBuffer(function (receivedBuffer: Buffer) {
    // Check if it's a JoyPacket by looking at packet type
    let packetType = receivedBuffer.getNumber(NumberFormat.UInt8LE, 0);
    if (packetType == radiop.PACKET_TYPE_JOY) {
        serial.writeLine("=== RECEIVED JOY PACKET ===");
        let receivedPayload = radiop.JoyPayload.fromBuffer(receivedBuffer);
        serial.writeLine("Received: " + receivedPayload.str);
        serial.writeLine("Hash: " + receivedPayload.hash);
        serial.writeLine("========================");
    } else {
        serial.writeLine("Received unknown packet type: " + packetType);
    }
});

// Main test loop
basic.forever(function () {

    // 1) Create a JoyPayload from hardware
    let payload1 = radiop.JoyPayload.fromHardware();

    // 2) Create a second from the buffer from the first
    let payload2 = radiop.JoyPayload.fromBuffer(payload1.getBuffer());
 
    // 3) Create a third from the values of the second
    let payload3 = new radiop.JoyPayload(payload2.x, payload2.y, payload2.buttons, payload2.accelX, payload2.accelY, payload2.accelZ);
    
    // 4) Print the hashes from all three to the serial
    let hash1 = payload1.hash;
    let hash2 = payload2.hash;
    let hash3 = payload3.hash;

    // 5) Verify that all three have the same hashes
    if (hash1 == hash2 && hash2 == hash3) {
        basic.showIcon(IconNames.Yes);
    } else {
        basic.showIcon(IconNames.No);
    }
    
    // 6) Send the packet to the radio
    radio.sendBuffer(payload1.getBuffer());

    basic.pause(200); // Wait 2 seconds before next test
});

