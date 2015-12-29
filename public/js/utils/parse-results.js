/**
 * Created by denman on 12/26/2015.
 */


define(['underscore'], function (_) {

    var array = null;
    var lines = null;

    function recurse(i, indent) {

        var statements = _.where(array, {testId: i});

        var output = statements[statements.length - 1]; //always get last element (because this will contain children etc?)

        if (!output) {
            throw new Error('no output for testId=' + i); //something is probably wrong now
        }

        var str = new Array(indent).join(' '); //make indentation

        var children = output.children || [];
        var parallelTests = output.testsParallel || [];
        var loopTests = output.loopTests || [];
        var tests = output.tests || [];


        var testStatements = statements.filter(function (statement) {
            return !statement.userOutput;
        });

        //debug('testStatements' + JSON.stringify(testStatements));

        var logStatements = statements.filter(function (item) {
            return item.userOutput && item.data; //filter out any user data that is not defined
        }).map(function (item) {
            return item.data;
        });

        //debug('logStatements:' + JSON.stringify(logStatements));


        var allTests = _.sortBy(_.union(tests, parallelTests, loopTests, children), 'testId');

        allTests.forEach(function (test) {

            if (_.contains(_.pluck(children, 'testId'), test.testId)) {
                console.log('going to child from test:', output.testId, 'to:', test.testId);
                recurse(test.testId, indent + 5);
            }
            else {

                if (test.type === 'ParallelTestSet') {
                    //debug(str + 'Parallel Test:' + test);
                    var tempStr = str + ' ';
                    test.tests.forEach(function (parTest) {
                        logIts(tempStr, parTest);
                    });
                }
                else if (test.type === 'LoopTestSet') {
                    //debug(str + 'Loop Test:' + test);
                    var tempStr = str + ' ';
                    test.tests.forEach(function (loopTest) {
                        logIts(tempStr, loopTest);
                    });
                }
                else if (test.type === 'it-standard') {
                    logIts(str, test);
                }
                else {
                    console.log('crap test', test);
                }

            }

        });

    }

    function logIts(str, test) {
        lines.push('>' + String(str).replace(' ', 'p') + '[test] ' + test.desc + (test.error ? 'fail' + ' ' + test.error : '\u2714'));
    }

    function doTheThing(array) {
        return recurse(0, 1);
    }

    return {


        parseResults: function (data) {

            var lastChar = String(data).slice(-1);
            if (lastChar === ',') {
                data = String(data).substring(0, String(data).length - 1); //strip off trailing comma
            }
            data = "[" + data + "]"; //make parseable by JSON

            var parsed = JSON.parse(data);

            lines = [];
            array = parsed;

            doTheThing();
            return lines;

        }

    }

});