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
    * Total fixed = 16 bytes + 1 (packet type) = 17 bytes total.
    */
    export class BotStatusMessage extends radiop.RadioPayload {
        public code: number;       // int32
        public dist: number;       // int16
        public pinState: number;   // int16 (bit fields)
        public flags: number;      // int32 (bit fields)
        public imageBits: number;  // int32 (25 bits)

        static readonly PACKET_SIZE = 17; // exact size including type byte

    // Byte layout (after packet type byte @0):
    // code:int32 @1..4, dist:int16 @5..6, pinState:int16 @7..8, flags:int32 @9..12,
    // imageBits:int32 @13..16, message chars @17..
    // (Offsets inlined in code to save memory.)

        constructor(code: number, dist: number, pinState: number, flags: number, imageBits?: number) {
            super(radiop.PayloadType.BOT_STATUS, BotStatusMessage.PACKET_SIZE);
            this.fromValues(code, dist, pinState, flags, imageBits || 0);
        }

        private fromValues(code: number, dist: number, pinState: number, flags: number, imageBits: number) {
            this.code = code | 0;
            this.dist = dist | 0;
            this.pinState = pinState | 0;
            this.flags = flags | 0;
            this.imageBits = imageBits >>> 0;

            this.buffer.setNumber(NumberFormat.Int32LE, 1, this.code);      // code
            this.buffer.setNumber(NumberFormat.Int16LE, 5, this.dist);      // dist
            this.buffer.setNumber(NumberFormat.Int16LE, 7, this.pinState);  // pinState
            this.buffer.setNumber(NumberFormat.Int32LE, 9, this.flags);     // flags
            this.buffer.setNumber(NumberFormat.Int32LE, 13, this.imageBits);// imageBits
        }

        static fromBuffer(buffer: Buffer): BotStatusMessage {
            let code = buffer.getNumber(NumberFormat.Int32LE, 1);
            let dist = buffer.getNumber(NumberFormat.Int16LE, 5);
            let pinState = buffer.getNumber(NumberFormat.Int16LE, 7);
            let flags = buffer.getNumber(NumberFormat.Int32LE, 9);
            let imageBits = buffer.getNumber(NumberFormat.Int32LE, 13) >>> 0;
            return new BotStatusMessage(code, dist, pinState, flags, imageBits);
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
            this.buffer.setNumber(NumberFormat.Int32LE, 13, this.imageBits);
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
            return h >>> 0;
        }

        get handler(): (payload: radiop.RadioPayload) => void {
            return _onReceiveBotStatusHandler; // user can hook via onPayload() for now
        }
    }

    //% blockId=bot_status_send block="send bot status code $code dist $dist flags $flags image $image msg $msg" weight=80 group="Robot"
    export function sendBotStatus(code: number, dist: number, pinState: number, flags: number, image?: Image | null) {
        radiop.initDefaults();
        let bsm = new BotStatusMessage(code, dist, pinState, flags, 0);
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
