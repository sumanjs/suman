var fn = function (a, b, c) { c(); };
fn('yes', true, (function () {
}));
fn('yes', true, (function () {
}));
debugger;
