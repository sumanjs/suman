/**
 * Created by amills001c on 3/20/16.
 */



//https://strongloop.com/strongblog/practical-examples-of-the-new-node-js-streams-api/
//TODO: need to make sure it works with skip/only, currently it does not

const fs = require('fs');
const path = require('path');
const stream = require('stream');

//#npm
const builtinModules = require('builtin-modules');

//#project
const sumanUtils = require('../utils');
const nfsa = require('./nfsa');

//////////////////////////////////////////////////////////

//const coreModuleMatches = /'^(var|const|,)[a-z\$\_]{1,}=require\((\'|")(assert|fs|path)(\'|")\)[;|,]{0,1}$/;

//const coreModuleMatches = '^\s*(?:var|const|,)\s*([a-z$_]+\s*=\s*require\((\'|")(?:(' + builtinModules.join('|') + '))\2\),?[\n\r\t\s]*)*;$';

//const coreModuleMatches = `^\s*(var|const|,)\s*[a-zA-Z\_\$]+\s*=\s*require\(('|")(${builtinModules.join('|')})('|")\)`;

//const coreModuleMatches = new RegExp(`require\(('|")(${builtinModules.join('|')})('|")\)`);

const coreModuleMatches = new RegExp(`("|')(${ builtinModules.join('|') })\\1`);
//var rgxStr = 'require\(("|\')' + builtinModules.join('|') + '("|\')\)\\1';

console.log('rgxStr:', coreModuleMatches);

//var coreModuleMatches = new RegExp(rgxStr);


