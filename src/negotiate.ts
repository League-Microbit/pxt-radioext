/* Negotiation Messages
*
 */

namespace radiop {

    export let lastPayload: HereIAm = null;
    let myClassId: string = "unknown"; // Default class ID
    
    let _runBeacon = true;
    let _beaconInit = false;

    let _onReceiveHandler: (payload: HereIAm) => void = defaultOnReceiveHandler;


    /* Record of a peer in the network */
    export class PeerRecord {
        public serial: number;
        public radioGroup: number;
        public radioChannel: number;
        public classId: string; // Class ID of the peer, like 'joystick' or 'robot'
        public lastSeen: number; // Timestamp of last seen

        constructor() {
            this.serial = 0;
            this.radioGroup = 0;
            this.radioChannel = 0;
            this.classId = "";
            this.lastSeen = 0;
        }

        hash(): number {
            let hash = 0;
            hash ^= this.serial;
            hash ^= this.radioGroup << 8;
            hash ^= this.radioChannel << 16;
            for (let i = 0; i < this.classId.length; i++) {
                hash ^= this.classId.charCodeAt(i) << (i % 32);
            }
            //hash ^= this.lastSeen << 24;
            return hash >>> 0; // Ensure unsigned
        }



        str(): string {
            return `PeerRecord(${this.hash()} serial=${radiop.toHex(this.serial)}, classId=${this.classId}, group=${this.radioGroup}, channel=${this.radioChannel}, lastSeen=${this.lastSeen})`;
        }
    }

    export class PeerDb {

        private _peers: PeerRecord[] = [];


        constructor() {
            this._peers = [];
        }

        findPeerBySerial(serial: number): PeerRecord {
            for (let peer of this._peers) {
                if (peer.serial == serial) {
                    return peer;
                }
            }
            return undefined;
        }


        findPeerByClassId(classId: string): PeerRecord {
            for (let peer of this._peers) {
                if (peer.classId == classId) {
                    return peer;
                }
            }
            return null;
        }

        addPeerRecord(serialId: number, classId: string, radioGroup?: number, radioChannel?: number): PeerRecord {
            let peer = this.findPeerBySerial(serialId);

            if (!peer) {
                peer = new PeerRecord();
                peer.serial = serialId;
                this._peers.push(peer);
            }
            let hash = peer.hash();
            peer.classId = classId;
            peer.radioGroup = radioGroup !== undefined ? radioGroup : radiop.getGroup();
            peer.radioChannel = radioChannel !== undefined ? radioChannel : radiop.getChannel();
            peer.lastSeen = input.runningTime();
            if (peer.hash() !== hash) {
                serial.writeLine(`Peer update:  ${peer.str()}`);
            }
            return peer;
        }


        clearPeers() {
            this._peers = [];
        }

        getAllPeers(): PeerRecord[] {
            return this._peers;
        }

        size(): number {
            return this._peers.length;
        }

        dumpToSerial() {
            serial.writeLine("Peers in database:");
            for (let peer of this._peers) {
                serial.writeLine("   "+peer.str());
            }
        }
    }

