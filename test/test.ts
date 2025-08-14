
serial.writeLine("=====================================");
serial.writeLine("Starting RadioExt tests...");
    
//radioptest.testJoystick();make deploy
//radioptest.testHereIAm();
//radioptest.testBeacon();
//radioptest.testRecvPayload();
// radioptest.testFindChannel();
//radioptest.testListen();

radioptest.testBotStatus();
//radioptest.testSendBotStatus();]
radioptest.testReceiveBotStatus();
