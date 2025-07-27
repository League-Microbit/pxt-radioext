/* Use the broadcast radio channel to negotiate a unique number for each device.
 * When the device starts the negotiation, it will send a message to ask for the 
*  maximum assigned number by broadcasting a request. Other devices will respond with the
*  highest number that they have been told about. Then the device will increment that number 
*  and send out a new message with its own unique number, which other devices will ack or nack. 
*  If the device recieves a nack, it will try again with the next number.
*  This will continue until all devices have a unique number.
*
*  The broadcast messages are 16 bits:
*   
*   4 bits: negotiation code
*   4 bits: ack/nack
*   8 bits: assigned number
* 
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

    radio.onReceivedMessage(RadioMessage.message1, function () {
    });

    
        
}