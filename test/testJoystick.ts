

function testJoystick() {
    // Initialize radiop
    radiop.init();

    // Initialize joystick
    joystickp.init();


    // Main test loop

    basic.forever(function () {

        //joystickp.sendIfChanged();

    });

}

function testJoystickRadioIr() {
    // Initialize radiop
    radiop.init();

    joystickp.init();
    negotiate.findFreeChannel();

    serial.writeLine("Found radio channel and group: " + radiop.getGroup() + ", " + radiop.getChannel());

    // Main test loop
    basic.forever(function () {
        // Send radio messages if joystick state has changed

        if (input.logoIsPressed()) {
            serial.writeLine("Logo pressed, sending IR code");
            negotiate.sendIRRadioMessage(DigitalPin.P16, radiop.getChannel(), radiop.getGroup());
        }

        joystickp.sendIfChanged();
    });
}

function testSendRadioMessageIR() {
    let i = 0;
    basic.forever(function () {
        // Create JoyPayload with current joystick state
        negotiate.sendIRRadioMessage(DigitalPin.P16, (i * 2) % 83, i % 256);
        i++;
    });
}
