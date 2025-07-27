radiop.init();

basic.forever(function () {
    joystickp.sendIfChanged();
});
