// function* foo() {
//   yield 1;
//   yield 2;
//   yield 3;
// }
var iterator = [1, 2, 3];
Array.from(iterator).forEach(function (o) {
    console.log(o);
});
