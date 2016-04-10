/**
 * Created by amills001c on 4/9/16.
 */


var sumanEvents = require('./test7.js');

sumanEvents.on('test', function (test) {

    test({a:'b',c:'d'});

});

