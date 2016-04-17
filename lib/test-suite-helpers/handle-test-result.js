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

                test.error = sumanFatal ? err : err.stack;
                const stack = String(err.stack).split('\n');
                test.errorDisplay = stack.map(function (item, index) {

                    if (item && index === 0) {
                        return '\t\t' + item;
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
                //var stack = new Error(err).stack.split('\n');
                //test.error = [stack[0], stack[5]].join('\n');

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

        return test.error;
    }
};