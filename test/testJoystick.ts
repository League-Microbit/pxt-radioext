
namespace radioptest {
	function logJoyPayload(prefix: string, jp: radiop.JoyPayload) {
		if (!jp) return;
		let btns = "";
		for (let b = radiop.JoystickButton.A; b <= radiop.JoystickButton.F; b++) {
			if (jp.buttonPressed(b as radiop.JoystickButton)) {
				btns = btns + b + ",";
			}
		}
	
		serial.writeLine(" " + prefix + " Joy x=" + jp.x + " y=" + jp.y + " btns=" + btns);
	}
	// Test function for JoyPayload round-trip via shared buffer
	export function testJoystickPayload() {
		radiop.initDefaults();

		let jp1 = new radiop.JoyPayload();

		// Random assignments within valid ranges
		let x = randint(0, 1023);
		let y = randint(0, 1023);
		let ax = randint(-1023, 1023);
		let ay = randint(-1023, 1023);
		let az = randint(-1023, 1023);
		let datau16 = (randint(0, 0xffff) & 0xffff);
		let image = ((randint(0, 0xffff) << 16) | randint(0, 0xffff)) >>> 0;
		let btnMask = randint(0, 0x7f); // A..F = bits 0..6

		jp1.x = x;
		jp1.y = y;
		jp1.accelX = ax;
		jp1.accelY = ay;
		jp1.accelZ = az;
		jp1.datau16 = datau16;
		jp1.image = image;
		for (let b = radiop.JoystickButton.A; b <= radiop.JoystickButton.F; b++) {
			jp1.setButton(b as radiop.JoystickButton, (btnMask & (1 << b)) != 0);
		}

		let h1 = jp1.hash;
		let jp2 = radiop.JoyPayload.fromBuffer(jp1.getBuffer());
		let h2 = jp2.hash;

		let ok = true;
		if (h1 != h2) ok = false;
		if (jp2.x != x) ok = false;
		if (jp2.y != y) ok = false;
		if (jp2.accelX != ax) ok = false;
		if (jp2.accelY != ay) ok = false;
		if (jp2.accelZ != az) ok = false;
		if (jp2.datau16 != datau16) ok = false;
		if (jp2.image != image) ok = false;
		for (let b = radiop.JoystickButton.A; b <= radiop.JoystickButton.F; b++) {
			let expected = (btnMask & (1 << b)) != 0;
			if (jp2.buttonPressed(b as radiop.JoystickButton) != expected) ok = false;
		}

		serial.writeLine("Joystick test hash1=" + h1 + " hash2=" + h2);
		serial.writeLine("x=" + jp2.x + " y=" + jp2.y + " ax=" + jp2.accelX + " ay=" + jp2.accelY + " az=" + jp2.accelZ);
		serial.writeLine("datau16=" + jp2.datau16 + " image=" + jp2.image + " buttonsMask=" + btnMask);
		if (ok) basic.showIcon(IconNames.Yes); else basic.showIcon(IconNames.No);
	}

	export function testJoystickPayloadLoop() {
		for (let i = 0; i < 50; i++) {
			testJoystickPayload();
		}
	}


	export function testJoystickSendRecieve() {

		// Pick a random non-UNKNOWN class
		let cls = radioptest.randDeviceClass();

		serial.writeLine("Init HereIAm beacon class=" + cls);
		radiop.initDefaults();
		radiop.initBeacon(cls as radiop.DeviceClass);

		// Install handler for incoming Joy payloads (print x,y,buttons) using specialized API
		radiop.onReceiveJoystickMessage(function (jp) {
			logJoyPayload("RX", jp);
			// Decode 25-bit image value back to 5x5 and display
			radiop.intoToImage(jp.image).showImage(0);
		});

		// Prepare a list of icons to pick from for transmission
		const icons: IconNames[] = [
			IconNames.Heart,
			IconNames.SmallHeart,
			IconNames.Happy,
			IconNames.Sad,
			IconNames.Giraffe,
			IconNames.Ghost,
			IconNames.Skull,
			IconNames.Fabulous,
			IconNames.Duck,
			IconNames.Sword
		];

		// Infinite send loop creating random JoyPayloads
		while (true) {
			let jp = new radiop.JoyPayload();
			jp.x = randint(0, 1023);
			jp.y = randint(0, 1023);
			jp.accelX = randint(-1023, 1023);
			jp.accelY = randint(-1023, 1023);
			jp.accelZ = randint(-1023, 1023);
			jp.datau16 = randint(0, 0xffff) & 0xffff;
			// Pick random icon, convert to 25-bit bitmap and store
			let icon = icons[randint(0, icons.length - 1)];
			let img = images.iconImage(icon);
			jp.image = radiop.imageToInt(img);
			let btnMask = randint(0, 0x7f);
			for (let b = radiop.JoystickButton.A; b <= radiop.JoystickButton.F; b++) {
				jp.setButton(b as radiop.JoystickButton, (btnMask & (1 << b)) != 0);
			}
			jp.send();
			logJoyPayload("TX", jp);
			// Briefly show the transmitted image locally too
		
			basic.pause(1000);
		}

	}
}
