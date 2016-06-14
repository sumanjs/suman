/**
 * Created by amills on 6/14/16.
 */



const util = require('util');

Promise.resolve().then(function () {

    return 'foo';

}).then(function () {

    return console.log('we were here');

}).then(function () {

    return Promise.reject({type: 'canceled'})

}).then(function () {

    return console.log('never visited');

}).catch(function (e) {
    console.log(e);
});
