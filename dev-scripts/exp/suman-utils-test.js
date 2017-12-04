

const su = require('suman-utils');
const util = require('util');

const x = su.getEnvObjFromStr(`foo=bar zim="zam bia" rim=raf`);

console.log(util.inspect(x));
