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
        AccelZ = 4
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


    // Joystickbit pins for joystick and buttons
    export enum JoystickBitPin {
        C = DigitalPin.P12,
        D = DigitalPin.P13,
        E = DigitalPin.P14,
        F = DigitalPin.P15,
        X = AnalogPin.P1,
        Y = AnalogPin.P2,
    }


    /**
     * Joystick payload with x, y, buttons, and accelerometer data
     */
    export class JoyPayload extends radiop.RadioPayload {

        public x: number;
        public y: number;
        public buttons: number[];
        public accelX: number;
        public accelY: number;
        public accelZ: number;

        static PACKET_SIZE = 12; // Size of the payload in bytes

        constructor(x: number, y: number, buttons: number[], accelX: number, accelY: number, accelZ: number) {
            super(radiop.PayloadType.JOY, JoyPayload.PACKET_SIZE);
            this.fromValues(x, y, buttons, accelX, accelY, accelZ);
        }

        /**
         * Create a JoyPayload from a received buffer
         */
        static fromBuffer(buffer: Buffer): JoyPayload {
            // Extract values from buffer
            let x = Math.abs(buffer.getNumber(NumberFormat.UInt16LE, 1));
            let y = Math.abs(buffer.getNumber(NumberFormat.UInt16LE, 3));

            // There was a negative somewhere ...
            if (x > 65000) x = 0; // Clamp to valid range
            if (x > 1023) x = 1023; // Clamp to valid range
            if (y > 65000) y = 0; // Clamp to valid range
            if (y > 1023) y = 1023; // Clamp to valid range

            // Extract button bits
            let buttonBits = buffer.getNumber(NumberFormat.UInt8LE, 5);
            let buttons: number[] = [];
            for (let i = 0; i < 8; i++) {
                if (buttonBits & (1 << i)) {
                    buttons.push(i);
                }
            }
            
            let accelX = buffer.getNumber(NumberFormat.Int16LE, 6);
            let accelY = buffer.getNumber(NumberFormat.Int16LE, 8);
            let accelZ = buffer.getNumber(NumberFormat.Int16LE, 10);

            return new JoyPayload(x, y, buttons, accelX, accelY, accelZ);
        }

        private fromValues(x: number, y: number, buttons: number[], accelX: number, accelY: number, accelZ: number): void {
            // Store values
            this.x = Math.abs(x);
            this.y = Math.abs(y);
            this.buttons = buttons;
            this.accelX = accelX;
            this.accelY = accelY;
            this.accelZ = accelZ;

            // Build the buffer
            this.buffer.setNumber(NumberFormat.UInt16LE, 1, this.x);
            this.buffer.setNumber(NumberFormat.UInt16LE, 3, this.y);
            
            // Convert button array to single byte with bits set
            let buttonBits = 0;
            for (let i = 0; i < Math.min(this.buttons.length, 8); i++) {
                if (this.buttons[i] < 8) {
                    buttonBits |= (1 << this.buttons[i]);
                }
            }
            this.buffer.setNumber(NumberFormat.UInt8LE, 5, buttonBits);
            
            // Add accelerometer values
            this.buffer.setNumber(NumberFormat.Int16LE, 6, this.accelX);
            this.buffer.setNumber(NumberFormat.Int16LE, 8, this.accelY);
            this.buffer.setNumber(NumberFormat.Int16LE, 10, this.accelZ);
        }

        get payloadLength() {
            return this.buffer.length;
        }

        get hash(): number {
            // Simple hash based on x, y, buttons, and accelerometer values
            let hash = 0;
            hash ^= this.x;
            hash ^= this.y;
            for (let button of this.buttons) {
                hash ^= (1 << button);
            }
            hash ^= this.accelX;
            hash ^= this.accelY;
            hash ^= this.accelZ;
            return hash;
        }

        get str(): string {
            return `JoyPayload(x=${this.x}, y=${this.y}, buttons=[${this.buttons.join(", ")}], accelX=${this.accelX}, accelY=${this.accelY}, accelZ=${this.accelZ})`;
        }

        public buttonPressed(button: JoystickButton): boolean {
            return this.buttons.indexOf(button) !== -1;
        }

        get handler(): (payload: radiop.RadioPayload) => void {
            return _onReceiveJoyHandler;
        }
    }


    /**
     * Send the current joystick state over radio only if it is different from the previous one
     */
    //% blockId=joystick_send_if_changed block="send joystick state if changed"
    //% group="Joystick"

    export function sendIfChanged(jp: radiop.JoyPayload): boolean {

        let hasChanged = ( !_lastSentPayload || _lastSentPayload.hash != jp.hash);
        if ( hasChanged) {
            jp.send();
        }
        _lastSentPayload = jp;

        return hasChanged;
    }

    /**
     * Run code when a joystick message is received
     */
    //% blockId=joystick_on_receive block="on receive joystick"
    //% group="Joystick"
    //% weight=100
    export function onReceiveJoystickMessage(handler: (payload: radiop.JoyPayload) => void) {
        radiop.initDefaults(); // Ensure radio is initialized
        
        _onReceiveJoyHandler = function (payload: JoyPayload) {
            lastJoyPayload = payload;
            handler(payload);
        };
    }

    export function sendJoyPayload(x: number, y: number, buttons: number[], accelX: number, accelY: number, accelZ: number): void {
        radiop.initDefaults();
        let payload = new radiop.JoyPayload(x, y, buttons, accelX, accelY, accelZ);
        radio.sendBuffer(payload.getBuffer());
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
            default: return 0;
        }
    }

    /**
     * Check if a button is pressed
     */
    //% blockId=joystick_button_pressed block="joystick button %button pressed"
    //% group="Joystick"
    //% weight=80
    export function buttonPressed(button: JoystickButton): boolean {
        if (!lastJoyPayload) return false;
        return lastJoyPayload.buttons.indexOf(button) !== -1;
    }




}