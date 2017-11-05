'use strict';

////////////


//load async deps for any of your suman tests
module.exports = ($data, $core, $deps, $ioc) => {

  return {

    dependencies: {

      'bat': function () {
        return 'BAT';
      },

      'suit': function () {
        return 'SUIT';
      },

      'aaa': function () {
        return '3a';
      },

      'radical': function () {
        return '3r';
      },

      'sheep': function () {
        return Promise.resolve('fluffy');
      },

      'william': function (cb: Function) {
        setTimeout(function () {
          cb(null, 10);
        }, 100);
      },

      'socketio': function () {
        return {
          'dummy': 'dummy socketio'
        }
      },

      'should': function () {
        return Promise.resolve(require('should'));
      },

      'request': function () {
        return require('request');  //this is not very useful, but below we can see useful asynchronous loading of deps
      },

      'socket_io_client': function () {
        return require('socket.io-client');
      },

      'choodles': function (cb: Function) {

        setTimeout(function () {
          cb(null, {
            choodles: true
          });
        }, 100);
      },
      'roodles': function (cb: Function) {

        setTimeout(function () {
          cb(null, {
            roodles: false
          });
        }, 100);
      },

      'whoa': function (cb: Function) {

        setTimeout(function () {
          cb(null, {
            whoa: {
              chocolate: 'yes'
            }
          });
        }, 100);
      },

      'cherry': function (cb: Function) {

        setTimeout(function () {
          cb(null, {
            cherry: {
              garbage: 'no'
            }
          });
        }, 100);
      }

    }

  };

};
