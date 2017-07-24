'use strict';
//core
var path = require('path');
var util = require('util');
var assert = require('assert');
var fs = require('fs');
//npm
var sumanUtils = require('suman-utils');
var _ = require('underscore');
//////////////////////////////////////////////////////////////////////
//TODO: these functions should give users options to use kubernetes or docker
function run() {
    return 'docker run -it --tty=false --rm ' + this.name;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
var defaults = Object.freeze({
    allowReuseImage: false,
    useContainer: true,
    run: run
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = function (data) {
    data = data || {};
    assert(typeof data === 'object', ' => Please pass in object to suman.groups.js function.');
    console.log('data passed to groups fn => ', data);
    var testDir = process.env.TEST_DIR;
    var r = path.resolve(testDir + '/groups');
    var items = fs.readdirSync(r).filter(function (p) {
        return fs.statSync(path.resolve(r + '/' + p)).isDirectory();
    });
    var groups = items.map(function (item) {
        console.log('item => ', item);
        return {
            cwd: path.resolve(r + '/' + item),
            name: path.basename(item, path.extname(item)),
            getPathToScript: function () {
                return path.resolve(this.cwd + '/default.sh');
            },
            // dockerfilePath: path.resolve(r + '/' + item + '/Dockerfile'),
            dockerfilePath: path.resolve(r + '/Dockerfile'),
            build: function () {
                return 'cd ' + this.cwd + ' &&  docker build --file='
                    + this.dockerfilePath + ' -t ' + this.name + ' . ';
            }
        };
    });
    return {
        //TODO: have to handle the case where the build has already been built -
        // don't want to rebuild container
        // put in .suman/groups/scripts
        // if pathToScript is null/undefined,
        // will read script with the same name as the group in the above dir
        groups: groups.map(function (item) {
            var val = Object.assign({}, defaults, data, item);
            console.log('\n val => \n', util.inspect(val));
            return val;
        })
    };
};
