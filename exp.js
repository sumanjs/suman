/**
 * Created by Olegzandr on 5/14/16.
 */


setTimeout(function () {
    console.log('timed out');
}, 4000);


process.send('dooodoo', function (err) {

    if (err) {
        console.log('callback err');
    }
    else {
        console.log('callback')
    }

});