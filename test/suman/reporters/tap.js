/**
 * Created by denman on 4/22/2016.
 */


function title(test) {
    return String(test.desc).replace(/#/g, '');
}

module.exports = (suman) => {

    var n = 0;
    var passes = 0;
    var failures = 0;


    suman.on('runner-start', function onRunnerStart() {

    });


    suman.on('runner-end', function onRunnerEnd() {
        console.log('# tests ' + (passes + failures));
        console.log('# pass ' + passes);
        console.log('# fail ' + failures);
    });

    suman.on('suite-skipped', function onRunnerEnd() {
        console.log('# tests ' + (passes + failures));
        console.log('# pass ' + passes);
        console.log('# fail ' + failures);
    });

    suman.on('suite-end', function onRunnerEnd() {
        console.log('# tests ' + (passes + failures));
        console.log('# pass ' + passes);
        console.log('# fail ' + failures);
    });

    suman.on('test-case-end', function onTestEnd() {
        ++n;
    });

    suman.on('test-case-fail', function onTestCaseFail(value, data) {
        console.log('\tnot ok %d %s', n, title(value));
    });

    suman.on('test-case-pass', function onTestCasePass(value, data) {
        console.log('\tok %d %s', n, title(value));
    });

    suman.on('test-case-skipped', function onTestCaseStubbed(value, data) {
        console.log('\tok %d %s # SKIP -', n, title(value));
    });

    suman.on('test-case-stubbed', function onTestCaseStubbed(value, data) {
        console.log('\tok %d %s # STUBBED -', n, title(value));
    });


};