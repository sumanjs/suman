//
// const fs = require('fs');
//
// console.log(fs.readlinkSync('/proc/self/fd/18'));

const fs = require('fs');

// const { O_RDWR, O_NOCTTY } = fs.constants;

const O_RDWR = fs.constants.O_RDWR;
const O_NOCTTY = fs.constants.O_NOCTTY;

console.log('O_RDWR',O_RDWR);
console.log('O_NOCTTY',O_NOCTTY);

var fd = fs.openSync('/dev/tty', O_RDWR + O_NOCTTY);


console.log('fd:',fd);