/**
 * Created by denman on 11/26/2015.
 */

var appRootPath = require('app-root-path');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var colors = require('colors/safe');
var debug = require('debug')('suman');

var fileNo = 1;

if (process.argv.indexOf('--file-no') !== -1) { //does our flag exist?
    fileNo = process.argv[process.argv.indexOf('--file-no') + 1]; //grab the next item
}

var filePath = path.resolve(appRootPath + '/' + 'test/output/test' + fileNo + '.txt');
var rstream = fs.createReadStream(filePath);

var dataLength = '';

rstream
    .on('data', function (chunk) {
        dataLength += chunk;
    })
    .on('end', function () {  // done

        var lastChar = String(dataLength).slice(-1);
        if(lastChar === ','){
            dataLength = String(dataLength).substring(0, String(dataLength).length - 1); //strip off trailing comma
        }
        dataLength = "[" + dataLength + "]"; //make parseable by JSON

        var parsed = JSON.parse(dataLength);

        doTheThing(parsed);

    });


function doTheThing(array) {

    recurse(0, 1);

    function recurse(i, indent) {

        var statements = _.where(array, {testId: i});

        var output = statements[statements.length - 1]; //always get last element

        //var output = _.where(array,{testId:i,mightHaveChildren:true});

        if(!output){
            throw new Error('no testId 0'); //something is probably wrong now
        }

        if(output.length > 1){
            throw new Error('output length is > 1'); //something is probably wrong now
        }


        var str = new Array(indent).join(' '); //make indentation

        var children = output.children || [];
        var parallelTests = output.testsParallel || [];
        var loopTests = output.loopTests || [];
        var tests =  output.tests || [];


        var testStatements = statements.filter(function (statement) {
            return !statement.userOutput;
        });

        debug('testStatements' + JSON.stringify(testStatements));

        var logStatements = statements.filter(function (item) {
            return item.userOutput && item.data; //filter out any user data that is not defined
        }).map(function (item) {
            return item.data;
        });

        debug('logStatements:' + JSON.stringify(logStatements));


        var allTests = _.sortBy(_.union(tests, parallelTests, loopTests, children), 'testId');

        allTests.forEach(function (test) {

            if (_.contains(_.pluck(children, 'testId'), test.testId)) {
                console.log('going to child from test:', output.testId, 'to:', test.testId);
                recurse(test.testId, indent + 5);
            }
            else {

                if (test.type === 'ParallelTestSet') {
                    debug(str + 'Parallel Test:' + test);
                    var tempStr = str + ' ';
                    test.tests.forEach(function(parTest){
                        logIts(tempStr,parTest);
                    });
                }
                else if (test.type === 'LoopTestSet') {
                    debug(str + 'Loop Test:' + test);
                    var tempStr = str + ' ';
                    test.tests.forEach(function(loopTest){
                        logIts(tempStr,loopTest);
                    });
                }
                else if (test.type === 'it-standard') {
                    logIts(str, test);
                }
                else{
                    //console.log('crap test', test);
                }

            }

        });

    }

}

function logIts(str, test) {
    console.log(str + '[test] ', test.desc, test.error ? colors.red('fail') + ' ' + test.error : colors.green('\u2714'));
}