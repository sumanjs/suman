
//core
const util = require('util');

//project
const sumanUtils = require('../../lib/utils');


function identity(item) {
    return item;
}

module.exports = function makeHandleTestError(suman, testErrors) {

    const fileName = suman.fileName;

    return function handleTestError(err, test) {

        test.error = null;

        if (err) {

            const sumanFatal = err.sumanFatal;

            if (err instanceof Error) {

                test.error = err;
                const stack = String(err.stack).split('\n');
                test.errorDisplay = stack.map(function (item, index) {

                    if (item && index === 0) {
                        return '\t' + item;
                    }
                    if (item) {
                        if (sumanFatal) {
                            return sumanUtils.padWithFourSpaces() + item;  //4 spaces
                        }
                        //TODO: if we want full-stack-traces, then implement here
                        if (String(item).includes(fileName)) {
                            return sumanUtils.padWithFourSpaces() + item; //4 spaces
                        }

                        return sumanUtils.padWithFourSpaces() + item; //4 spaces

                    }

                }).filter(identity).join('\n').concat('\n');

            }
            else if(err.stack) {

                test.error = err;
                test.errorDisplay = String(err.stack).split('\n').map(function (item, index) {

                    if (item && index === 0) {
                        return '\t' + item;
                    }
                    if (item) {
                        if (sumanFatal) {
                            return sumanUtils.padWithFourSpaces() + item;  //4 spaces
                        }
                        //TODO: if we want full-stack-traces, then implement here
                        if (String(item).includes(fileName)) {
                            return sumanUtils.padWithFourSpaces() + item; //4 spaces
                        }

                        return sumanUtils.padWithFourSpaces() + item; //4 spaces

                    }

                }).filter(function (item) {

                    return item;

                }).join('\n').concat('\n');
            }
            else{
                throw new Error('Suman internal error => invalid format.');
            }

            global._writeTestError('\n\nTest error: ' + test.desc + '\n\t' + 'stack: ' + test.error.stack + '\n\n');
            testErrors.push(test.error);
        }

        suman.logResult(test);

        if (test.error) {
            test.error.isFromTest = true;
        }
        return test.error;
    }
};