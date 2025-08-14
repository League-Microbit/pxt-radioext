// Test BotStatusMessage round trip
namespace radioptest {
    export function testBotStatus() {
        radiop.initDefaults();
        // Create original message
        let original = new radiop.BotStatusMessage(42, 123, 0x0003, 0xA5A5, 0);
        original.setFlag(5, true);
        original.setPinBit(2, true);
        original.setImageFromIcon(IconNames.Heart);
        let h1 = original.hash;

        // Serialize buffer and reconstruct
        let buf = original.getBuffer();
        let copy = radiop.BotStatusMessage.fromBuffer(buf);
        let h2 = copy.hash;

        if (h1 == h2) {
            copy.toImage().showImage(0);
        }
        

    }

    export function testSendBotStatus() {
        radiop.initDefaults();

        while (true) {
            for (let i = IconNames.Heart; i <= IconNames.Scissors; i++) {
                const img = images.iconImage(i as IconNames);
                // Create and send a bot status message
                let bsm = new radiop.BotStatusMessage(i, i, i, i, 0);
                bsm.setImageFromIcon(i as IconNames);
                bsm.send();

                // Store last sent payload for verification
                radiop.lastBotStatusMessage = bsm;

                bsm.toImage().showImage(0);
                basic.pause(250)
            }
        }
    }

    export function testReceiveBotStatus() {
        radiop.initDefaults();

        radiop.onReceiveBotStatusMessage((bsm) => {
            bsm.toImage().showImage(0);
        });
    }
}

