/**
 * Created by denman on 1/1/2016.
 */

//TODO: http://askubuntu.com/questions/484993/run-command-on-anothernew-terminal-window

var suman = require('./lib');

suman.Server({
    configPath: './suman.conf.js'
}).on('msg', function (msg) {
    console.log('msg from suman server', msg);
    switch (msg) {
        case 'listening':
            process.exit();
            break;
        default:
            console.log(msg);
    }
});

