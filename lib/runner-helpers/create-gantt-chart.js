'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var fs = require("fs");
var path = require("path");
var _suman = global.__suman = (global.__suman || {});
var socket_cp_hash_1 = require("./socket-cp-hash");
exports.createGanttChartOld = function (cb) {
    var gantt, vds;
    try {
        vds = require('virtual-dom-stringify');
        gantt = require('gantt-chart');
    }
    catch (err) {
        _suman.logError(err.message || err);
        return process.nextTick(cb);
    }
    var g = gantt({
        "wow": {
            "dependencies": ["amaze"],
            "duration": "1 week"
        },
        "amaze": {
            "duration": "3 days"
        },
        "cool": {
            "duration": "6 days"
        },
        "whatever": {
            "duration": "1 day",
            "dependencies": ["wow"]
        },
        "very": {
            "duration": "2 days",
            "dependencies": ["amaze"]
        },
        "great": {
            "duration": "8 days",
            "dependencies": ["very"]
        }
    });
    var p = path.resolve(_suman.sumanHelperDirRoot + '/gantt.html');
    fs.writeFile(p, vds(g.tree()), cb);
};
exports.createGanttChart = function (cb) {
    var Handlebars;
    try {
        Handlebars = require('handlebars');
    }
    catch (err) {
        _suman.logError(err.message || err);
        return process.nextTick(cb);
    }
    var p = path.resolve(_suman.sumanHelperDirRoot + '/gantt-2.hbs');
    fs.readFile(p, function (err, data) {
        if (err) {
            _suman.logError(err.stack || err);
            return cb();
        }
        var template = Handlebars.compile(String(data));
        var getAdjustedDate2 = function (millis) {
            console.log('millis => ', millis);
            var a = String(millis).slice(0, -3);
            console.log('a => ', a);
            var b = String(millis).slice(-3);
            console.log('b => ', b);
            var before = Number(a + '000');
            var addThis = Number(b) * 1000;
            console.log('addThis => ', addThis);
            console.log('before => ', before);
            console.log('after => ', before + addThis);
            return before + addThis;
        };
        var millisPerDay = 86400000;
        var getAdjustedDate = function (millis) {
            return _suman.startDateMillis + (millis - _suman.startDateMillis) * millisPerDay;
        };
        var map = Object.keys(socket_cp_hash_1.cpHash).map(function (k) {
            var n = socket_cp_hash_1.cpHash[k];
            var diff = (n.dateEndedMillis - n.dateStartedMillis) * millisPerDay;
            var startDate = getAdjustedDate(n.dateStartedMillis);
            var endDate = getAdjustedDate(n.dateEndedMillis);
            return [
                String(k),
                n.shortTestPath,
                n.sumanExitCode > 0 ? 'fail-group' : 'success-group',
                startDate,
                endDate,
                null,
                100,
                null
            ];
        });
        var result = template({
            arrayOfArrays: JSON.stringify(map)
        });
        var p = path.resolve(_suman.sumanHelperDirRoot + '/gantt-3.html');
        fs.writeFile(p, result, cb);
    });
};
