/**
 * Created by denman on 1/9/2016.
 */


module.exports = {

    groups: [
        {
            name: 'build',
            dir: 'test/build-tests',
            files: '*',
            processes: 'max'
        },
        {
            name: 'integration',
            dir: 'test/integration-tests',
            files: '*',
            processes: 'max'
        },
        {
            name: 'other',
            dir: 'test/other-tests',
            files: '*',
            processes: 'max'
        }
    ]
}


