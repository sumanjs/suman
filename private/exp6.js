

const util = require('util');

const str = 'a' + '\n' + 'b';

console.log(str);

console.log(util.inspect(str));