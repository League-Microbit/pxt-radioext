
serial.writeLine("Starting RadioExt tests...");

//testJoystick();
//radioptest.testHereIAm();
//testReceivePayload();
//testFindChannel();


//radioptest.testBeacon();

radioptest.testListen();

basic.forever(() => {
    basic.pause(1000);
});

