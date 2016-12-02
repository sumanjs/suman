/**
 * Created by Olegzandr on 12/1/16.
 */


const one = require('./one.test');

const colors = require('colors/safe');

var count = 0;
one.on('test',function(t){
  count++;
  console.log(colors.red.bold('FUCK YOU STUPUD SHIT => ',count));
  t.apply(null, ['a','b','c']);
});
