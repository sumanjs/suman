/**
 * Created by amills001c on 4/9/16.
 */


var sumanEvents = require('./test7');

sumanEvents.on('test-ready', function (test) {

    test({a:'b',c:'d'});

});

