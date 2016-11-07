


const suman = require('suman');
const Test = suman.init(module, {
    pre: ['smartconnect'],
    post: ['judas']
});


Test.describe('1', {}, function (assert) {

    this.before(t => {
        console.log('before a');
    });

    this.it.cb('set timeout', t => {
       setTimeout(function(){
           console.log('done 1');
           t.done();
       },3000);
    });

});


Test.describe('2', {}, function (assert) {

    this.before.cb(t => {
        console.log('before a');
        setTimeout(function(){
            throw new Error('oh shit');
        },1000);
    });

    this.it.cb('set timeout', t => {
        setTimeout(function(){
            console.log('done 2');
            t.done();
        },1000);
    });

});

