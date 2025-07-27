/* Radio Payloads
* Specialized payloads for sending radio messages. The messaged include: 
* 
* JoyPayload - for joystick data including position, buttons, and accelerometer
*/

namespace radiop {

    export enum PacketType {
        JOY = 10,
        HERE_I_AM = 11
    }

    let transmittingSerial: boolean = true;
    let initialized = false;
    let payloadHandler: (payload: RadioPayload) => void; // Handles any payload if no specific handler is set

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

        get handler(): (payload: RadioPayload) => void {
            return undefined;
        }
    }

    function extractPayload(buffer: Buffer): RadioPayload {
        let packetType = buffer.getNumber(NumberFormat.UInt8LE, 0);
        switch (packetType) {
            case PacketType.JOY:
                return joystickp.JoyPayload.fromBuffer(buffer);
        }

        return undefined;
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
        radio.onReceivedBuffer(function (buffer: Buffer) {
            let payload = extractPayload(buffer);

            if (!payload) return;

            let handler = payload.handler;

            if (handler) {
                handler(payload);
            } else {
                // If no specific handler, use the global payload handler
                // if it exists
                if (payloadHandler) {
                    payloadHandler(payload);
                }
            }
        });

    }

   export function onPayload(handler: (payload: RadioPayload) => void) {
       payloadHandler = handler;
   }




}