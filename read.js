/**
 * Created by denman on 11/26/2015.
 */

var appRootPath = require('app-root-path');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');


var filePath = path.resolve(appRootPath + '/' + 'test/output/test1.txt');
var rstream = fs.createReadStream(filePath);

var dataLength = '';

rstream
    .on('data', function (chunk) {
        dataLength += chunk;
    })
    .on('end', function () {  // done
        var array = String(dataLength).split(';');
        console.log(array.length);

        doTheThing(array.filter(function (item) {
            return item && item.length > 0;
        }).map(function (item) {
            return JSON.parse(String(item));
        }));

    });

//
//function doTheThing(array) {
//
//    recurse(0);
//
//    function recurse(i) {
//
//        console.log('i:', i, '\n');
//
//        //_.where(array, {testId: i}).forEach(function (output) {
//        //    console.log(output.testId);
//        //});
//
//        var statements = _.where(array, {testId: i});
//
//        var output = statements[statements.length - 1]; //always get last element
//
//        var parallelTests = [];
//        var loopTests = [];
//        var tests = [];
//
//        if (output) {
//            tests = output.tests;
//            parallelTests = output.testsParallel;
//            loopTests = output.loopTests;
//        }
//
//        tests.forEach(function (test) {
//            console.log('singular test:',test);
//        });
//
//        parallelTests.forEach(function (parTest) {
//            console.log('parallel test:',parTest);
//            parTest.tests.forEach(function(test){
//                //console.log('parallel test:',test.testId);
//            });
//        });
//
//        loopTests.forEach(function (loopTest) {
//            //console.log('parallel tests:',test);
//            console.log('loop test:',loopTest);
//
//            loopTest.tests.forEach(function(test){
//                //console.log('parallel test:',test.testId);
//            });
//        });
//
//        var children = [];
//        if (output) {
//            children = output.children;
//        }
//
//        children.forEach(function (child) {
//            recurse(child);
//        });
//    }
//
//}


function doTheThing(array) {

    recurse(0);

    function recurse(i) {

        var statements = _.where(array, {testId: i});

        var output = statements[statements.length - 1]; //always get last element

        var children = [];
        if (output) {
            children = output.children;
        }

        var parallelTests = [];
        var loopTests = [];
        var tests = [];

        if (output) {
            tests = output.tests;
            parallelTests = output.testsParallel;
            loopTests = output.loopTests;
        }

        var allTests = _.sortBy(_.union(tests, parallelTests, loopTests, children), 'testId');

        allTests.forEach(function (test) {

            if (_.contains(_.pluck(children, 'testId'), test.testId)) {
                console.log('going to child from test:', output.testId, 'to:', test.testId);
                recurse(test.testId);
            }
            else {
                if (test.type === 'ParallelTestSet') {
                    console.log('Parallel Test:', test);
                }
                else if (test.type === 'LoopTestSet') {
                    console.log('Loop Test:', test);
                }
                else {
                    console.log('regular test:', test);
                }

            }

        });

    }

}