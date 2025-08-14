// Test BotStatusMessage round trip
namespace radioptest {
    export function testBotStatus() {
        radiop.initDefaults();
        // Create original message
        let original = new radiop.BotStatusMessage(42, 123, 0x0003, 0xA5A5, 0, "Hello");
        original.setFlag(5, true);
        original.setPinBit(2, true);
        original.setImageFromIcon(IconNames.Heart);
        let h1 = original.hash;

        // Serialize buffer and reconstruct
        let buf = original.getBuffer();
        let copy = radiop.BotStatusMessage.fromBuffer(buf);
        let h2 = copy.hash;

        // Compare hashes
        if (h1 != h2) {
            serial.writeLine("Hash mismatch: " + h1 + " != " + h2);
        } else {
            serial.writeLine("Hash OK: " + h1);
        }

        // Print string representations
        serial.writeLine(original.str);
        serial.writeLine(copy.str);

        copy.toImage().showImage(0);

    }

    export function testSendBotStatus() {
        radiop.initDefaults();

        while (true) {
            for (let i = IconNames.Heart; i <= IconNames.Scissors; i++) {
                const img = images.iconImage(i as IconNames);
                // Create and send a bot status message
                let bsm = new radiop.BotStatusMessage(i, i, i, i, 0, "Test Status");
                bsm.setImageFromIcon(i as IconNames);
                bsm.send();

                // Store last sent payload for verification
                radiop.lastBotStatusMessage = bsm;

                // Print the sent message
                serial.writeLine("Sent Bot Status: " + bsm.str);
                bsm.toImage().showImage(0);
                basic.pause(250)
            }
        }
    }

    export function testReceiveBotStatus() {
        radiop.initDefaults();

        radiop.onReceiveBotStatusMessage((bsm) => {
            serial.writeLine("Received Bot Status: " + bsm.str);
            bsm.toImage().showImage(0);
        });
    }
}

