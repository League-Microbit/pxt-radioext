/* Negotiation Messages
*
 */

namespace negotiate {

    export let lastPayload: HereIAm = null;

    let _onReceiveHandler: (payload: radiop.RadioPayload) => void = undefined;

    let radioIcon: Image = images.createImage(`
                                        # # # . .
                                        . . . # .
                                        # # . . #
                                        . . # . #
                                        # . # . #`);

    /**
     * Negotiation codes for broadcast messages. This identifies the domain 
     * of the negotiation and allows for future extensions.
     */
    export enum NegotiationCode {
        RadioChannel = 1
    }

    export enum PhaseCode {
        Query = 0, // Home Device is asking for the highest assigned number
        Request = 1, // Home Device is asking if it can have a number
        Ack = 2, // Remote device responds that the number is unallocated
        Nack = 3, // Remote device responds that the number is allocated
        Assigned = 4 // Home Device asserts ownership of the number
    }

    // List of numbers that have been assigned.
    let assignedNumbers: number[] = [];
    export let myId = 0; // Unique ID for this device


    export class HereIAm extends radiop.RadioPayload {
        public groupMemberNumber: number;
        public radioGroup: number;
        public radioChannel: number;

        static readonly PACKET_SIZE = 7; // 1 (type) + 2 (groupMemberNumber) + 2 (radioGroup) + 2 (radioChannel)

        constructor(groupMemberNumber: number, radioGroup?: number, radioChannel?: number) {
            // For V2, get radioGroup and radioChannel directly if not provided
          
            super(radiop.PayloadType.HERE_I_AM, HereIAm.PACKET_SIZE);
            this.fromValues(groupMemberNumber, radioGroup, radioChannel);
        }

        fromValues(groupMemberNumber: number, radioGroup: number, radioChannel: number) {

            this.groupMemberNumber = groupMemberNumber;

            this.radioGroup = radioGroup !== undefined ? radioGroup : radiop.getGroup();
            this.radioChannel =  radioChannel !== undefined ? radioChannel : radiop.getChannel();

            this.buffer.setNumber(NumberFormat.UInt8LE, 0, radiop.PayloadType.HERE_I_AM);
            this.buffer.setNumber(NumberFormat.UInt16LE, 1, groupMemberNumber);
            this.buffer.setNumber(NumberFormat.UInt16LE, 3, this.radioGroup);
            this.buffer.setNumber(NumberFormat.UInt16LE, 5, this.radioChannel);
        }

        static fromBuffer(buffer: Buffer): HereIAm {
            let groupMemberNumber = buffer.getNumber(NumberFormat.UInt16LE, 1);
            let radioGroup = buffer.getNumber(NumberFormat.UInt16LE, 3);
            let radioChannel = buffer.getNumber(NumberFormat.UInt16LE, 5);
            return new HereIAm(groupMemberNumber, radioGroup, radioChannel);
        }


        get hash(): number {
            return (this.groupMemberNumber ^ this.radioGroup ^ this.radioChannel ^ this.serial ) & 0xFFFFFFFF;
        }

        get str(): string {
            return `HereIaM(groupMemberNumber=${this.groupMemberNumber}, radioGroup=${this.radioGroup}, radioChannel=${this.radioChannel}, serial=0x${relib.toHex(this.serial)})`;
        }

        get handler(): (payload: HereIAm) => void {
            return _onReceiveHandler;
        }
    }

    /**
     * Run code when a joystick message is received
     */
    //% blockId=joystick_on_receive block="on receive joystick"
    //% group="Events"
    //% weight=100
    export function onReceive(handler: (payload: HereIAm) => void) {
        radiop.init(); // Ensure radio is initialized

        _onReceiveHandler = function (payload: HereIAm) {
            lastPayload = payload;
            handler(payload);
        };

    }

    function testChannel(i: number, channel: number, group: number): Boolean {

        serial.writeString(`${i} Testing channel ${channel} in group ${group}...\n`);
        radiop.setGroup(group);
        radiop.setChannel(channel);

        negotiate.lastPayload = null; // Reset lastPayload
        serial.writeLine("Starting channel test handler = "+ _onReceiveHandler);

        let oldHandler =  _onReceiveHandler; // Save old handler

        _onReceiveHandler = function (payload: radiop.RadioPayload) {
            // do nothing, just need to set lastPayload
            negotiate.lastPayload = payload as HereIAm; // Cast to HereIaM
            //serial.writeLine("Received payload: " + payload.str);
        }

        let startTime = input.runningTime();

        radioIcon.showImage(0); // Show radio icon to indicate negotiation started

        while (input.runningTime() - startTime < 5000) {
            if (negotiate.lastPayload) {
                _onReceiveHandler = oldHandler; // Restore original handler
               
                basic.showIcon(IconNames.No);
                basic.pause(100);

                return false; // Channel is occupied
            } else {
                basic.pause(100); // Wait for a bit before checking again
            }
        }
    
        _onReceiveHandler = oldHandler; // Restore original handler
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
    
    export function findFreeChannel(): number[] {
        let i = 0;

        /* channel and group based on the scrambled machine id,
        * so the initial request will always be the same. */
        let [channel, group] = relib.getInitialRadioRequest();

        serial.writeLine("Finding free radio channel...");
        while (true) {

            if (testChannel(i, channel, group)) {
                // Return both channel and group as an array
                serial.writeLine(`Found free radio channel ${channel} in group ${group}`);
           
                radiop.setGroup(group);
                radiop.setChannel(channel);
                basic.clearScreen();
                return [channel, group];
            }

            channel = randint(0, 83);
            group = randint(0, 255);


            i++;

        }
        return [-1, -1]; // No free channel found
    }

    /* Send a hello IR message on the given pin to signal to the recipient that we want
    to negotiate a radio channel. */

    export function sendIRRadioMessage(pin: DigitalPin, channel: number , group: number): void {
        let command = (channel << 8) | group;
        leagueir.sendCommand(pin, leagueir.Address.RadioChannel, command);
    }

    export function recieveIrMessages(pin: DigitalPin) {
        leagueir.onIrPacketReceived(pin, function (id: number, status: number, command: number, value: number) {

        });
    }

}