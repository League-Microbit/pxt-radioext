/* Negotiation Messages
*
 */

namespace negotiate {

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


    export class HereIaM extends radiop.RadioPayload {
        public groupMemberNumber: number;
        public radioGroup: number;
        public radioChannel: number;

        static readonly PACKET_SIZE = 7; // 1 (type) + 2 (groupMemberNumber) + 2 (radioGroup) + 2 (radioChannel)

        constructor(groupMemberNumber: number, radioGroup?: number, radioChannel?: number) {
            // For V2, get radioGroup and radioChannel directly if not provided
          
            super(radiop.PayloadType.HERE_I_AM, HereIaM.PACKET_SIZE);
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

        static fromBuffer(buffer: Buffer): HereIaM {
            let groupMemberNumber = buffer.getNumber(NumberFormat.UInt16LE, 1);
            let radioGroup = buffer.getNumber(NumberFormat.UInt16LE, 3);
            let radioChannel = buffer.getNumber(NumberFormat.UInt16LE, 5);
            return new HereIaM(groupMemberNumber, radioGroup, radioChannel);
        }


        get hash(): number {
            return (this.groupMemberNumber ^ this.radioGroup ^ this.radioChannel ^ this.serial ) & 0xFFFFFFFF;
        }

        get str(): string {
            return `HereIaM(groupMemberNumber=${this.groupMemberNumber}, radioGroup=${this.radioGroup}, radioChannel=${this.radioChannel}, serial=0x${lib.toHex(this.serial)})`;
        }
    }

}