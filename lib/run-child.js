/**
 * Created by amills001c on 2/15/16.
 */


var filePath = process.argv[process.argv.indexOf('--fp') + 1];

var domain = require('domain');

const d = domain.create();

d.on('error', function(err){
    process.send({type: 'FATAL', msg: ' => Suman error => fatal error - in suite with path=' + filePath +
        '\n (note: You will need to transpile your test files manually if you wish to use ES7 features)', error: err.stack});
});

d.run(function(){
    require(filePath);
});