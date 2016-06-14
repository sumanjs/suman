const Threads = require('webworker-threads');

var thread = Threads.create();

const roodles = 3;

thread.eval(function () {

    console.log('roodles:', roodles);
});