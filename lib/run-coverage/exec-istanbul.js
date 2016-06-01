
//core
const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const os = require('os');

//project
const sumanUtils = require('../utils');

module.exports =  function execTheIstanbul(dirs, isRecursive) {

    const files = [];

    dirs.forEach(function (dir) {

        (function findFiles(dir, isFile) {

            if (isFile) {
                const basename = path.basename(dir);
                if (path.extname(basename) === '.js') {
                    files.push(dir);
                }
            }
            else {

                if (fs.statSync(dir).isFile()) {
                    findFiles(dir, true);
                }
                else {
                    var items = fs.readdirSync(dir);

                    items.forEach(function (item) {

                        item = path.resolve(dir + '/' + item);

                        if (fs.statSync(item).isFile()) {
                            findFiles(item, true);
                        }
                        else {
                            if (isRecursive) {
                                findFiles(item, false);
                            }
                        }

                    });
                }

            }

        })(dir);


    });


    //TODO: use --include-all-sources
    // as per http://stackoverflow.com/questions/27606071/how-to-make-istanbul-generate-coverage-for-all-of-my-source-code
    //istanbul report --dir coverage --include **/*coverage.json json
    //istanbul report --dir coverage --include **/*coverage.json json

    console.log(' => Suman message => the following shell commands will run on your system and may take awhile.');
    console.log(' => Suman message => please be patient.\n\n');
    console.log(' => Because collecting coverage is more CPU intensive, we run one suman command at a time.');


    var bash = 'echo "';
    var cmd = '';

    const $files = sumanUtils.removeSharedRootPath(files);

    $files.forEach(function (file) {

        if (String(file[1]).endsWith('.js')) {
            file[1] = String(file[1]).substring(0, String(file[1]).length - 3);
        }

        //note we replace path.sep with dash
        //TODO: need to use path.sep instead of plain /
        if (os.platform() === 'win32') {
            cmd += 'istanbul cover ' + path.normalize(file[0]) + ' --dir ./coverage/' + String(path.basename(path.normalize(file[1]), '.js')).replace(/\//g, '-') + ' & ';
        }
        else {
            bash += 'istanbul cover ' + file[0] + ' --dir ./coverage/' + String(path.basename(file[1], '.js')).replace(/\//g, '-') + '\n';
        }

    });

    //we pipe through bash to avoid writing out temp file(s)
    if (os.platform() === 'win32') {
        cmd += 'istanbul report --dir coverage --include **/*coverage.json lcov';
        console.log(cmd);
    }
    else {
        bash += 'istanbul report --dir coverage --include **/*coverage.json lcov" | bash';
        // bash += 'istanbul report --dir coverage --include **/*coverage.json lcov';
        console.log(bash);
    }


    //TODO: turn this into spawn instead of exec?
    cp.exec(os.platform() === 'win32' ? cmd : bash, function (err, stdout, stderr) {

        if (err) {
            console.error(err.stack);
            return process.exit(1);
        }

        console.log('Stdout:', stdout);
        console.error('Stderr:', stderr);

        process.exit(0);


    });


    //TODO: implement with spawn instead of exec

    // const arr = bash.split(/\s+/g);
    // console.log('aaarray:',arr);
    //
    // var ls;
    // if(os.platform() === 'win32'){
    //      ls = cp.spawn('ls', ['-lh', '/usr']);
    // }
    // else{
    //      ls = cp.spawn('bash', arr );
    // }
    //
    //
    // ls.stdout.on('data', (data) => {
    //     console.log(`stdout: ${data}`);
    // });
    //
    // ls.stderr.on('data', (data) => {
    //     console.log(`stderr: ${data}`);
    // });
    //
    // ls.on('close', (code) => {
    //     console.log(`child process exited with code ${code}`);
    // });

};