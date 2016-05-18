/**
 * Created by amills001c on 4/7/16.
 */

const cp = require('child_process');
const path = require('path');

const ls = cp.spawn('sh',['temp.sh'], {

});


ls.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
});

ls.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});