namespace radiop {

    let _lastSentBSPayload: BotStatusMessage = null;
    export let lastBotStatusMessage: BotStatusMessage = null;

    let _onReceiveBotStatusHandler: (payload: radiop.RadioPayload) => void = undefined;


    /* BotStatusMessage
    * code: int32 (4 bytes)
    * dist: int16 (2 bytes)
    * pinState: int16 (2 bytes)
    * flags: int32 (4 bytes)
    * image: int32 (4 bytes) - 25 bits used (5x5 LED matrix) packed LSB first (bit0 = (0,0))
    * message: remaining bytes (up to PACKET_SIZE - header)
    * Total fixed = 16 bytes + 1 (packet type) = 17 before message. We'll cap packet at 32 bytes like others.
    */
    export class BotStatusMessage extends radiop.RadioPayload {
        public code: number;       // int32
        public dist: number;       // int16
        public pinState: number;   // int16 (bit fields)
        public flags: number;      // int32 (bit fields)
        public imageBits: number;  // int32 (25 bits)
        public message: string;    // remaining

        
        static readonly FIXED_SIZE = 1 /*type*/ + 4 + 2 + 2 + 4 + 4; // 17 bytes so far (including type)
        static readonly MAX_PACKET_SIZE = radiop.RadioPayload.MAX_PACKET_SIZE; // align with base limit
        static readonly MAX_MESSAGE_LEN = BotStatusMessage.MAX_PACKET_SIZE - BotStatusMessage.FIXED_SIZE;

        // Byte offsets after packet type
        private static readonly OFF_CODE = 1;
        private static readonly OFF_DIST = BotStatusMessage.OFF_CODE + 4;
        private static readonly OFF_PINSTATE = BotStatusMessage.OFF_DIST + 2;
        private static readonly OFF_FLAGS = BotStatusMessage.OFF_PINSTATE + 2;
        private static readonly OFF_IMAGE = BotStatusMessage.OFF_FLAGS + 4;
        private static readonly OFF_MSG = BotStatusMessage.OFF_IMAGE + 4; // start of message chars

        constructor(code: number, dist: number, pinState: number, flags: number, imageBits?: number, message?: string) {
            super(radiop.PayloadType.BOT_STATUS, BotStatusMessage.MAX_PACKET_SIZE);
            this.fromValues(code, dist, pinState, flags, imageBits || 0, message || "");
        }

        private fromValues(code: number, dist: number, pinState: number, flags: number, imageBits: number, message: string) {
            this.code = code | 0;
            this.dist = dist | 0;
            this.pinState = pinState | 0;
            this.flags = flags | 0;
            this.imageBits = imageBits >>> 0;
            this.message = message || "";

            this.buffer.setNumber(NumberFormat.Int32LE, BotStatusMessage.OFF_CODE, this.code);
            this.buffer.setNumber(NumberFormat.Int16LE, BotStatusMessage.OFF_DIST, this.dist);
            this.buffer.setNumber(NumberFormat.Int16LE, BotStatusMessage.OFF_PINSTATE, this.pinState);
            this.buffer.setNumber(NumberFormat.Int32LE, BotStatusMessage.OFF_FLAGS, this.flags);
            this.buffer.setNumber(NumberFormat.Int32LE, BotStatusMessage.OFF_IMAGE, this.imageBits);

            // Truncate / pack message
            const len = Math.min(this.message.length, BotStatusMessage.MAX_MESSAGE_LEN);
            for (let i = 0; i < len; ++i) {
                this.buffer.setUint8(BotStatusMessage.OFF_MSG + i, this.message.charCodeAt(i) & 0xFF);
            }
            // Zero fill remainder for determinism
            for (let j = len; j < BotStatusMessage.MAX_MESSAGE_LEN; ++j) {
                this.buffer.setUint8(BotStatusMessage.OFF_MSG + j, 0);
            }
        }

        static fromBuffer(buffer: Buffer): BotStatusMessage {
            let code = buffer.getNumber(NumberFormat.Int32LE, BotStatusMessage.OFF_CODE);
            let dist = buffer.getNumber(NumberFormat.Int16LE, BotStatusMessage.OFF_DIST);
            let pinState = buffer.getNumber(NumberFormat.Int16LE, BotStatusMessage.OFF_PINSTATE);
            let flags = buffer.getNumber(NumberFormat.Int32LE, BotStatusMessage.OFF_FLAGS);
            let imageBits = buffer.getNumber(NumberFormat.Int32LE, BotStatusMessage.OFF_IMAGE) >>> 0;
            let chars: string[] = [];
            for (let i = 0; i < BotStatusMessage.MAX_MESSAGE_LEN; ++i) {
                const c = buffer.getUint8(BotStatusMessage.OFF_MSG + i);
                if (c == 0) break;
                chars.push(String.fromCharCode(c));
            }
            let msg = chars.join("");
            return new BotStatusMessage(code, dist, pinState, flags, imageBits, msg);
        }

