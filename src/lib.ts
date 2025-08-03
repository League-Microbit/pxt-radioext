
namespace radiop {

    /* Scramble the input using MurmurHash3. This can scramble the bits of the 
    * id of the Micro:bit, so we can use the last 12 for an id value. */
    export function murmur_32_scramble(k: number): number {
        k = Math.imul(k, 0xcc9e2d51);
        k = (k << 15) | (k >>> 17);  // rotate left 15 (use >>> for unsigned right shift)
        k = Math.imul(k, 0x1b873593);
        return k;
    }

    export function toHex(num: number): string {
        // Convert to 32-bit unsigned integer
        num = num >>> 0;

        let hex = "";
        const hexChars = "0123456789ABCDEF";

        // Extract each hex digit (4 bits at a time) from right to left
        for (let i = 0; i < 8; i++) {
            hex = hexChars[num & 0xF] + hex;
            num = num >>> 4;
        }


        return hex;
    }

    /* Scramble the machine id and return the last 12 bits,
    * to be used as a unique identifier, particularly useful for the IR paccket
    * ID value. */
    export function getUniqueId12(): number {
        let machineId = control.deviceSerialNumber();
        let scrambledId = murmur_32_scramble(machineId);
        // Return the last 12 bits
        return scrambledId & 0xFFF;
    } 

    
     /**
     * Get a unique color based on the device serial number
     * @param scrambles Number of times to scramble the id, defaults to 1
     * 
     */
    //% block="Get unique color with $scrambles scrambles of device Id"
    //% scrambles.min=1 scrambles.max=10  scrambles.defl=1
    export function getUniqueColor(scrambles: number = 1): number {
        let machineId = control.deviceSerialNumber();

        let scrambledId = machineId;
        for (; scrambles > 0; scrambles--) {
            scrambledId = radiop.murmur_32_scramble(scrambledId);
        }

        let r = (scrambledId & 0xFF0000) >> 16;
        let g = (scrambledId & 0x00FF00) >> 8;
        let b = (scrambledId & 0x0000FF);

        return (r << 16) | (g << 8) | b; // 0xRRGGBB format
    }


    
    /* Get an initial request for a radio channel and group, 
    * based on the scrambled machine id. */
    export function getInitialRadioRequest(): number[] {
        let machineId = control.deviceSerialNumber();
        let scrambledId = murmur_32_scramble(machineId);

        let c_range = radiop.CHANNEL_MAX - radiop.CHANNEL_MIN;
        let channel = ((scrambledId & 0x0FFFF000) >> 12) % c_range + radiop.CHANNEL_MIN; // 0-83
        
        let g_range = radiop.GROUP_MAX - radiop.GROUP_MIN;
        let group = (scrambledId & 0xFF) % g_range + radiop.GROUP_MIN; // 1-255

        return [channel, group];
    }
}