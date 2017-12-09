const util = require('util');

console.log('dalglish');

Object.keys(process.env).sort().forEach(function(k){
  console.log(k, process.env[k]);
});
