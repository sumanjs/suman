/**
 * Created by denman on 2/14/2016.
 */

var suman = require('../lib');

suman.Runner({
    $node_env: process.env.NODE_ENV,
    fileOrDir: ['./test/integration-tests'],
    configPath: 'suman.conf.js'
}).on('message', function (msg) {
    console.log('msg from suman runner', msg);
    process.exit(msg);
});