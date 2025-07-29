/* Negotiation Messages
*
 */

namespace negotiate {

    export let lastPayload: HereIAm = null;
    let myClassId: string = "unknown"; // Default class ID
    let _runBeacon = true;

    let _onReceiveHandler: (payload: HereIAm) => void = defaultOnReceiveHandler;

    export const BROADCAST_CHANNEL = 1; // Default broadcast channel for HereIAm messages
    export const BROADCAST_GROUP = 1; // Default broadcast group for HereIAm messages

    export const radioIcon: Image = images.createImage(`
                                        # # # . .
                                        . . . # .
                                        # # . . #
                                        . . # . #
                                        # . # . #`);

    /* Record of a peer in the network */
    export class PeerRecord {
        public serial: number;
        public radioGroup: number;
        public radioChannel: number;
        public classId: string; // Class ID of the peer, like 'joystick' or 'robot'
        public lastSeen: number; // Timestamp of last seen
    }

    // Store peer records
    let _peers: PeerRecord[] = [];

    /**
     * Find the first peer by serial.
     */
    export function findPeerBySerial(serial: number): PeerRecord {
        for (let peer of _peers) {
            if (peer.serial == serial) {
                return peer;
            }
        }
        return null;
    }

    /**
     * Add a peer record. radioGroup and radioChannel are optional; if not set,
     * use radiop.getGroup() and radiop.getChannel().
     */
    export function addPeerRecord(serial: number, classId: string, radioGroup?: number, radioChannel?: number): PeerRecord {
        let peer = findPeerBySerial(serial);
        if (!peer) {
            peer = new PeerRecord();
            peer.serial = serial;
            _peers.push(peer);
        }

        peer.classId = classId;
        peer.radioGroup = radioGroup !== undefined ? radioGroup : radiop.getGroup();
        peer.radioChannel = radioChannel !== undefined ? radioChannel : radiop.getChannel();
        peer.lastSeen = input.runningTime();
        return peer;
    }

    /**
     * Find the first peer by classId.
     */
    export function findPeerByClassId(classId: string): PeerRecord {
        for (let peer of _peers) {
            if (peer.classId == classId) {
                return peer;
            }
        }
        return null;
    }

    
    export class HereIAm extends radiop.RadioPayload {
        public group: number;
        public channel: number;
        public classId: string;


        static readonly MAX_PAYLOAD = 19;
        static readonly PACKET_SIZE = HereIAm.MAX_PAYLOAD; // 2 (group) + 2 (channel) + 1 (str len) + up to 14 (string)

        constructor(classId: string, group?: number, channel?: number) {
            super(radiop.PayloadType.HERE_I_AM, HereIAm.PACKET_SIZE);
            this.fromValues(classId, group, channel);
        }

        fromValues(classId: string, group?: number, channel?: number): void {
            this.classId = classId;
            this.group = group !== undefined ? group : radiop.getGroup();
            this.channel = channel !== undefined ? channel : radiop.getChannel();

            const start = this.BYTE_POS_PAYLOAD_START;
            // Pack group and channel first
            this.buffer.setNumber(NumberFormat.UInt16LE, start, this.group);
            this.buffer.setNumber(NumberFormat.UInt16LE, start + 2, this.channel);
            // Pack string length
            let strLen = Math.min(classId.length, HereIAm.MAX_PAYLOAD - 5);
            this.buffer.setNumber(NumberFormat.UInt8LE, start + 4, strLen);
            // Pack string bytes using setUint8
            for (let i = 0; i < strLen; ++i) {
                this.buffer.setUint8(start + 5 + i, classId.charCodeAt(i));
            }
        }

        static fromBuffer(buffer: Buffer): HereIAm {
            const start = 1; // RadioPayload.BYTE_POS_PAYLOAD_START is 1
            let group = buffer.getNumber(NumberFormat.UInt16LE, start);
            let channel = buffer.getNumber(NumberFormat.UInt16LE, start + 2);
            let strLen = buffer.getNumber(NumberFormat.UInt8LE, start + 4);
            let chars = [];
            for (let i = 0; i < strLen; ++i) {
                chars.push(buffer.getUint8(start + 5 + i));
            }
            let classId = "";
            for (let i = 0; i < chars.length; ++i) {
                classId += String.fromCharCode(chars[i]);
            }
            return new HereIAm(classId, group, channel);
        }

        get hash(): number {
            return (this.classId.length > 0 ? this.classId.charCodeAt(0) : 0) ^ (this.serial || 0);
        }

