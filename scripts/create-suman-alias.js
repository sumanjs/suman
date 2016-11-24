console.log(' => In Suman postinstall script => ', __filename);


const path = require('path');
const fs = require('fs');

///// !!!! we don't want to actually run this yet //////////

return;

///////////////////////

const sumanUtils = require('suman-utils/utils');

const bashProfileFile = path.resolve(sumanUtils.getHomeDir() + '/.bash_profile');
// const cmd = 'alias suman="./node_modules/.bin/suman"';

const cmd = 'alias suman="echo suman-alias-running && node $(node $HOME/.suman/find-local-suman-executable.js)"';

fs.readFile(bashProfileFile, function (err, contents) {
    if (err) {
        if (String(err.stack || err).match(/ENOENT: no such file or directory/i)) {
            appendToBashProfile('');
        }
        else {
            console.error(err.stack || err);
            process.exit(1);
        }
    }
    else {
        appendToBashProfile(contents);
    }
});

function appendToBashProfile(contents) {

    if (String(contents).indexOf(cmd) < 0) {

        // .bash_profile is created if it does not exist
        fs.appendFile(bashProfileFile, '\n' + cmd, {flag: 'a'}, function (err) {
            if (err) {
                console.error(err.stack || err);
                process.exit(1);
            }
            else {
                console.log(' => Successfully appending line to .bash_profile.');
                process.exit(0);
            }
        });
    }
    else {

        console.log(' => alias was already written to .bash_profile file');
        process.exit(0);
    }
}

