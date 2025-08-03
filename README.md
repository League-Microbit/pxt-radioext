# Radio Extensions

These extensions to the Radio module provide these main features: 

* A RadioProtocol class that can be subclassed for specific types of radio messages, with 
  specializations for the HereIAm beacon and Joystick messages
* A 'HereIAm' beacon that broadcasts the identity of this Micro:bit
* A Joystick message that sends the state of all buttons on an Elecfreaks Joystick:bit. 
* Finding a free radio channel/group based on the device serial number, followed by collision detection. 