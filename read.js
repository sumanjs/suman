/**
 * Created by denman on 11/26/2015.
 */

var appRootPath = require('app-root-path');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var colors = require('colors/safe');


var filePath = path.resolve(appRootPath + '/' + 'test/output/test4.txt');
var rstream = fs.createReadStream(filePath);

var dataLength = '';

rstream
    .on('data', function (chunk) {
        dataLength += chunk;
    })
    .on('end', function () {  // done

        dataLength = String(dataLength).substring(0, String(dataLength).length - 1); //strip off trailing comma
        dataLength = "[" + dataLength + "]"; //make parseable by JSON
        console.log(dataLength);

        console.log('\n');
        console.log('\n');
        doTheThing(JSON.parse(String(dataLength)));

    });


function doTheThing(array) {

    recurse(0, 1);

    function recurse(i, indent) {

        var statements = _.where(array, {testId: i});

        var output = statements[statements.length - 1]; //always get last element

        var str = new Array(indent).join(' '); //make indentation

        var children = [];
        var parallelTests = [];
        var loopTests = [];
        var tests = [];

        if (output) {
            children = output.children;
            tests = output.tests;
            parallelTests = output.testsParallel;
            loopTests = output.loopTests;
        }

        var testStatements = statements.filter(function(statement){
            return !statement.userOutput;
        });

        console.log('testStatements',testStatements);

        var logStatements = statements.filter(function (item) {
            return item.userOutput && item.data; //filter out any user data that is not defined
        }).map(function (item) {
            return item.data;
        });

        console.log(logStatements);



        var allTests = _.sortBy(_.union(testStatements, tests, parallelTests, loopTests, children), 'testId');

        allTests.forEach(function (test) {

            if (_.contains(_.pluck(children, 'testId'), test.testId)) {
                console.log('going to child from test:', output.testId, 'to:', test.testId);
                recurse(test.testId, indent + 5);
            }
            else {

                if (test.type === 'ParallelTestSet') {
                    console.log(str + 'Parallel Test:', test);
                }
                else if (test.type === 'LoopTestSet') {
                    console.log(str + 'Loop Test:', test);
                }
                else if (test.type === 'it-standard') {
                    console.log(str + '[test] ', test.desc, test.error ? colors.red('fail') + ' ' + test.error : colors.green('\u2714'));
                }

            }

        });

    }

}