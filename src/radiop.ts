/* Radio Payloads
* Specialized payloads for sending radio messages. The messaged include: 
* 
* JoyPayload - for joystick data including position, buttons, and accelerometer
*/
//% color=#0066CC weight=95 icon="\uf11b" 
namespace radiop {

    export const BROADCAST_CHANNEL : number  = 1; // Default broadcast channel for HereIAm messages
    export const BROADCAST_GROUP: number = 1; // Default broadcast group for HereIAm messages

    export const radioIcon: Image = images.createImage(`
                                        # # # . .
                                        . . . # .
                                        # # . . #
                                        . . # . #
                                        # . # . #`);


    export const CHANNEL_MIN = radiop.BROADCAST_CHANNEL + 1; // Minimum channel number
    export const CHANNEL_MAX = 100; // Maximum channel number
    export const GROUP_MIN = radiop.BROADCAST_GROUP + 1; // Minimum group number
    export const GROUP_MAX = 255; // Maximum group number

    let _group: number = radiop.BROADCAST_GROUP;
    let _channel: number = radiop.BROADCAST_CHANNEL;

    let transmittingSerial: boolean = true;
    let initialized = false;

    let payloadHandler: (payload: RadioPayload) => void; // Handles any payload if no specific handler is set


    export enum PayloadType {
        JOY = 10,
        HERE_I_AM = 11,
        BOT_STATUS = 12
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




    /**
     * Base class for all radio payloads
     */
    export class RadioPayload {

        readonly BYTE_POS_PACKET_TYPE = 0; // Position of packet type in the buffer
        readonly BYTE_POS_PAYLOAD_START = 1; // Position of payload start in the buffer
        static readonly MAX_PACKET_SIZE = 19; // Maximum payload size in bytes (micro:bit radio limit)


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
            let spaced = "";
            return "rp " + this.packetType + " l=" + this.payloadLength;
        }
    }

    /* Construct a payload from a buffer. This is the central
    * place to add definitions for new payloads */
    function extractPayload(buffer: Buffer): RadioPayload {
        let packetType = buffer.getNumber(NumberFormat.UInt8LE, 0);
        switch (packetType) {
            case PayloadType.JOY:
                return radiop.JoyPayload.fromBuffer(buffer);
            case PayloadType.HERE_I_AM:
                return radiop.HereIAm.fromBuffer(buffer);
            case PayloadType.BOT_STATUS:
                return radiop.BotStatusMessage.fromBuffer(buffer);
        }

        return undefined;
    }

    /**
     * Check if the radio is initialized
     * @returns true if the radio is initialized, false otherwise
     */
    //% blockId=radio_is_initialized block="is radio initialized"
    export function isInitialized(): boolean {
        return initialized;
    }
    /**
     * Initialize the radio for joystick payloads
     * @param channel radio channel (default 1, range 1-100)
     * @param group radio group (default 1, range 1-254)  
     * @param power transmit power (default 7, range 1-7)
     */
    //% blockId=radio_init block="initialize radio on channel $channel group $group power $power"
    //% channel.min=1 channel.max=100 channel.defl=1
    //% group.min=1 group.max=254 group.defl=1
    //% power.min=1 power.max=7 power.defl=7
    //% group="radio"
    export function init(channel: number = BROADCAST_CHANNEL,
        group: number = BROADCAST_GROUP, power: number = 7) {
        
        if (initialized) {
            if (channel !== _channel || group !== _group) {
                // If channel or group changed, reinitialize
                // removed serial logging (reinitializing)
                setGroup(group);
                setChannel(channel);
                radio.setTransmitPower(power);
                broadcastHereIAm(); // Resend HereIAm message
            } else {
                // removed serial logging (already initialized)
            }

            return;
        }
        
        initialized = true;

        // Initialize radio
    // removed serial logging (initialized)
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
                // handler for specific payload type
                handler(payload);
            }
            
            // Global payload handler if set
            if (payloadHandler) {
                // global payload handler
                payloadHandler(payload);
            } 
        });

    }

    export function initDefaults() {
        
        if (!initialized) {
            init(BROADCAST_CHANNEL, BROADCAST_GROUP, 7);
        }
    }

    /**
     * Set a global handler for any radio payload
     * @param handler function to handle the payload
     */
    //% blockId=radio_on_payload block="on radio extended payload"
    //% group="radio"
   export function onPayload(handler: (payload: RadioPayload) => void) {
       payloadHandler = handler;
   }




}