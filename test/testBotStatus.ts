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
}


