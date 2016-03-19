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
            obstructs: []
        },
        C: {
            testPath: 'test/integration-tests/test3.js',
            obstructs: []
        }


    }

};