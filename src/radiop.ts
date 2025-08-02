/* Radio Payloads
* Specialized payloads for sending radio messages. The messaged include: 
* 
* JoyPayload - for joystick data including position, buttons, and accelerometer
*/
//% color=#0066CC weight=95 icon="\uf11b" blockNamespace="Radio Ext"
namespace radiop {

    export const CHANNEL_MIN = radiop.BROADCAST_CHANNEL + 1; // Minimum channel number
    export const CHANNEL_MAX = 100; // Maximum channel number
    export const GROUP_MIN = radiop.BROADCAST_GROUP + 1; // Minimum group number
    export const GROUP_MAX = 255; // Maximum group number

    let _group: number = radiop.BROADCAST_GROUP;
    let _channel: number = radiop.BROADCAST_CHANNEL;



    export enum PayloadType {
        JOY = 10,
        HERE_I_AM = 11
    }

    export function setGroup(group: number) {
        if (group != _group) {
            _group = group;
            radiop.peerDb.clearPeers(); // Clear peers when group changes
        }
        radio.setGroup(group);
    }

    export function getGroup(): number {
        return _group;
    }

    export function setChannel(channel: number) {
        if (channel != _channel) {
            radiop.peerDb.clearPeers(); // Clear peers when channel changes
            _channel = channel;
        }
        
        radio.setFrequencyBand(channel);
    }

    export function getChannel(): number {
        return _channel;
    }



    let transmittingSerial: boolean = true;
    let initialized = false;
    let payloadHandler: (payload: RadioPayload) => void; // Handles any payload if no specific handler is set

    /**
     * Base class for all radio payloads
     */
    export class RadioPayload {

        readonly BYTE_POS_PACKET_TYPE = 0; // Position of packet type in the buffer
        readonly BYTE_POS_PAYLOAD_START = 1; // Position of payload start in the buffer



        public packet: radio.RadioPacket = undefined; 
        protected buffer: Buffer;
        protected packetType: number;

        constructor(packetType: number, size: number) {
            this.packetType = packetType;
            this.buffer = control.createBuffer(size);
            this.buffer.setNumber(NumberFormat.UInt8LE, this.BYTE_POS_PACKET_TYPE, packetType);
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

        send(): void {
            radio.sendBuffer(this.getBuffer());
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

    /* Construct a payload from a buffer. This is the central
    * place to add definitions for new payloads */
    function extractPayload(buffer: Buffer): RadioPayload {
        let packetType = buffer.getNumber(NumberFormat.UInt8LE, 0);
        switch (packetType) {
            case PayloadType.JOY:
                return joystickp.JoyPayload.fromBuffer(buffer);
            case PayloadType.HERE_I_AM:
                return radiop.HereIAm.fromBuffer(buffer);
        }

        return undefined;
    }


    /**
     * Initialize the radio for joystick payloads
     * @param group radio group (default 1)
     * @param channel radio channel (default 7)
     * @param power transmit power (default 7, range 0-7)
     */
    export function init(channel: number = radiop.BROADCAST_CHANNEL,
                          group: number = radiop.BROADCAST_GROUP, power?: number) {
        if (initialized) {
            serial.writeLine("Radio already initialized");
            return;
        }
        initialized = true;

        // Initialize radio
        serial.writeLine(`Radio initialized on channel ${channel}, group ${group}`);
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

            if (!payload) return;

            payload.packet = radio.lastPacket;
            
            // Handler specific to the payload type
            let handler = payload.handler;
            if (handler) {
                //serial.writeLine("oRB handler");
                handler(payload);
            }
            
            // Global payload handler if set
            if (payloadHandler) {
                //serial.writeLine("ORB payloadHandler");
                payloadHandler(payload);
            } 
        });

    }

    /**
     * Set a global handler for any radio payload
     * @param handler function to handle the payload
     */
    //% blockId=radio_on_payload block="on radio extended payload"
   export function onPayload(handler: (payload: RadioPayload) => void) {
       payloadHandler = handler;
   }




}