/**
 * Created by denman on 1/1/2016.
 */

    //TODO: http://askubuntu.com/questions/484993/run-command-on-anothernew-terminal-window

var suman = require('./lib');

suman.Server({
    configPath: './suman.conf.js'
}).on('message', function (msg) {
    console.log('msg from suman server', msg);
});