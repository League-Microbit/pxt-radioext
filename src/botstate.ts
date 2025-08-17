namespace radiop {

    /**
     * Send a BotState message with the given sonar distance.
     * @param distance the sonar distance in cm
     */
    //% blockId=botstate_send_sonar block="send bot state sonar %distance|cm" group="Bot State"
    export function sendBotStateSonar(distance: number): void {
        const bs = new radiop.BotStatePayload();
        bs.sonarDistance = distance;
        bs.send();
    }

    /**
     * Send a BotState message with the given icon image.
     * @param icon the icon to display
     */
    //% blockId=botstate_send_image block="send bot state image %icon" group="Bot State"
    export function sendBotStateImage(icon: IconNames): void {
        const bs = new radiop.BotStatePayload();
        bs.setIcon(icon);
        bs.send();
    }

    /**
     * Send a BotState message with a tone and duration.
     * @param note the note to play (octave and note packed as in setOctaveNote)
     * @param duration the duration in 10ms units
     */
    //% blockId=botstate_send_tone block="send bot state tone %note|duration %duration" group="Bot State"
    export function sendBotStateTone(note: number, duration: number): void {
        const bs = new radiop.BotStatePayload();
        bs.tone = note & 0xff;
        bs.duration = duration & 0xff;
        bs.send();
    }

    /**
     * Send a BotState message with the given flags byte.
     * @param flags the flags byte
     */
    //% blockId=botstate_send_flags block="send bot state flags %flags" group="Bot State"
    export function sendBotStateFlags(flags: number): void {
        const bs = new radiop.BotStatePayload();
        bs.flags = flags;
        bs.send();
    }

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

        get flags(): number { return this.gb(); }
        set flags(value: number) { this.sb(value); }

    }



}
