/**
 * Created by denman on 12/16/15.
 */

//#config
const config = require('univ-config')(module, '*suman*', 'server/config/conf');

//#core
const fs = require('fs');
const os = require('os');
const path = require('path');

//#npm
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const express = require('express');
const router = express.Router();

//#project

//react-components

const HTMLParent = require('./react-components/HTMLParent');
const HTMLAdopterParent = require('./react-components/HTMLAdopterParent');
const TestFileSuite = require('./react-components/TestFileSuite');

//#helpers
const helpers = require('./helpers');
const findSumanServer = require('../../lib/find-suman-server');

router.post('/done/:run_id', function (req, res, next) {

    var data = body.data;

    try {
        var json = JSON.stringify(data.test);

        if (data.outputPath) {
            fs.appendFileSync(data.outputPath, json += ','); //we write synchronous because we have to ensure data doesn't get malformed in files on disk
            req.sumanData.success = { msg: 'appended data to ' + data.outputPath };
        } else {
            console.error(new Error('no outputPath property on data: ' + data).stack);
        }
        next();
    } catch (err) {
        next(err);
    }
});

router.post('/finalize', function (req, res, next) {

    var body = req.body;
    var rendered = body.rendered;
    //var config = body.config;
    var timestamp = body.timestamp;

    try {

        var outputDir = config.suman_server_config.outputDir;

        if (!outputDir) {
            console.error('no outputDir defined');
            return next(new Error('no outputDir defined'));
        }

        var outputPath = path.resolve(outputDir + '/' + timestamp + '/temp.html');

        fs.writeFile(outputPath, rendered, err => {
            if (err) {
                console.log(err.stack);
                next(err);
            } else {
                res.json({ success: 'wrote rendered .ejs file' });
            }
        });
    } catch (err) {
        next(err);
    }
});

router.post('/make/new', function (req, res, next) {

    var body = req.body;
    //var config = body.config;
    var timestamp = body.timestamp;

    try {
        var outputDir = config.suman_server_config.outputDir;

        if (!outputDir) {
            console.error('no outputDir defined');
            return next(new Error('no outputDir defined'));
        }

        var outputPath = path.resolve(outputDir + '/' + timestamp);

        fs.mkdir(outputPath, function (err) {
            if (err) {
                console.error(err.stack);
                next(err);
            } else {
                console.log('created dir at ' + outputPath);
                req.sumanData.success = { msg: 'created dir at ' + outputPath };
                next();
            }
        });
    } catch (err) {
        next(err);
    }
});

router.get('/latest', function (req, res, next) {

    try {
        var outputDir = config.suman_server_config.outputDir;

        if (!outputDir) {
            console.error('no outputDir defined');
            return next(new Error('no outputDir defined'));
        }

        var folder = path.resolve(outputDir);
        var runId = helpers.getPathOfMostRecentSubdir(folder);

        if (!runId) {
            //TODO this will happen if the suman_results dir is deleted, we should add the folder if it gets deleted
            next(new Error('no latest results exist'));
        } else {

            fs.readdir(path.resolve(folder + '/' + runId), function (err, items) {

                const children = [{
                    comp: TestFileSuite,
                    props: {
                        items: items
                    }
                }];

                const HTMLParent = HTMLAdopterParent(children);
                res.send(ReactDOMServer.renderToString(React.createElement(HTMLParent, { items: items })));
            });
        }
    } catch (err) {
        next(err);
    }
});

router.get('/:run_id/:test_num', function (req, res, next) {

    try {
        var outputDir = config.suman_server_config.outputDir;

        if (!outputDir) {
            console.error('no outputDir defined');
            return next(new Error('no outputDir defined'));
        }

        var folder = path.resolve(outputDir);

        var runId = req.params.run_id;
        var testNum = req.params.test_num;

        res.sendFile(path.resolve(folder, runId, testNum), {
            maxAge: '58h'
        });
    } catch (err) {
        next(err);
    }
});

router.get('/:run_id', function (req, res, next) {

    try {
        var outputDir = config.suman_server_config.outputDir;

        if (!outputDir) {
            console.error('no outputDir defined');
            return next(new Error('no outputDir defined'));
        }

        var folder = path.resolve(outputDir);

        var runId = req.params.run_id;

        var file = path.resolve(folder, runId, 'temp.html');
        console.log(file);
        res.sendFile(file);
    } catch (err) {
        next(err);
    }
});

module.exports = router;