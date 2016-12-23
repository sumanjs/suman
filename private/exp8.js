
// const fs = require('fs');
// const util = require('util');
//
// // console.log(util.inspect(fs));
//
// const O_RDWR = fs.constants.O_RDWR;
// const O_NOCTTY = fs.constants.O_NOCTTY;
//
// console.log('O_RDWR',O_RDWR);
// console.log('O_NOCTTY',O_NOCTTY);
//
// var fd = fs.openSync('/dev/tty', O_RDWR + O_NOCTTY);
//
// const fdTerm = fs.openSync('/dev/ttys003','a');
//
// console.log('fd:',fd);
// console.log('fdTerm:',fdTerm);

// console.log(Date.now());


const cp = require('child_process');

const n = cp.spawn('node').on('error', function(e){
    console.error(e.stack || e);
});

n.stdin.setEncoding('utf-8');
n.stdin.write("\n console.log(require('util').inspect({zim:'zam'}));\n\n");   // <<< key part

// n.stdin.write("\n throw new Error('bob')\n\n");

n.stdin.end();

n.stdout.setEncoding('utf8');

n.stdout.on('data', function(d){
    console.log('data => ', d);
});

