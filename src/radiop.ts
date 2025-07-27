/* Radio Payloads
* Specialized payloads for sending radio messages. The messaged include: 
* 
* JoyPayload - for joystick data including position, buttons, and accelerometer
*/

namespace radiop {

    let _group: number = 1;
    let _channel: number = 7;

    export function setGroup(group: number) {
        _group = group;
        radio.setGroup(group);
    }

    export function getGroup(): number {
        return _group;
    }

    export function setChannel(channel: number) {
        _channel = channel;
        radio.setFrequencyBand(channel);
    }

    export function getChannel(): number {
        return _channel;
    }

    export enum PayloadType {
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
        public packet: radio.RadioPacket = undefined; 
        protected buffer: Buffer;
        protected packetType: number;

        constructor(packetType: number, size: number) {
            this.packetType = packetType;
            this.buffer = control.createBuffer(size);
            this.buffer.setNumber(NumberFormat.UInt8LE, 0, packetType);
        }


        get time(): number {
            if (this.packet) {
                return this.packet.time;
            }
            return 0;
        }

        get serial(): number {
            if (this.packet) {
                return this.packet.serial;
            }
            return 0;
        }

        get signal(): number {
            if (this.packet) {
                return this.packet.signal;
            }
            return 0;
        }
        static fromBuffer(buffer: Buffer): RadioPayload {
            return undefined;
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


        get str(): string {
            // Print buffer bytes as hex, separated by spaces (MakeCode: use toHex())
            let hex = this.buffer.toHex();
            // Insert spaces between every two hex digits
            let spaced = "";
            for (let i = 0; i < hex.length; i += 2) {
                if (i > 0) spaced += " ";
                spaced += hex.substr(i, 2);
            }
            return `RadioPayload(type=${this.packetType}, length=${this.payloadLength}, bytes=${spaced})`;
        }

    }

    function extractPayload(buffer: Buffer): RadioPayload {
        let packetType = buffer.getNumber(NumberFormat.UInt8LE, 0);
        switch (packetType) {
            case PayloadType.JOY:
                return joystickp.JoyPayload.fromBuffer(buffer);
            case PayloadType.HERE_I_AM:
                return negotiate.HereIAm.fromBuffer(buffer);
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
        setGroup(group);
        setChannel(channel);
        radio.setTransmitSerialNumber(true);
        
        if (power !== undefined) {
            radio.setTransmitPower(power);
        } else {
            radio.setTransmitPower(7);
        }

        // Set up radio packet received handler
        radio.onReceivedBuffer(function (buffer: Buffer) {
            let payload = extractPayload(buffer);
            payload.packet = radio.lastPacket;

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