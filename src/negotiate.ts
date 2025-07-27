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


        static PACKET_SIZE = 0;

        constructor() {
            super(radiop.PacketType.HERE_I_AM, HereIaM.PACKET_SIZE);
            this.fromValues();
            }
        
        fromValues() {

    }
        
}