const regexes = {

    matchesAnonFnWith0Args: /function\s*\(\s*\)\s*\{/,
    matchesFnWith0Args: 'function\s*([a-zA-Z0-9]|_|\$)*\s*\(\s*\)\s*\{',      //TODO: match with non-anon function
    matchesAnonFnWith1Arg: /function\s*\(\s*[a-z_$]{1,}[a-z0-9_$]{0,}\s*\)\s*\{/,
    matchesDescribe: /^\s*describe\s*\(/,
    matchesContext: /^\s*context\s*\(/,
    matchesDescribeSkip: /^\s*describe.skip\s*\(/,
    matchesContextSkip: /^\s*context.skip\s*\(/,
    matchesIt: /^\s*it\s*\(/,
    matchesItSkip: /^\s*it.skip\s*\(/,
    matchesBefore: /^\s*before\s*\(/,
    matchesAfter: /^\s*after\s*\(/,
    matchesBeforeEach: /^\s*beforeEach\s*\(/,
    matchesAfterEach: /^\s*afterEach\s*\(/

};


///////////////////////////////////////////////////////////

const root = sumanUtils.findProjectRoot(process.cwd());


module.exports = function convertSrcToDest(source, dest) {

    if (!path.isAbsolute(source)) {
        source = path.resolve(root + '/' + source);
    }

    if (!path.isAbsolute(dest)) {
        dest = path.resolve(root + '/' + dest);
    }

    //////// delete contents of dest dir //////////////////////

    //var rmDir = function (dirPath) {
    //    try {
    //        var files = fs.readdirSync(dirPath);
    //    }
    //    catch (e) {
    //        return;
    //    }
    //    if (files.length > 0) {
    //        for (var i = 0; i < files.length; i++) {
    //            var filePath = dirPath + '/' + files[i];
    //            if (fs.statSync(filePath).isFile()) {
    //                fs.unlinkSync(filePath);
    //            }
    //            else {
    //                rmDir(filePath);
    //            }
    //        }
    //    }
    //    fs.rmdirSync(dirPath);
    //};
    //
    //try {
    //    rmDir(dest);
    //}
    //catch (err) {
    //    if (!String(err).match(/ENOTDIR/g)) {
    //        throw err;
    //    }
    //}

    /////////////////////////////////////////////////////////////


    try {
        fs.mkdirSync(dest);
    }
    catch (err) {

    }


    /////////////////////////////////////////////////////////////


    (function recurse(source, dest) {

        fs.readdir(source, function (err, items) {
            if (err) {
                if (!String(err).match(/ENOTDIR/)) {
                    throw err;
                }
                else {
                    try {

                        if (path.extname(dest) === '.js') {
                            try {
                                fs.mkdirSync(path.resolve(dest + '/../'));
                            }
                            catch (err) {
                                if (!String(err).match(/EEXIST/)) {
                                    throw err;
                                }
                            }
                        }
                        else {
                            var statsDest = fs.statSync(dest);
                            if (statsDest.isDirectory()) {
                                dest = path.resolve(dest + '/' + path.basename(source));
                            }
                        }

                        const statsSrc = fs.statSync(source);


                        if (statsSrc.isFile()) {
                            if (path.extname(source) === '.js') {
                                fs.createReadStream(source, {
                                    flags: 'r',
                                    encoding: 'utf-8',
                                    fd: null,
                                    bufferSize: 1
                                }).pipe(convertFile())
                                    .pipe(fs.createWriteStream(dest).on('error', function (err) {
                                            console.log(' => Suman conversion error => ' + err);
                                        })
                                    ).on('error', function (err) {
                                    console.log(' => Suman conversion error => ' + err);
                                });
                            }
                            else {
                                throw new Error('Looks like you passed in a command line argument to convert a file at path="' + source + '"\n' +
                                    'but it was not a .js file.');
                            }
                        }
                        else {
                            throw new Error('Looks like you passed in a command line argument to convert a file at path="' + source + '"\n' +
                                'but it was not a valid file.');
                        }
                    }
                    catch (err) {
                        throw err; // TODO: better thing to do with this?
                    }
                }
            }
            else {

                items.forEach(function (item) {

                    const srcPath = path.resolve(source + '/' + item);
                    const destPath = path.resolve(dest + '/' + item);

                    fs.stat(srcPath, function (err, stats) {

                        if (err) {
                            throw err;
                        }
                        else {

                            if (stats.isDirectory()) {
                                try {
                                    fs.mkdirSync(destPath);
                                }
                                catch (err) {

                                }
                                recurse(srcPath, destPath);
                            }
                            else if (stats.isFile()) {

                                if (path.extname(srcPath) === '.js') {
                                    fs.createReadStream(srcPath, {
                                        flags: 'r',
                                        encoding: 'utf-8',
                                        fd: null,
                                        bufferSize: 1
                                    }).pipe(convertFile())
                                        .pipe(fs.createWriteStream(destPath).on('error', function (err) {
                                                console.log(' => Suman conversion error => ' + err);
                                            })
                                        ).on('error', function (err) {
                                        console.log(' => Suman conversion error => ' + err);
                                    });
                                }
                            }
                        }
                    });
                });
            }

        });

    })(source, dest);


};


const currentBlockType = {

    'topDescribe': {
        'this.parent': '{formerly:"this.parent"}',
    },

    'describe/context': {
        //no rules needed, original is ok
    },

    'it': {
        'this.test.parent': 'this',
        'this.test': 't',
    },

    'before/After': {
        'this.currentTest': '{formerly:"this.currentTest"}',
        'this.test.parent': 'this',
        'this.test': '{formerly:"this.test"}'
    },

    'beforeEach/AfterEach': {
        'this.currentTest.parent': 'this',
        'this.currentTest': 't',
        'this.test.parent': 'this',
        'this.test': '{formerly:"this.test"}'
    }

};


function convertFile() {


    var currentBlock = null;
    const coreModules = [];

    var firstDescribeMatch = false;
    const indexes = {
        'index_of_top_level_describe': null
    };

    function convertLine(strm, index, line) {

        const matchesDescribe = line.match(regexes.matchesDescribe);
        const matchesDescribeSkip = line.match(regexes.matchesDescribeSkip);
        const matchesIt = line.match(regexes.matchesIt);
        const matchesItSkip = line.match(regexes.matchesItSkip);
        const matchesContext = line.match(regexes.matchesContext);
        const matchesContextSkip = line.match(regexes.matchesContextSkip);
        const matchesBefore = line.match(regexes.matchesBefore);
        const matchesAfter = line.match(regexes.matchesAfter);
        const matchesBeforeEach = line.match(regexes.matchesBeforeEach);
        const matchesAfterEach = line.match(regexes.matchesAfterEach);
        const matchesFn = line.match(regexes.matchesAnonFnWith0Args);
        const matchesFnWithDone = line.match(regexes.matchesAnonFnWith1Arg);

        const coreModuleMatch = line.match(coreModuleMatches);

        if (coreModuleMatch) {
            coreModuleMatch.forEach(function (m) {
                console.log('core module match:', m);
                coreModules.push(m);
            });
        }

        //TODO: need to add context check for top level describe? Probably not

        if (matchesDescribe && !firstDescribeMatch) {
            currentBlock = currentBlockType.topDescribe;
            firstDescribeMatch = true;
            indexes.index_of_top_level_describe = index;
            return line.replace(regexes.matchesDescribe, 'Test.describe(').replace(regexes.matchesAnonFnWith0Args, 'function(assert){');
        }

        if (matchesDescribeSkip && !firstDescribeMatch) {
            currentBlock = currentBlockType.topDescribe;
            firstDescribeMatch = true;
            indexes.index_of_top_level_describe = index;
            return line.replace(regexes.matchesDescribeSkip, 'Test.describe.skip(').replace(regexes.matchesAnonFnWith0Args, 'function(assert){');
        }

        if (matchesDescribe) {
            currentBlock = currentBlockType['describe/context'];
            return line.replace(regexes.matchesDescribe, '\tthis.describe(').replace(regexes.matchesAnonFnWith0Args, 'function(){');
        }

        if (matchesDescribeSkip) {
            currentBlock = currentBlockType['describe/context'];
            return line.replace(regexes.matchesDescribeSkip, '\tthis.describe.skip(').replace(regexes.matchesAnonFnWith0Args, 'function(){');
        }

        if (matchesContext) {
            currentBlock = currentBlockType['describe/context'];
            return line.replace(regexes.matchesContext, '\tthis.context(').replace(regexes.matchesAnonFnWith0Args, 'function(){');
        }

        if (matchesContextSkip) {
            currentBlock = currentBlockType['describe/context'];
            return line.replace(regexes.matchesContextSkip, '\tthis.context.skip(').replace(regexes.matchesAnonFnWith0Args, 'function(){');
        }

        if (matchesBefore) {
            currentBlock = currentBlockType['before/After'];
            if (matchesFn && matchesFn.length === 1) {
                return line.replace(regexes.matchesBefore, '\tthis.before(').replace(regexes.matchesAnonFnWith0Args, '() => {');
            }
            else if (matchesFnWithDone && matchesFnWithDone.length === 1) {
                return line.replace(regexes.matchesBefore, '\tthis.before(').replace(regexes.matchesAnonFnWith1Arg, 'done => {');
            }
            else if (matchesFn && matchesFn.length > 1) {
                throw new Error('File cannot be converted => unexpected number of arguments to beforeEach callback.');
            }
        }

        if (matchesAfter) {
            currentBlock = currentBlockType['before/After'];
            if (matchesFn && matchesFn.length === 1) {
                return line.replace(regexes.matchesAfter, '\tthis.after(').replace(regexes.matchesAnonFnWith0Args, '() => {');
            }
            else if (matchesFnWithDone && matchesFnWithDone.length === 1) {
                return line.replace(regexes.matchesAfter, '\tthis.after(').replace(regexes.matchesAnonFnWith1Arg, 'done => {');
            }
            else if (matchesFn && matchesFn.length > 1) {
                throw new Error('File cannot be converted => unexpected number of arguments to beforeEach callback.');
            }
        }

        if (matchesBeforeEach) {
            currentBlock = currentBlockType['beforeEach/AfterEach'];
            if (matchesFn && matchesFn.length === 1) {
                return line.replace(regexes.matchesBeforeEach, '\tthis.beforeEach(').replace(regexes.matchesAnonFnWith0Args, 't => {');
            }
            else if (matchesFnWithDone && matchesFnWithDone.length === 1) {
                return line.replace(regexes.matchesBeforeEach, '\tthis.beforeEach(').replace(regexes.matchesAnonFnWith1Arg, '(t,done) => {');
            }
            else if (matchesFn && matchesFn.length > 1) {
                throw new Error('File cannot be converted => unexpected number of arguments to beforeEach callback.');
            }
        }

        if (matchesAfterEach) {
            currentBlock = currentBlockType['beforeEach/AfterEach'];
            if (matchesFn && matchesFn.length === 1) {
                return line.replace(regexes.matchesAfterEach, '\tthis.afterEach(').replace(regexes.matchesAnonFnWith0Args, 't => {');
            }
            else if (matchesFnWithDone && matchesFnWithDone.length === 1) {
                return line.replace(regexes.matchesAfterEach, '\tthis.afterEach(').replace(regexes.matchesAnonFnWith1Arg, '(t,done) => {');
            }
            else if (matchesFn && matchesFn.length > 1) {
                throw new Error('File cannot be converted => unexpected number of arguments to beforeEach callback.');
            }
        }

        if (matchesIt && matchesIt.length > 0) {
            currentBlock = currentBlockType['it'];
            if (matchesFn && matchesFn.length === 1) {
                return line.replace(regexes.matchesIt, '\tthis.it(').replace(regexes.matchesAnonFnWith0Args, 't => {');
            }
            else if (matchesFnWithDone && matchesFnWithDone.length === 1) {
                return line.replace(regexes.matchesIt, '\tthis.it(').replace(regexes.matchesAnonFnWith1Arg, '(t,done) => {');
            }
            else if (matchesFn && matchesFn.length > 1) {
                throw new Error('File cannot be converted => unexpected number of arguments to it() callback..');
            }
        }

        if (matchesItSkip && matchesItSkip.length > 0) {
            currentBlock = currentBlockType['it'];
            if (matchesFn && matchesFn.length === 1) {
                return line.replace(regexes.matchesItSkip, '\tthis.it.skip(').replace(regexes.matchesAnonFnWith0Args, 't => {');
            }
            else if (matchesFnWithDone && matchesFnWithDone.length === 1) {
                return line.replace(regexes.matchesItSkip, '\tthis.it.skip(').replace(regexes.matchesAnonFnWith1Arg, '(t,done) => {');
            }
            else if (matchesFn && matchesFn.length > 1) {
                throw new Error('File cannot be converted => unexpected number of arguments to it.skip() callback..');
            }
        }

        if (currentBlock) {
            const regexz = Object.keys(currentBlock);
            regexz.forEach(function (regexStr) {
                line = line.replace(new RegExp(regexStr,'g'), currentBlock[regexStr]);
            });
        }

        return line;

    }


    const strm = new stream.Transform({
        objectMode: true
    });

    strm.$currentIndex = 0;
    strm.$indexes = [];

    var firstPass = true;


    strm._transform = function (chunk, encoding, done) {

        if (firstPass) {
            firstPass = false;
            this.push('\n');
            this.push('/*\n');
            nfsa.forEach(msg => {
                this.push(msg + '\n');
            });
            this.push('*/\n\n');
            this.push('const suman = require(\'suman\');' + '\n');
            this.push('const Test = suman.init(module);' + '\n');
            this.push('\n');
        }

        var data = chunk.toString();
        if (this._lastLineData) {
            data = this._lastLineData + data;
        }

        var lines = data.split('\n');
        this._lastLineData = lines.splice(lines.length - 1, 1)[0];

        lines.forEach(line => {
            line = convertLine(this, this.$currentIndex++, line);
            this.push(line + '\n');
        });

        done()
    };

    strm._flush = function (done) {
        if (this._lastLineData) {
            this.push(this._lastLineData + '\n');
        }
        this._lastLineData = null;
        done();
    };


    function finishConversion(strm) {

        var data = strm[indexes.index_of_top_level_describe];
        data = data.replace('function(){', 'function(' + coreModules.filter(function (item) {
                return !String(item).match(/('|")/g);
            }).join(',') + '){');

        result.splice(indexes.index_of_top_level_describe, 1, data);
    }


    return strm;


}

