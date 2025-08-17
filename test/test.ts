
serial.writeLine("=====================================");
serial.writeLine("Starting RadioExt tests...");
    
//radioptest.testJoystick();make deploy
//radioptest.testHereIAm();
//radioptest.testBeacon();
//radioptest.testRecvPayload();
// radioptest.testFindChannel();
//radioptest.testListen();

//radioptest.testBotStatus();
//radioptest.testSendBotStatus();]
//radioptest.testReceiveBotStatus();

//radioptest.testJoystickSendRecieve();

//radioptest.testJoystickPayloadLoop();

//radioptest.testJpReceive();
//radioptest.testJpSend();


radiop.init(5, 158, 7)
radiop.initBeacon(radiop.DeviceClass.CUTEBOT)

radiop.onReceiveJoystickMessage(function (payload) {
    serial.writeLine("Received Joystick Payload: ");
    if (radiop.buttonPressed(radiop.getLastJoyPayload(), radiop.JoystickButton.A)) {
        radiop.sendBotStateImage(IconNames.Duck)
        radiop.sendBotStateTone(4, 1, 1)
    } else if (radiop.buttonPressed(radiop.getLastJoyPayload(), radiop.JoystickButton.B)) {
        //radiop.sendBotStateTone(Note.A, BeatFraction.Whole)
        radiop.sendBotStateImage(IconNames.Heart)
    } else {
        radiop.sendBotStateImage(IconNames.SmallHeart)
    }
    basic.pause(200)
})

