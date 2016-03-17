/**
 * Created by denman on 2/15/16.
 */

process.on('uncaughtException', function (err) {

    process.send({
        type: 'FATAL',
        msg: ' => Suman => fatal error in suite with path=' + filePath +
        '\n (note: You will need to transpile your test files if you wish to use ES7 features)',
        error: err.stack
    });

    console.log(' => Suman => Uncaught exception in your test =>', '\n', err.stack);
});

var filePath = process.argv[process.argv.indexOf('--fp') + 1];

var domain = require('domain');

const d = domain.create();

d.on('error', function (err) {
    process.send({
        type: 'FATAL',
        msg: ' => Suman => fatal error - in suite with path=' + filePath +
        '\n (note: You will need to transpile your test files if you wish to use ES7 features)',
        error: err.stack
    });
});

d.run(function () {
    require(filePath);
});