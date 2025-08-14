
serial.writeLine("=====================================");
serial.writeLine("Starting RadioExt tests...");
    
if (false) {


    radiop.init(1, 1)
    radiop.initBeacon("Bumstower")
    pause(2000);
    radiop.findFreeChannel()
    pause(2000);
    radiop.init(10, 10);

    while (true) {
        basic.pause(100);
    }
}


//radioptest.testJoystick();make deploy
//radioptest.testHereIAm();
//radioptest.testBeacon();
//radioptest.testRecvPayload();
// radioptest.testFindChannel();
//radioptest.testListen();

//radioptest.testBotStatus();
//radioptest.testSendBotStatus();]
radioptest.testReceiveBotStatus();