        // Bit helpers for pinState & flags
        public setPinBit(bit: number, value: boolean) {
            if (bit < 0 || bit > 15) return;
            if (value) this.pinState |= (1 << bit); else this.pinState &= ~(1 << bit);
            this.buffer.setNumber(NumberFormat.Int16LE, BotStatusMessage.OFF_PINSTATE, this.pinState);
        }
        public getPinBit(bit: number): boolean {
            if (bit < 0 || bit > 15) return false;
            return (this.pinState & (1 << bit)) != 0;
        }
        public setFlag(bit: number, value: boolean) {
            if (bit < 0 || bit > 31) return;
            if (value) this.flags |= (1 << bit); else this.flags &= ~(1 << bit);
            this.buffer.setNumber(NumberFormat.Int32LE, BotStatusMessage.OFF_FLAGS, this.flags);
        }
        public getFlag(bit: number): boolean {
            if (bit < 0 || bit > 31) return false;
            return (this.flags & (1 << bit)) != 0;
        }

        // Image helpers (5x5) using bits
        // bit index = y*5 + x (0..24)
        private coordBit(x: number, y: number): number { return y * 5 + x; }

        public setImageFromImage(img: Image) {
            if (!img) return;
            let bits = 0;
            for (let y = 0; y < 5; y++) {
                for (let x = 0; x < 5; x++) {
                    if (img.pixel(x, y)) {
                        bits |= (1 << this.coordBit(x, y));
                    }
                }
            }
            this.setImageBits(bits);
        }

        //% blockId=bot_status_set_icon block="set bot status image to icon %icon" weight=70 group="bot"
        public setImageFromIcon(icon: IconNames) {
            if (icon === undefined || icon === null) return;
            let img = images.iconImage(icon);
            this.setImageFromImage(img);
        }
        // Alias for clarity (enum based)
        public setImageIcon(icon: IconNames) { this.setImageFromIcon(icon); }

        public setImageBits(bits: number) {
            this.imageBits = bits >>> 0;
            this.buffer.setNumber(NumberFormat.Int32LE, BotStatusMessage.OFF_IMAGE, this.imageBits);
        }

        public toImage(): Image {
            let img = images.createImage(`
.....
.....
.....
.....
.....`);
            for (let y = 0; y < 5; y++) {
                for (let x = 0; x < 5; x++) {
                    let bit = this.coordBit(x, y);
                    img.setPixel(x, y, (this.imageBits & (1 << bit)) != 0);
                }
            }
            return img;
        }

        get hash(): number {
            // Combine the primary fields
            let h = 0;
            h ^= this.code;
            h ^= (this.dist & 0xFFFF) << 1;
            h ^= (this.pinState & 0xFFFF) << 2;
            h ^= this.flags;
            h ^= this.imageBits;
            if (this.message && this.message.length) h ^= this.message.charCodeAt(0) << 16;
            return h >>> 0;
        }

        get str(): string {
            return "BS(code=" + this.code +
                ", dist=" + this.dist +
                ", pinState=" + this.pinState +
                ", flags=" + this.flags +
                ", imageBits=0x" + radiop.toHex(this.imageBits) +
                ")";
        }

        get handler(): (payload: radiop.RadioPayload) => void {
            return _onReceiveBotStatusHandler; // user can hook via onPayload() for now
        }
    }

    //% blockId=bot_status_send block="send bot status code %code dist %dist flags %flags" weight=80 group="bot"
    export function sendBotStatus(code: number, dist: number, pinState: number, flags: number, image?: Image, msg?: string) {
        radiop.initDefaults();
        let bsm = new BotStatusMessage(code, dist, pinState, flags, 0, msg);
        if (image) bsm.setImageFromImage(image);

        if(!lastBotStatusMessage || lastBotStatusMessage.hash != bsm.hash) {
            bsm.send();
        }
    }

    /**
    * Run code when a joystick message is received
    */
    //% blockId=joystick_on_receive block="on receive joystick"
    //% group="Joystick"
    //% weight=100
    export function onReceiveBotStatusMessage(handler: (payload: radiop.BotStatusMessage) => void) {
        radiop.initDefaults(); // Ensure radio is initialized

        _onReceiveBotStatusHandler = function (payload: radiop.BotStatusMessage) {
            lastBotStatusMessage = payload;
            handler(payload);
        };
    }
}
