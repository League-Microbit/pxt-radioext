namespace radiop {

    /** BotState payload mirrors JoyPayload layout but uses BOT_STATUS packet type and provides alias accessors. */
    export class BotStatePayload extends JoyPayload {
        static PACKET_SIZE = JoyPayload.PACKET_SIZE;
        constructor(buf?: Buffer) {
            super(buf);
            // Overwrite packet type to BOT_STATUS
            this.getBuffer().setNumber(NumberFormat.UInt8LE, 0, radiop.PayloadType.BOT_STATUS);
        }
        static fromBuffer(b: Buffer): BotStatePayload { if (!b || b.length < BotStatePayload.PACKET_SIZE) return null; return new BotStatePayload(b); }

        // Alias: sonarDistance -> x
        get sonarDistance(): number { return this.x; }
        set sonarDistance(v: number) { this.x = v; }

        // Alias: flags bit operations reuse buttons bitfield (byte 5)
        flagIsSet(flag: number): boolean { return this.buttonPressed(flag as any); }
        setFlag(flag: number, on: boolean) { this.setButton(flag as any, on); }
    }
}
