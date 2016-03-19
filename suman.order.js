/**
 * Created by denman on 3/17/2016.
 */


module.exports = () => {


    return {


        A: {
            testPath: 'test/integration-tests/test0.js',
            obstructs: ['B']
        },
        B: {
            testPath: 'test/integration-tests/test1.js',
            obstructs: ['C']
        },
        C: {
            testPath: 'test/integration-tests/test3.js',
            obstructs: ['A']
        },
        D: {
            testPath: 'test/integration-tests/test4.js',
            obstructs: ['A']
        }

    }

};