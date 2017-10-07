

//
// let sym = Symbol('foo');
// let sym2 = Symbol('foo');
// let obj = {};
// obj[sym] = 5;
// console.log(obj[sym]);
// console.log(obj[sym2]);
//

// hi

//////

console.log('this is the beginning.');
const path = require('path');

console.error(`${path.basename(__dirname)} reporter may be unable to properly indent output.`);


var player = require('play-sound')(opts = {});

const failTrombonePath = path.resolve(process.env.HOME + '/fail-trombone-02.mp3');

player.play(failTrombonePath, { timeout: 6000 }, function(err){
  if (err) throw err
});
