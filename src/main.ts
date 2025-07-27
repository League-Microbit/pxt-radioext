radiop.init();

basic.forever(function () {
    joystick.sendIfChanged();
});
