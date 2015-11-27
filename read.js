/**
 * Created by denman on 11/26/2015.
 */

var appRootPath = require('app-root-path');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');

var filePath = path.resolve(appRootPath + '/' + 'test/output/test3.txt');
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


function doTheThing(array) {

    //var length = 1;
    //
    //array.forEach(function (elem) {
    //    if (elem.testId > length) {
    //        length = elem.testId;
    //    }
    //});

    console.log('array:',array);

    function recurse(i) {

        console.log('i:', i, '\n');

        _.where(array, {testId: i}).forEach(function (output) {
            console.log(output.testId);
        });

        var output = _.where(array, {testId: i})[0];

        var parallelTests = [];
        if (output) {
            parallelTests = output.testsParallel;
        }

        parallelTests.forEach(function (parTests) {
            //console.log('parallel tests:',test);
            parTests.tests.forEach(function(test){
                console.log('parallel test:',test.testId);
            });
        });

        var children = [];
        if (output) {
            children = output.children;
        }

        children.forEach(function (child) {
            recurse(child);
        });
    }

    recurse(0);

}