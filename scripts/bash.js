
const cp = require('child_process');

const k = cp.spawn('bash');


setTimeout(function(){

  k.once('close', function(){
    console.log('closing...');
  });


  k.once('exit', function(){
    console.log('exiting...');
  });


  k.kill('SIGINT');
}, 500);
