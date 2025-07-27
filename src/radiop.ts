/* Radio Payloads
* Specialized payloads for sending radio messages. The messaged include: 
* 
* JoyPayload - for joystick data including position, buttons, and accelerometer
*/

namespace radiop {

    export const PACKET_TYPE_JOY = 10;

    let transmittingSerial: boolean = true;
    let initialized = false;

    /**
     * Base class for all radio payloads
     */
    export class RadioPayload {
        protected buffer: Buffer;
        protected packetType: number;

        constructor(packetType: number, size: number) {
            this.packetType = packetType;
            this.buffer = control.createBuffer(size);
            this.buffer.setNumber(NumberFormat.UInt8LE, 0, packetType);
        }

        getBuffer(): Buffer {
            return this.buffer;
        }

        getPacketType(): number {
            return this.packetType;
        }

        get payloadLength() {
            return 0;
        }

        get hash(): number {
            return 0;
        }
    }

    /**
     * Initialize the radio for joystick payloads
     * @param group radio group (default 1)
     * @param channel radio channel (default 7)
     * @param power transmit power (default 7, range 0-7)
     */
    export function init(group: number = 1, channel: number = 7, power?: number) {
        if (initialized) return;
        initialized = true;

        // Initialize radio
        radio.setGroup(group);
        radio.setFrequencyBand(channel);
        radio.setTransmitSerialNumber(true);
        
        if (power !== undefined) {
            radio.setTransmitPower(power);
        } else {
            radio.setTransmitPower(7);
        }

        // Set up radio packet received handler
        radio.onReceivedBuffer(function (receivedBuffer: Buffer) {
            let packetType = receivedBuffer.getNumber(NumberFormat.UInt8LE, 0);
            if (packetType == PACKET_TYPE_JOY && joystickp.onReceiveJoyHandler) {
                let payload = joystickp.JoyPayload.fromBuffer(receivedBuffer);
                joystickp.onReceiveJoyHandler(payload);
            }
        });
    }

    /**
     * Register a handler for when JoyPayload messages are received
     */
    export function onReceiveJoy(handler: (payload: joystickp.JoyPayload) => void) {
        joystickp.onReceiveJoyHandler = handler;
        init(); // Ensure radio is initialized
    }

    export function sendJoyPayload(x: number, y: number, buttons: number[], accelX: number, accelY: number, accelZ: number): void {
        init();
        let payload = new joystickp.JoyPayload(x, y, buttons, accelX, accelY, accelZ);
        radio.sendBuffer(payload.getBuffer());
    }   

}