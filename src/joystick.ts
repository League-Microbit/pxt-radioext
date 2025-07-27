/**
 * Joystick blocks for micro:bit
 */
//% color=#0066CC weight=95 icon="\uf11b" groups='["Events", "Values"]'
namespace joystick {

    let _lastSentPayload: radiop.JoyPayload = null;

    /**
     * Send the current joystick state over radio only if it is different from the previous one
     */
    //% blockId=joystick_send_if_changed block="send joystick state if changed"
    //% group="Events"
    //% weight=70
    export function sendIfChanged() {
        let jp = radiop.JoyPayload.fromHardware();
        if (_lastSentPayload && _lastSentPayload.hash != jp.hash) {
            radio.sendBuffer(jp.getBuffer());
        }
        _lastSentPayload = jp;
    }

    export let lastJoyPayload: radiop.JoyPayload = null;


    /**
     * Run code when a joystick message is received
     */
    //% blockId=joystick_on_receive block="on receive joystick"
    //% group="Events"
    //% weight=100
    export function onReceive(handler: () => void) {
        radiop.onReceiveJoy(function (payload: radiop.JoyPayload) {
            lastJoyPayload = payload;
            handler();
        });
    }

    /**
     * Get joystick and accelerometer values
     */
    //% blockId=joystick_value block="joystick %value"
    //% group="Values"
    //% weight=90
    export function getValue(value: JoystickValue): number {
        if (!lastJoyPayload) return 0;
        
        switch (value) {
            case JoystickValue.X: return lastJoyPayload.x;
            case JoystickValue.Y: return lastJoyPayload.y;
            case JoystickValue.AccelX: return lastJoyPayload.accelX;
            case JoystickValue.AccelY: return lastJoyPayload.accelY;
            case JoystickValue.AccelZ: return lastJoyPayload.accelZ;
            default: return 0;
        }
    }

    /**
     * Check if a button is pressed
     */
    //% blockId=joystick_button_pressed block="joystick button %button pressed"
    //% group="Values"
    //% weight=80
    export function buttonPressed(button: JoystickButton): boolean {
        if (!lastJoyPayload) return false;
        return lastJoyPayload.buttons.indexOf(button) !== -1;
    }

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
}