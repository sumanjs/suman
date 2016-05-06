/**
 * Created by denman on 4/22/2016.
 */

function title(test) {
    return String(test.title).replace(/#/g, '');
}

module.exports = (suman) => {

    var n = 1;
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

    suman.on('test-end', function onTestEnd() {
        ++n;
    });

    suman.on('test-case-fail', function onTestCaseFail(value, data) {
        console.log('not ok %d %s', n, title(test));
    });

    suman.on('test-case-pass', function onTestCasePass(value, data) {
        console.log('ok %d %s', n, title(test));
    });

    suman.on('test-case-skipped', function onTestCaseStubbed(value, data) {
        console.log('ok %d %s # SKIP -', n, title(test));
    });

    suman.on('test-case-stubbed', function onTestCaseStubbed(value, data) {
        console.log('ok %d %s # STUBBED -', n, title(test));
    });


};