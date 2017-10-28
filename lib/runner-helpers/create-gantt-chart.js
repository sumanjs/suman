'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var fs = require("fs");
var path = require("path");
var _suman = global.__suman = (global.__suman || {});
var socket_cp_hash_1 = require("./socket-cp-hash");
exports.createGanttChart = function (cb) {
    if (_suman.sumanConfig && !_suman.sumanConfig.viewGantt) {
        return process.nextTick(cb);
    }
    var Handlebars;
    try {
        Handlebars = require('handlebars');
    }
    catch (err) {
        _suman.log.error(err.message || err);
        return process.nextTick(cb);
    }
    var p = path.resolve(__dirname + '/../gantt/index.html');
    fs.readFile(p, function (err, data) {
        if (err) {
            _suman.log.error(err.stack || err);
            return cb();
        }
        var template = Handlebars.compile(String(data));
        var tasks = Object.keys(socket_cp_hash_1.ganttHash).map(function (k) {
            var gd = socket_cp_hash_1.ganttHash[k];
            return {
                startDate: gd.startDate,
                endDate: gd.endDate,
                transformStartDate: gd.transformStartDate,
                transformEndDate: gd.transformEndDate,
                taskName: gd.fullFilePath || gd.shortFilePath,
                status: gd.sumanExitCode > 0 ? 'FAILED' : 'SUCCEEDED'
            };
        });
        var result = template({
            tasks: JSON.stringify(tasks)
        });
        var p = path.resolve(_suman.sumanHelperDirRoot + '/gantt-4.html');
        fs.writeFile(p, result, cb);
    });
};
