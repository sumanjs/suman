/**
 * Created by amills001c on 3/20/16.
 */


const fs = require('fs');
const path = require('path');

const file = fs.readFileSync(path.resolve(__dirname + '/../../test/mocha-conversion-tests/mocha-test0.js'), 'utf8');

const lines = String(file.replace(/ +?/g, '')).split('\n');  //replace all lines but new line chars

console.log(lines);

const result = [];

//const coreModuleMatches = /'^[var|const][a-z\$\_]{1,}=require([\'|"][assert|fs|path][\'|"])[;]{0,1}$/;

const coreModuleMatches = /varassert=require('assert');/;
const coreModules = [];

var firstDescribeMatch = false;

lines.forEach(function (line) {

    const matchesDescribe = line.match(/^describe\(/);
    const matchesIt = line.match(/^it\(/);
    const matchesFn = line.match(/function\(\){/);
    const matchesFnWithDone = line.match(/function\([a-z\$\_]{1,}\){/);
    const coreModuleMatch = line.match(coreModuleMatches);

    if(coreModuleMatch){
        coreModuleMatch.forEach(function(m){
           console.log('core module match:', m);
        });
    }


    if (matchesDescribe && !firstDescribeMatch) {
        firstDescribeMatch = true;
        result.push(line.replace(/^describe\(/, 'Test.describe(').replace('function(){', 'function(){'));
        return;
    }

    if (matchesDescribe) {
        firstDescribeMatch = true;
        result.push(line.replace(/^describe\(/, 'this.describe(').replace('function(){', 'function(){'));
        return;
    }

    if (matchesIt && matchesIt.length > 0) {
        if (matchesFn && matchesFn.length === 1) {
            result.push(line.replace('it(', 'this.it(').replace('function(){', 'function(t){'));
            return;
        }
        else if (matchesFnWithDone && matchesFnWithDone.length === 1) {
            result.push(line.replace('it(', 'this.it(').replace(/function\([a-z]{1,}\){/, 'function(t,done){'));
            return;
        }
        else if (matchesFn && matchesFn.length > 1) {
            throw new Error('File cannot be converted.');
        }
    }

    result.push(line);

});


fs.writeFileSync(path.resolve(__dirname + '/../../test/mocha-conversion-tests/write-to.js'), result.join('\n'));