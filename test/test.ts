
serial.writeLine("=====================================");
serial.writeLine("Starting RadioExt tests...");

//testJoystick();
//radioptest.testHereIAm();
//testReceivePayload();

radioptest.testFindChannel();


//radioptest.testBeacon();

//radioptest.testListen();

basic.forever(() => {
    basic.pause(1000);
});

