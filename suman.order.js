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
            testPath: 'test/integration-tests/test2.js',
            obstructs: ['D']
        },
        D: {
            testPath: 'test/integration-tests/test3.js',
            obstructs: ['E']
        },
        E: {
            testPath: 'test/integration-tests/test4.js',
            obstructs: ['F']
        },
        F: {
            testPath: 'test/integration-tests/test5.js',
            obstructs: ['G']
        },
        G: {
            testPath: 'test/build-tests/test8.js',
            obstructs: []
        },
        H: {
            testPath: 'test/build-tests/test9.js',
            obstructs: ['A']
        }

    }

};