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

const HTMLParent = require('../react-components/HTMLParent');
const HTMLAdopterParent = require('../react-components/HTMLAdopterParent');
const TestFileSuite = require('../react-components/TestFileSuite');
const Accordion = require('../react-components/accordion/AccordionComp2');
const AccordionSection = require('../react-components/accordion/AccordionSection2');

//#helpers
const helpers = require('./helpers/index');
// const findSumanServer = require('../../lib/find-suman-server');

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

router.get('/:run_id/:test_num', function (req, res, next) {

    var outputDir = config.suman_server_config.outputDir;

    if (!outputDir) {
        console.error('no outputDir defined');
        return next(new Error('no outputDir defined'));
    }

    var folder = path.resolve(outputDir);
    var runId = req.params.run_id;
    var testNum = req.params.test_num;

    fs.readFile(path.resolve(folder + '/' + runId + '/' + testNum + '.txt'), {}, function (err, data) {

        if (err) {
            next(err);
        } else {

            var lastChar = String(data).slice(-1);
            if (lastChar === ',') {
                data = String(data).substring(0, String(data).length - 1); //strip off trailing comma
            }

            data = '[' + data + ']'; //make parseable by JSON

            var parsed = JSON.parse(data);

            console.log('parsed:', parsed);

            res.send(ReactDOMServer.renderToString(React.createElement(TestFileSuite, { data: parsed })));
        }
    });
});

router.get('/latest', function (req, res, next) {

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

        const dirName = path.resolve(folder + '/' + runId);

        fs.readdir(dirName, function (err, items) {

            if (err) {
                next(err);
            } else {

                // const children = items.map(function(){
                //
                //      return  {
                //          comp: TestFileSuite,
                //          props: {
                //              item: items
                //          }
                //      }
                //
                //  });
                //
                //
                //  const HTMLParent = HTMLAdopterParent(children);
                //  res.send(ReactDOMServer.renderToString(<HTMLParent />));

                // res.send(ReactDOMServer.renderToString((
                //     <html>
                //     <head>
                //
                //         <link href={'/styles/style-accordion.css'} rel={'stylesheet'} type={'text/css'}></link>
                //
                //     </head>
                //
                //     <body>
                //
                //
                //     <Accordion selected='2'>
                //         <AccordionSection title='Section 1' id='1'>
                //             Section 1 content
                //         </AccordionSection>
                //         <AccordionSection title='Section 2' id='2'>
                //             Section 2 content
                //         </AccordionSection>
                //         <AccordionSection title='Section 3' id='3'>
                //             Section 3 content
                //         </AccordionSection>
                //     </Accordion>
                //     </body>
                //     </html>
                // )));

                // var data = ReactDOMServer.renderToString((
                //     <html>
                //     <head>
                //
                //         <script src="//cdnjs.cloudflare.com/ajax/libs/react/0.14.8/react.js"></script>
                //         <script src="//fb.me/react-dom-0.14.2.js"></script>
                //         <link href={'/styles/style-accordion.css'} rel={'stylesheet'} type={'text/css'}></link>
                //
                //     </head>
                //
                //     <body>
                //     <Accordion title="Accordion Title Here"/>
                //     </body>
                //     </html>
                // ));

                var data = ReactDOMServer.renderToString(React.createElement(Accordion, { title: 'Accordion Title Here' }));

                // res.send(data);

                res.render('index', {
                    data: data
                });
            }
        });
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