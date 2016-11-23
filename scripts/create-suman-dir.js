console.log(' => In Suman postinstall script => ', __filename);

//core
const path = require('path');
const fs = require('fs');

//project
const sumanUtils = require('suman-utils/utils');


///////////////////////////////////////////////////////////////////////////

const userHomeDir = path.resolve(sumanUtils.getHomeDir());
const p = path.resolve(userHomeDir + '/.suman');
const findSumanExec = path.resolve(p + '/find-suman-executable.js');
const fileToWrite = fs.readFileSync(require.resolve('./find-suman-executable.js'));

fs.mkdir(p, function (err) {

    if (err) {
        if (!String(err.stack || err).match(/EEXIST: file already exists/)) {
            throw err;
        }
    }

    fs.writeFile(findSumanExec, fileToWrite, function (err) {
        if (err) {
            throw err;
        }
        else {
            process.exit(0);
        }
    })


});