        get str(): string {
            return `HereIaM(classId=${this.classId}, group=${this.group}, channel=${this.channel}, serial=0x${relib.toHex(this.serial)})`;
        }

        get handler(): (payload: HereIAm) => void {
            return _onReceiveHandler;
        }
    }

    export function defaultOnReceiveHandler(payload: HereIAm, handler?: (payload: HereIAm) => void) {
        lastPayload = payload;
       
        addPeerRecord(payload.serial, payload.classId,
            radiop.getGroup(), radiop.getChannel());
        
        if (handler) {
            handler(payload);
        }
    }

    export function onReceive(handler: (payload: HereIAm) => void) {
        _onReceiveHandler = function (payload: HereIAm) {
            defaultOnReceiveHandler(payload, handler);
        };
    }


    /* Send a HereIAm message to the broadcast channel and group */
    //% blockId=broadcast_here_i_am block="broadcast HereIAm message"
    export function broadcastHereIAm(hia: HereIAm) {
        let origChannel = radiop.getChannel();
        let origGroup = radiop.getGroup();
        radiop.setChannel(BROADCAST_CHANNEL);
        radiop.setGroup(BROADCAST_GROUP);
        hia.send(); 
        serial.writeLine(`Broadcasting HereIAm: ${hia.str} on channel ${radiop.getChannel()}, group ${radiop.getGroup()}`);

        radiop.setChannel(origChannel);
        radiop.setGroup(origGroup);
        basic.pause(100); // Allow some time for the message to be sent
    }

    export function init(classId: string){
        radiop.init();
        myClassId = classId;
        serial.writeLine(`Negotiation initialized for classId: ${myClassId}`);

        let lastChannel: number = undefined
        let lastGroup: number = undefined
        let bCountDown = 10;

        basic.forever(function () {
            if (_runBeacon) {
                let me = new HereIAm(myClassId);
            
                me.send(); // Send to my private radio 
                serial.writeLine(`Sending HereIAm: ${me.str} on channel ${radiop.getChannel()}, group ${radiop.getGroup()}`);

                // If the channel or group has changed, broadcast the HereIAm message
                // to the broadcast channel and group
                if (lastChannel !== radiop.getChannel() || lastGroup !== radiop.getGroup() || bCountDown <= 0) {
                    lastChannel = radiop.getChannel();
                    lastGroup = radiop.getGroup();
                    broadcastHereIAm(me);
                    bCountDown = 10; // Reset countdown
                }
                bCountDown--;
            }
            basic.pause(3000);
        });
        
    }

    /** Start the beacon loop */
    export function startBeacon() {
        _runBeacon = true;
    }

    /** Stop the beacon loop */
    export function stopBeacon() {
        _runBeacon = false;
    }

    

    /* Look for traffic on a channel/group    */

    function testChannel(i: number, channel: number, group: number): Boolean {

        //serial.writeString(`${i} Testing channel ${channel} in group ${group}...\n`);
        radiop.setGroup(group);
        radiop.setChannel(channel);

        negotiate.lastPayload = null; // Reset lastPayload
        ///serial.writeLine("Starting channel test handler = "+ _onReceiveHandler);


        let startTime = input.runningTime();

        radioIcon.showImage(0); // Show radio icon to indicate negotiation started

        while (input.runningTime() - startTime < 5000) {
            if (negotiate.lastPayload) {

                basic.showIcon(IconNames.No);
                basic.pause(100);

                return false; // Channel is occupied
            } else {
                basic.pause(100); // Wait for a bit before checking again
            }
        }

        basic.showIcon(IconNames.Yes);
        basic.pause(100);

        return true;

    }

    /*
    * Look for a free radio channel. First use a channel + group derived from the
    * machine id, and if that is occupied, randomly check a channel and group for
    * HereIAm messages from other senders.
    * If no messages are received within 5 seconds, return the channel and group.
    * */
    //% blockId=find_free_channel block="find free radio channel"
    export function findFreeChannel(): void {
        let i = 0;

        /* channel and group based on the scrambled machine id,
        * so the initial request will always be the same. */
        let [channel, group] = relib.getInitialRadioRequest();

        //serial.writeLine("Finding free radio channel...");
        while (true) {

            if (testChannel(i, channel, group)) {
                // Return both channel and group as an array
                //serial.writeLine(`Found free radio channel ${channel} in group ${group}`);
           
                radiop.setGroup(group);
                radiop.setChannel(channel);
                basic.clearScreen();
                return;
            }

            channel = randint(0, 83);
            group = randint(0, 255);


            i++;

        }
        return;
    }


}