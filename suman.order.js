/**
 * Created by denman on 3/17/2016.
 */


module.exports = () => {


    return {

        A: {
            testPath: 'test/integration-tests/test0.js',
            obstructs: ['B','C','D']
        },
        B: {
            testPath: 'test/integration-tests/test1.js',
            obstructs: ['C']
        },
        C: {
            testPath: 'test/integration-tests/test2.js',
            obstructs: ['D','E','F']
        },
        D: {
            testPath: 'test/integration-tests/test3.js',
            obstructs: ['E','C']
        },
        E: {
            testPath: 'test/integration-tests/test4.js',
            obstructs: ['F','A']
        },
        F: {
            testPath: 'test/integration-tests/test5.js',
            obstructs: ['G','B','C']
        },
        Z: {
            testPath: 'test/build-tests/test7.js',
            obstructs: ['B','G','F','E']
        },
        G: {
            testPath: 'test/build-tests/test8.js',
            obstructs: ['F','A','B','H','C','Z']
        },
        H: {
            testPath: 'test/build-tests/test9.js',
            obstructs: ['G']
        }


    }

};