let memberNumber = 0;

basic.forever(function () {
    // Create HereIaM with current member number, default group/channel
    let h1 = new negotiate.HereIaM(memberNumber);
    // Reconstruct from buffer
    let h2 = negotiate.HereIaM.fromBuffer(h1.getBuffer());

    // Compare hashes and show status
    if (h1.hash === h2.hash) {
        basic.showIcon(IconNames.Yes);
    } else {
        basic.showIcon(IconNames.No);
        serial.writeLine("Hash mismatch! h1: " + h1.hash + " h2: " + h2.hash);
        serial.writeLine("h1: " + h1.str);
        serial.writeLine("h2: " + h2.str);
    }

    // Send the message
    radio.sendBuffer(h1.getBuffer());

    // Increment member number, wrap at 2^16
    memberNumber = (memberNumber + 1) & 0xFFFF;

    basic.pause(200);
    basic.clearScreen()
});


