/**
 * Created by denman on 1/1/2016.
 */


module.exports = function makeHandleTestError(suman, testErrors) {

    return function handleTestError(err, test) {

        test.error = null;

        if (err) {
            //console.error(err.stack);
            if (err instanceof Error) {
                var stack = String(err.stack).split('\n');
                test.error = [stack[0], stack[1]].join('\n');
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