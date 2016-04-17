/**
 * Created by denman on 1/1/2016.
 */


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
                            return '\t' + item;
                        }
                        //TODO: if we want full-stack-traces, then implement here
                        if (String(item).includes(fileName)) {
                            return '\t' + item;
                        }

                    }

                }).filter(function (item) {

                    return item;

                }).join('\n').concat('\n');

            }
            else {

                test.error = String(err);
                test.errorDisplay = String(new Error(err).stack).split('\n').map(function (item, index) {

                    if (item && index === 0) {
                        return '\t' + item;
                    }
                    if (item) {
                        if (sumanFatal) {
                            return '\t' + item;
                        }
                        if (String(item).match(fileName)) {
                            return '\t' + item;
                        }
                    }

                }).filter(function (item) {

                    return item;

                }).join('\n').concat('\n');
            }

            testErrors.push(test.error);
        }

        suman.logResult(test);

        if (test.error) {
            test.error.isFromTest = true;
        }
        return test.error;
    }
};