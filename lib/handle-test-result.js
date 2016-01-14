/**
 * Created by denman on 1/1/2016.
 */


module.exports = function makeHandleTestError(suman, testErrors) {

    var fileName = suman.fileName;

    return function handleTestError(err, test) {

        test.error = null;

        if (err) {
            //console.error(err.stack);
            if (err instanceof Error) {
                var stack = String(err.stack).split('\n');
                test.error = stack.filter(function (item, index) {

                    if (item && index === 0) {
                        return item;
                    }
                    if (item) {
                        if (String(item).match(fileName)) {
                            return item;
                        }
                    }
                }).join('\n').concat('\n');

                //test.error.unshift(stack[0]);
            }
            else {
                //var stack = new Error(err).stack.split('\n');
                //test.error = [stack[0], stack[5]].join('\n');

                test.error = new Error(err).stack;
            }

            testErrors.push(test.error);
        }

        suman.logResult(test);
    }
};