
serial.writeLine("=====================================");
serial.writeLine("Starting RadioExt tests...");

//radioptest.testJoystick();

//radioptest.testHereIAm();
//radioptest.testBeacon();

radioptest.testRecvPayload();

// radioptest.testFindChannel();




//radioptest.testListen();

basic.forever(() => {
    basic.pause(1000);
});

