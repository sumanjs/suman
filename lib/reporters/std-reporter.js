/**
 * Created by denman on 4/22/2016.
 */


const util = require('util');


module.exports = suman => {


    suman.on('runner-start', function onRunnerStart() {

    });


    suman.on('runner-end', function onRunnerEnd() {

    });

    suman.on('suite-skipped', function onRunnerEnd() {

    });

    suman.on('suite-end', function onRunnerEnd() {

    });

    suman.on('test-end', function onTestEnd() {

    });

    suman.on('test-case-fail', function onTestCaseFail(value, data) {
        process.stdout.write(util.inspect(value));
        process.stdout.write(data);
    });

    suman.on('test-case-pass', function onTestCasePass(value, data) {
        process.stdout.write(data);
    });

    suman.on('test-case-skipped', function onTestCaseStubbed(value, data) {
        process.stdout.write(data);
    });

    suman.on('test-case-stubbed', function onTestCaseStubbed(value, data) {
        process.stdout.write(data);
    });


};