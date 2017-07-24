#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var fs = require("fs");
var cwd = process.cwd();
var down = [];
var found = false;
var exec;
var execNameIndex = process.argv.indexOf('--exec-name');
if (execNameIndex < 0) {
    exec = 'suman/cli.js';
}
else {
    exec = '.bin/' + process.argv[execNameIndex + 1];
}
try {
    fs.mkdirSync(path.resolve(process.env.HOME + '/.suman'));
}
catch (err) {
}
var debugLogPath = path.resolve(process.env.HOME + '/.suman/suman-debug.log');
fs.writeFileSync(debugLogPath, '\n\n', { flag: 'a' });
fs.writeFileSync(debugLogPath, ' => Date run => ' + new Date().toISOString(), { flag: 'a' });
fs.writeFileSync(debugLogPath, ' => Running find-local-suman-executable.\n', { flag: 'a' });
fs.writeFileSync(debugLogPath, ' => cwd => ' + cwd, { flag: 'a' });
var p, cd;
function stat(p) {
    try {
        return fs.statSync(p).isFile();
    }
    catch (err) {
        fs.writeFileSync(debugLogPath, '\n => stat error => ' + (err.stack || err), { flag: 'a' });
        if (!String(err.stack || err).match(/ENOENT: no such file or directory/i)) {
            throw err;
        }
        return false;
    }
}
while (true) {
    cd = path.resolve(cwd + down.join(''));
    if (String(cd) === String(path.sep)) {
        fs.writeFileSync(debugLogPath, '\n\n => Fail, (we went down to root "/") => cd => ' + cd, { flag: 'a' });
        break;
    }
    p = path.resolve(cd + '/node_modules/' + exec);
    fs.writeFileSync(debugLogPath, '\n Searching for suman executable at this path => ' + p, { flag: 'a' });
    if (stat(p)) {
        found = true;
        break;
    }
    down.push('/../');
}
if (found) {
    fs.writeFileSync(debugLogPath, '\n Found => ' + p, { flag: 'a' });
    console.log(p);
    process.exit(0);
}
else {
    fs.writeFileSync(debugLogPath, '\n * ! Not found * => ' + p, { flag: 'a' });
    process.exit(1);
}
