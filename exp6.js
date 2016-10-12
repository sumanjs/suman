/**
 * Created by amills on 6/14/16.
 */


// const str = 'foo  bar    baz';
//
// const split = str.split(/\s+/);
//
// console.log(split);




process.on('beforeexit', function () {
    console.log('in before exit now');
    // setTimeout(cb, 3000);
});

process.on('exit', function (err, code, signal) {
    // if 'beforeExit' handler is in place, then this will only be called when the callback fires
    // in the beforeExit handler

    console.log('exiting...with code = ' + code);
});

process.exit();