/**
 * Created by amills001c on 12/16/15.
 */


if (typeof importScripts === 'function') {
    importScripts('//cdnjs.cloudflare.com/ajax/libs/react/0.14.3/react.js');
    importScripts('//cdnjs.cloudflare.com/ajax/libs/react/0.14.3/react-dom.js');
    importScripts('/js/vendor/react-dom-server.js');
    importScripts('//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore.js');
}


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

    if (output.isTopLevel) {
        logIts3('suite description:' + output.desc + 'testId:' + i);
    }

    if (output.isDescribe) {
        logIts3('describe:' + output.desc + 'testId:' + i);
    }


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
                throw new Error('bad test type');
            }

        }

    });

}

function logIts2(str, test) {
    lines.push('>' + str + test.desc);
}

function logIts3(str) {
    lines.push('>' + str);
}

function logIts(str, test) {
    lines.push('>' + str + '[test] ' + test.desc + (test.error ? 'fail' + ' ' + test.error : '\u2714'));
}

function doTheThing(array) {
    return recurse(0, 1);
}


var array = null;
var lines = null;

onmessage = function (msg) {

    var data = msg.data;

    var lastChar = String(data).slice(-1);
    if (lastChar === ',') {
        data = String(data).substring(0, String(data).length - 1); //strip off trailing comma
    }
    data = "[" + data + "]"; //make parseable by JSON

    var parsed = JSON.parse(data);

    lines = [];
    array = parsed;

    doTheThing();

    lines = lines.map(function (line) {
        return ReactDOMServer.renderToString(ContactItem({line: line}));
    });

    postMessage({
        testName: 'chuckles',
        name: 'chuckles',
        testResult: 'pass',
        testLines: lines
    });

    close();

};


var ContactItem = React.createFactory(React.createClass({

    render: function () {
        return (
            React.createElement('li', {className: 'Contact'},
                React.createElement('h2', {className: 'Contact-name'}, this.props.line)
            )
        )
    }
}));


