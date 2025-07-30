
serial.writeLine("=====================================");
serial.writeLine("Starting RadioExt tests...");

//radioptest.testJoystick();

//radioptest.testHereIAm();
radioptest.testRecvPayload();

// radioptest.testFindChannel();


//radioptest.testBeacon();

//radioptest.testListen();

basic.forever(() => {
    basic.pause(1000);
});

