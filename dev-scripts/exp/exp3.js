var Bar = (function () {
    function Bar() {
    }
    return Bar;
}());
var makeBar = function () {
    return new (Bar.bind.apply(Bar, [void 0].concat(arguments)))();
};