    export const peerDb = new PeerDb();
    
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
            return `HereIaM(classId=${this.classId}, group=${this.group}, channel=${this.channel}, serial=0x${radiop.toHex(this.serial)})`;
        }

        get handler(): (payload: HereIAm) => void {
            return _onReceiveHandler;
        }
    }

    export function defaultOnReceiveHandler(payload: HereIAm, handler?: (payload: HereIAm) => void) {
        lastPayload = payload;
        peerDb.addPeerRecord(payload.serial, payload.classId,
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



    function newHereIAm(classId?: string, group?: number, channel?: number): HereIAm {
        let _classId = classId || myClassId;
        let _group = group !== undefined ? group : radiop.getGroup();
        let _channel = channel !== undefined ? channel : radiop.getChannel();
        return new HereIAm(_classId, _group, _channel);
    }
    /**
     * Send a HereIAm message to the broadcast channel and group 
     */

    export function broadcastHereIAm() {
        _broadcastHereIAm(newHereIAm());
    }
            
    export function _broadcastHereIAm(hia: HereIAm) {
        let origChannel = radiop.getChannel();
        let origGroup = radiop.getGroup();
        radiop.setChannel(BROADCAST_CHANNEL);
        radiop.setGroup(BROADCAST_GROUP);
        hia.send(); 
        //serial.writeLine(`Broadcasting HereIAm: ${hia.str} on channel ${radiop.getChannel()}, group ${radiop.getGroup()}`);

        radiop.setChannel(origChannel);
        radiop.setGroup(origGroup);
        basic.pause(100); // Allow some time for the message to be sent
    }

    /** Initialize the hereIAm Beacon
     * @param classId The class ID to use for the HereIAm message
     */
    //% blockId=init_beacon block="initialize beacon with classId %classId"
    //% group='Beacon'
    export function initBeacon(classId: string) {
        
        if (_beaconInit) {
            return;
        }
        _beaconInit = true;

        radiop.initDefaults();
        myClassId = classId;
      
        serial.writeLine(`Negotiation initialized for classId: ${myClassId}`);

        let lastChannel: number = undefined
        let lastGroup: number = undefined
        let bCountDown = 10;

        control.inBackground(function () {
            while (true) {
                if (_runBeacon) {
                    let hereIAm = newHereIAm();

                    hereIAm.send(); // Send to my private radio

                    serial.writeLine(`Sending HereIAm: ${hereIAm.str} on channel ${radiop.getChannel()}, group ${radiop.getGroup()}`);

                    // If the channel or group has changed, broadcast the HereIAm message
                    // to the broadcast channel and group
                    if (lastChannel !== radiop.getChannel() || lastGroup !== radiop.getGroup() || bCountDown <= 0) {
                        lastChannel = radiop.getChannel();
                        lastGroup = radiop.getGroup();
                        _broadcastHereIAm(hereIAm);
                        bCountDown = 10; // Reset countdown
                    }
                    bCountDown--;
                }
                basic.pause(3000);
            }
        });
        
    }

    /** 
     * Start the beacon loop 
     */
    //% blockId=start_beacon block="start beacon"
    //% group='Beacon'
    export function startBeacon() {
        if (!_beaconInit) {
            serial.writeLine("Beacon not initialized. Call initBeacon first.");
            return;
        }
        _runBeacon = true;
    }

    /** 
     * Stop the beacon loop 
     */
    //% blockId=stop_beacon block="stop beacon"
    //% group='Beacon'
    export function stopBeacon() {
        _runBeacon = false;
    }

    /* Look for traffic on a channel/group. Assumes the beacon is running
    * and is collecting HearIAm into the PeerDb.     */

    function testChannel(i: number, channel: number, group: number): Boolean {

        serial.writeLine(`${i} Testing c${channel} in g ${group}`);
        radiop.setGroup(group);  // clears the PeerDb. 
        radiop.setChannel(channel);

        let startTime = input.runningTime();


        // Poll the PeerDb for up to 5 seconds
        while (input.runningTime() - startTime < 5000) {
            let peer: PeerRecord = peerDb.findPeerByClassId(myClassId);

            if (peer) {
                serial.writeLine(`Found same-class peer ${peer.str()} in C: ${peer.radioChannel} G: ${peer.radioGroup}, `);
                
                return false;
            }
            basic.pause(200);
        }


        return true;

    }

    /*
    * Look for a free radio channel. First use a channel + group derived from the
    * machine id, and if that is occupied, randomly check a channel and group for
    * HereIAm messages from other senders.
    * If no messages are received within 5 seconds, return the channel and group.
    * */
    //% blockId=find_free_channel block="find free radio channel"
    //% group='Beacon'
    export function findFreeChannel(): void {
        let i = 0;

        /* channel and group based on the scrambled machine id,
        * so the initial request will always be the same. */
        let [channel, group] = radiop.getInitialRadioRequest();

        serial.writeLine("Finding free radio channel...");
            
        
        while (true) {
            radioIcon.showImage(0); // Show radio icon to indicate negotiation started

            if (testChannel(i, channel, group)) {
                // Return both channel and group as an array
                serial.writeLine(`Found free radio channel ${channel} in group ${group}`);
 
                radiop.setGroup(group);
                radiop.setChannel(channel);
                basic.clearScreen();

                basic.showIcon(IconNames.Yes);
            
                return;
            }

            channel = randint(0, 83);
            group = randint(0, 255);

            i++;

            basic.showIcon(IconNames.No);
            basic.pause(200); // Pause to avoid flooding the radio with requests

        }
        return;
    }


}