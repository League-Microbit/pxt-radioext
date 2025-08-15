let memberNumber = 0;

namespace radioptest {

    export function randDeviceClass() {
        let classes: number[] = [
            radiop.DeviceClass.CUTEBOT,
            radiop.DeviceClass.CUTEBOTPRO,
            radiop.DeviceClass.JOYSTICK,
            radiop.DeviceClass.DEVICE100,
            radiop.DeviceClass.DEVICE101,
            radiop.DeviceClass.DEVICE102
        ];
        return classes[randint(0, classes.length - 1)];
    }

	// Initialize beacon with random DeviceClass and dump peers on each HereIAm
	export function testHereIAm() {
		radiop.initDefaults();

		// Pick a random non-UNKNOWN class
		let cls = radioptest.randDeviceClass();

		serial.writeLine("Init HereIAm beacon class=" + cls);
		radiop.initBeacon(cls as radiop.DeviceClass);

		// Maintain a list of peer serial numbers to avoid for..in enumeration
		let peerSerials: number[] = [];
		// Handler: dump all peers each time a HereIAm arrives
		radiop.onReceiveHereIAm(function (h: radiop.HereIAm) {
			// Track new serials
			if (peerSerials.indexOf(h.serial) < 0) {
				peerSerials.push(h.serial);
			}
			let count = peerSerials.length;
			serial.writeLine("-- Peers (" + count + ") --");
			for (let i = 0; i < peerSerials.length; i++) {
				let p = radiop.peers[peerSerials[i]];
				if (p) {
					serial.writeLine("t=" + p.time + " serial=" + p.serial + " rssi=" + p.signal + " ch=" + p.channel + " grp=" + p.group);
				}
			}
		});
	}



}
