/**
 * Created by amills001c on 3/20/16.
 */


module.exports = [
    '<suman-message>',
    'This file has been converted from a Mocha test to a Suman test using the "$ suman --convert" command.',
    'To get rid of this comment block, you can run can re-run "$ suman --convert" with the "--omit-comments" option.',
    'For the default conversion, we have used the standard ES5 Common.js require syntax; if you wish to use ES6 import syntax, you can',
    'run the original command with with the --es6 flag, like so: $ suman --convert --es6',
    '',
    'You may see that the core module assert is an argument to the top-level describe callback.',
    'Suman allows you to reference any core module in the top-level describe callback, which saves you some ink',
    'by avoiding the need to have several require/import statements for each core module at the top of your file.',
    'On top of that, you can reference any dependency listed in your suman.ioc.js file, as you would a core module',
    'in the top-level describe callback. This is a quite useful feature compared to simply loading core modules,',
    'because you can load asynchronous dependencies via this method.',
    '</suman-message>'
];