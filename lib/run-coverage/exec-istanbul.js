/**
 * Created by denmanm1 on 4/10/16.
 */


const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const sumanUtils = require('../utils');

module.exports = function (dirs, isRecursive) {

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

    var bash = 'echo "';

    const $files = sumanUtils.removeSharedRootPath(files);

    $files.forEach(function (file) {

        if (String(file[1]).endsWith('.js')) {
            file[1] = String(file[1]).substring(0, String(file[1]).length - 3);
        }

        bash += 'istanbul cover ' + file[0] + ' --dir ./coverage/' + String(path.basename(file[1], '.js')).replace(/\//g, '-') + '\n';

    });

    bash += 'istanbul report --dir coverage --include **/*coverage.json lcov" | bash';

    console.log(bash);


    cp.exec(bash, function (err, stdout, stderr) {

        if (err) {
            console.error(err.stack);
            process.exit(1);
        }

        console.log(stdout);
        console.error(stderr);

        process.exit(0);


    });


};