const path = require('path');
const fs = require('fs');

const cwd = process.cwd();
const down = [];
var found = false;

var p;

function stat(p) {
    try {
        return fs.statSync(p).isFile();
    }
    catch (err) {
        if (!String(err.stack || err).match(/ENOENT: no such file or directory/i)) {
            throw err;
        }
        return false;
    }
}

while (true) {

    p = path.resolve(cwd + down.join('') + '/node_modules/.bin/suman');

    if (String(p) === String(path.sep)) {
        // We are down to the root => fail
        break;
    }
    else if (stat(p)) {
        // Found Suman installation path
        found = true;
        break;
    }

    down.push('/../');

}

if(found){
    console.log(p);
    process.exit(0);
}
else{
    process.exit(1);
}