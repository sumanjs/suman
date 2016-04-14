/**
 * Created by amills001c on 4/9/16.
 */


var sumanEvents = require('./tes-t7.jsx');

sumanEvents.on('test', function (test) {

    test({a:'b',c:'d'});

});

