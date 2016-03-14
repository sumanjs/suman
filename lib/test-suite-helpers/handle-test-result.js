/**
 * Created by denman on 1/1/2016.
 */


module.exports = function makeHandleTestError(suman, testErrors) {

    var fileName = suman.fileName;

    return function handleTestError(err, test) {

        test.error = null;

        if (err) {
            if (err instanceof Error) {
                var sumanFatal = err.sumanFatal;
                var stack = String(err.stack).split('\n');
                test.error = stack.map(function (item, index) {

                    if (item && index === 0) {
                        return '\t' + item;
                    }
                    if (item) {
                        if(sumanFatal){
                            return '\t' +  item;
                        }
                        if (String(item).match(fileName)) {
                            return '\t' + item;
                        }
                    }
                }).filter(function(item){
                    return item;
                }).join('\n').concat('\n');

                //test.error.unshift(stack[0]);
            }
            else {
                //var stack = new Error(err).stack.split('\n');
                //test.error = [stack[0], stack[5]].join('\n');

                test.error = String(new Error(err).stack).split('\n').map(function (item, index) {

                    if (item && index === 0) {
                        return '\t' + item;
                    }
                    if (item) {
                        if(sumanFatal){
                            return '\t' +  item;
                        }
                        if (String(item).match(fileName)) {
                            return '\t' + item;
                        }
                    }
                }).filter(function(item){
                    return item;
                }).join('\n').concat('\n');
            }

            testErrors.push(test.error);
        }

        suman.logResult(test);
    }
};