let memberNumber = 0;

namespace radioptest {
    export function testHereIAm() {
        radiop.init();

        for (let i = 0; i < 10; ++i) {
            // Create HereIaM with current member number, default group/channel
            let h1 = new negotiate.HereIAm('footester_' + i);
            // Reconstruct from buffer
            let h2 = negotiate.HereIAm.fromBuffer(h1.getBuffer());

            // Compare hashes and show status
            if (h1.hash === h2.hash) {
                serial.writeLine(h1.str);
                basic.showIcon(IconNames.Yes);
            } else {
                basic.showIcon(IconNames.No);
                serial.writeLine("Hash mismatch! h1: " + h1.hash + " h2: " + h2.hash);
                serial.writeLine("h1: " + h1.str);
                serial.writeLine("h2: " + h2.str);
            }

            // Send the message
            h1.send()

            basic.pause(200);
        }


    }

    export function testBeacon() {

        radiop.init(10, 10);
        negotiate.init('beacontester');
        
        while (true) {
            basic.pause(2000);
        }

    }

    export function testFindChannel() {
        
        radiop.init();
        negotiate.init('cutebot');
        negotiate.findFreeChannel()

    }

    export function testListen() {
        
        radiop.init();
        basic.showIcon(IconNames.Happy);

        negotiate.onReceive((payload) => {
            serial.writeLine("TL Received: " + payload.str + " on channel " + radiop.getChannel() + ", group " + radiop.getGroup());
            negotiate.peerDb.dumpToSerial();
        });

    }

}
