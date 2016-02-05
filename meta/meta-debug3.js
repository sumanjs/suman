/**
 * Created by denman on 1/10/2016.
 */



console.log('NODE_ENV:', process.env.NODE_ENV);

var suman = require('../../lib');

suman.Runner({
    $node_env: process.env.NODE_ENV,
    sumanGroup: 'test/all.js',
    config: 'suman.conf.js'
});

