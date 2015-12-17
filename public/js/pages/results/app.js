/**
 * Created by amills001c on 12/16/15.
 */



define(['SumanTestFiles'],function(stf){


    stf.forEach(function (testPath) {
        $.get(testPath).done(function (msg) {

            var myWorker = new Worker('/js/workers/one.js');
            myWorker.postMessage(msg);
            myWorker.onmessage = function(msg){
                $('#react-app').append(msg.data);
            };

        }).fail(function (err) {
            console.error(err);
        });
    });


    return {
        start: function(){
            console.log('in worker..');
        }
    }


});