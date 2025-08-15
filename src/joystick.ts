/**
 * Joystick blocks for micro:bit
 */

namespace radiop {

    let _lastSentPayload: JoyPayload = null;
    export let lastJoyPayload: JoyPayload = null;

    let _onReceiveJoyHandler: (payload: radiop.RadioPayload) => void = undefined;

        /**
     * Joystick value types
     */
    export enum JoystickValue {
        //% block="X"
        X = 0,
        //% block="Y"
        Y = 1,
        //% block="Accelerometer X"
        AccelX = 2,
        //% block="Accelerometer Y"
        AccelY = 3,
        //% block="Accelerometer Z"
        AccelZ = 4,
        //% block="Data"
        Data = 5,
        //% block="Tone"
        Tone = 6,
        //% block="Duration"
        Duration = 7
    }

    /**
     * Joystick button types
     */
    export enum JoystickButton {
        //% block="A"
        A = 0,
        //% block="B"
        B = 1,
        //% block="Logo"
        Logo = 2,
        //% block="C"
        C = 3,
        //% block="D"
        D = 4,
        //% block="E"
        E = 5,
        //% block="F"
        F = 6
    }

    function clip(x: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, x));
    }

    // Buffer-backed joystick payload; all fields accessed via getters/setters to minimize RAM/flash.
    // Layout (20 bytes total):
    //  Byte   0 : packet type (radiop.PayloadType.JOY)
    //  Bytes 1-2: X (UInt16LE) 0-1023 (stored absolute)
    //  Bytes 3-4: Y (UInt16LE) 0-1023 (stored absolute)
    //  Byte   5 : Buttons bitfield (bits 0..7 map to JoystickButton A..F etc.)
    //  Bytes 6-7: accelX (Int16LE) clipped to [-1023,1023]
    //  Bytes 8-9: accelY (Int16LE) clipped to [-1023,1023]
    //  Bytes 10-11: accelZ (Int16LE) clipped to [-1023,1023]
    //  Bytes 12-13: datau16 (UInt16LE) generic 16-bit data
    //  Bytes 14-17: image (UInt32LE) generic 32-bit status / icon bitmap (25 bits used)
    //  Byte  18 : tone (UInt8LE) (e.g. note or frequency index)
    //  Byte  19 : duration (UInt8LE) (e.g. ms / scaled units)
    // Offsets are kept as raw literals in code for smallest image size. Using const variables could add indirections;
    // a const enum would inline but simple comments avoid any risk while documenting the layout.
    export class JoyPayload extends radiop.RadioPayload {
    static readonly PACKET_SIZE: number = 20; // 1 +2 +2 +1 +2 +2 +2 +2 +4 +1 +1
        constructor(buf?: Buffer) {
            super(radiop.PayloadType.JOY, JoyPayload.PACKET_SIZE);
            if (buf) this.buffer = buf;
            else this.buffer.setNumber(NumberFormat.UInt8LE, 0, radiop.PayloadType.JOY);
        }
        static fromBuffer(b: Buffer): JoyPayload {
            if (!b || b.length < JoyPayload.PACKET_SIZE) return null;
            return new JoyPayload(b);
        }

        get x(): number { return this.u16(1); }
        set x(v: number) { this.su16(1,clip(Math.abs(v),0,1023)|0); }
        get y(): number { return this.u16(3); }
        set y(v: number) { this.su16(3, clip(Math.abs(v), 0, 1023) | 0); }
        
        // Get and set the button values. 
        private gb(): number { return this.buffer.getNumber(NumberFormat.UInt8LE,5); }
        private sb(v: number) { this.buffer.setNumber(NumberFormat.UInt8LE,5,v&0xff); }
        
        get accelX(): number { return this.i16(6); }
        set accelX(v: number) { this.si16(6, clip(v,-1023,1023)|0); }
        get accelY(): number { return this.i16(8); }
        set accelY(v: number) { this.si16(8, clip(v, -1023, 1023) | 0); }
        get accelZ(): number { return this.i16(10); }
        set accelZ(v: number) { this.si16(10, clip(v, -1023, 1023) | 0); }


        // datau16 at 12-13
        get datau16(): number { return this.u16(12); }
        set datau16(v: number) { this.su16(12, v & 0xffff); }

        // tone/duration at 18,19
        get tone(): number { return this.buffer.getNumber(NumberFormat.UInt8LE, 18); }
        set tone(v: number) { this.buffer.setNumber(NumberFormat.UInt8LE, 18, v & 0xff); }

        get duration(): number { return this.buffer.getNumber(NumberFormat.UInt8LE, 19); }
        set duration(v: number) { this.buffer.setNumber(NumberFormat.UInt8LE, 19, v & 0xff); }

        // Raw 25-bit (stored in 32-bit) image value
        get image(): number { return this.buffer.getNumber(NumberFormat.UInt32LE,14); }
        set image(v: number) { this.buffer.setNumber(NumberFormat.UInt32LE,14,(v|0)>>>0); }

        // (bytes 14-17 image already defined below; bytes 18-19 tone/duration)

        /** Set image from an IconNames enum value */
        setIcon(icon: IconNames) {
            if (icon !== undefined && icon !== null) this.image = radiop.imageToInt(images.iconImage(icon));
        }
            
        /** Set image from a 5x5 Image object */
        setImage(img: Image) { if (img) this.image = radiop.imageToInt(img); }
        /** Get image decoded as 5x5 Image */
        getImage(): Image { return radiop.intoToImage(this.image); }
                    
        buttonPressed(btn: JoystickButton): boolean { return (this.gb() & (1 << btn)) != 0; }
        setButton(btn: JoystickButton, on: boolean) { let bits=this.gb(); if (on) bits|=(1<<btn); else bits&=~(1<<btn); this.sb(bits); }
            clearButtons(){ this.sb(0); }
            buttonsArray(): number[]{ let r:number[]=[]; let bits=this.gb(); for (let i=0;i<8;i++) if (bits&(1<<i)) r.push(i); return r; }
            
        get handler(): (payload: radiop.RadioPayload) => void { return _onReceiveJoyHandler; }
        get payloadLength() { return JoyPayload.PACKET_SIZE; }
    }


    //% blockId=joystick_value block="joystick $payload value $value"
    //% group="Joystick"
    //% weight=90
    export function getValue(payload: JoyPayload, value: JoystickValue): number {
        if (!payload) return 0;
        switch (value) {
            case JoystickValue.X: return payload.x;
            case JoystickValue.Y: return payload.y;
            case JoystickValue.AccelX: return payload.accelX;
            case JoystickValue.AccelY: return payload.accelY;
            case JoystickValue.AccelZ: return payload.accelZ;
            case JoystickValue.Data: return payload.datau16;
            case JoystickValue.Tone: return payload.tone;
            case JoystickValue.Duration: return payload.duration;
        }
        return 0;
    }

    /**
     * Check if a button is pressed
     */
    //% blockId=joystick_button_pressed block="joystick $payload button $button pressed"
    //% group="Joystick"
    //% weight=80
    export function buttonPressed(payload: JoyPayload, button: JoystickButton): boolean {
        if (!payload) return false;
        return payload.buttonPressed(button);
    }

    /**
     * Get the 5x5 image stored in the joystick payload (lower 25 bits of image field)
     */
    //% blockId=joystick_get_image block="joystick $payload image"
    //% group="Joystick"
    //% weight=70
    export function getImage(payload: JoyPayload): Image {
        if (!payload) return images.createImage(`\n.....\n.....\n.....\n.....\n.....`);
        return payload.getImage();
    }

    /**
     * Get the generic 16-bit data value from the joystick payload
     */
    //% blockId=joystick_get_data block="joystick $payload data"
    //% group="Joystick"
    //% weight=60
    export function getData(payload: JoyPayload): number {
        if (!payload) return 0;
    return payload.datau16;
    }


    /** Send joystick state if changed */
    export function sendIfChanged(jp: radiop.JoyPayload): boolean {
        let hasChanged = (!_lastSentPayload || _lastSentPayload.hash != jp.hash);
        if (hasChanged) jp.send();
        _lastSentPayload = jp;
        return hasChanged;
    }

    export function sendJoyPayload(x: number, y: number, buttons: number[], accelX: number, accelY: number, accelZ: number): void {
        radiop.initDefaults();
        let p = new radiop.JoyPayload();
        p.x = x; p.y = y; p.accelX = accelX; p.accelY = accelY; p.accelZ = accelZ;
        let bits = 0; let n = buttons?buttons.length:0; for (let i=0;i<n && i<8;i++){ let bt=buttons[i]; if(bt>=0&&bt<8) bits |= (1<<bt);} 
        p["buffer"].setNumber(NumberFormat.UInt8LE,5,bits);
        radio.sendBuffer(p.getBuffer());
    }   

    /**
     * Run code when a joystick message is received
     */
    //% blockId=joystick_on_receive block="on receive joystick"
    //% group="Joystick"
    //% weight=100
    export function onReceiveJoystickMessage(handler: (payload: radiop.JoyPayload) => void) {

        _onReceiveJoyHandler = function (payload: JoyPayload) {
            lastJoyPayload = payload;
            handler(payload);
        };
    }




}