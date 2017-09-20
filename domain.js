

// const Domain = require('domain');
//
// const d = Domain.create();
//
// process.once('unhandledRejection', function(r, p){
//   console.log('unhandledRejection', r, p);
// });
//
// d.once('error', function(){
//   console.log('domain caught');
// });
//
//
// d.run(function(){
//   Promise.resolve(null).then(function(){
//     throw 'foo';
//   });
// });


const x = new String('');
x.y = true;

console.log(x.y);

