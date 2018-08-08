'use strict';
module.exports = function ($data, $core, $deps, $ioc) {
    return {
        dependencies: {
            'boo': function () {
                return 'b2boo';
            },
            'bat': function () {
                return 'BAT';
            },
            'semver': function () {
                return 'zoom';
            },
            'suit': function () {
                return { 'SUIT': 'vommmm' };
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
            'william': function (cb) {
                setTimeout(function () {
                    cb(null, 10);
                }, 100);
            },
            'socketio': function () {
                return {
                    'dummy': 'dummy socketio'
                };
            },
            'should': function () {
                return Promise.resolve(require('should'));
            },
            'request': function () {
                return require('request');
            },
            'socket_io_client': function () {
                return require('socket.io-client');
            },
            'choodles': function (cb) {
                setTimeout(function () {
                    cb(null, {
                        choodles: true
                    });
                }, 100);
            },
            'roodles': function (cb) {
                setTimeout(function () {
                    cb(null, {
                        roodles: false
                    });
                }, 100);
            },
            'whoa': function (cb) {
                setTimeout(function () {
                    cb(null, {
                        whoa: {
                            chocolate: 'yes'
                        }
                    });
                }, 100);
            },
            'cherry': function (cb) {
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
