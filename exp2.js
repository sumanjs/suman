/**
 * Created by Olegzandr on 5/14/16.
 */


const cp = require('child_process');
const n = cp.fork('./exp');


n.on('message',function(msg){

    console.log('received msg from child =' + msg);
});


n.on('exit',function(){

 console.log('child exited.');
});