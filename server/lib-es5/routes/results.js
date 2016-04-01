/**
 * Created by denman on 12/16/15.
 */

//#config
const config = require('univ-config')(module, '*suman*', 'server/config/conf');

//#core
const fs = require('fs');
const os = require('os');
const path = require('path');
const async = require('async');

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
const Accordion = require('../react-components/AccordionComp');
const AccordionSection = require('../react-components/AccordionSection');

//#helpers
const helpers = require('./helpers/index');
// const findSumanServer = require('../../lib/find-suman-server');

router.post('/done/:runId', function (req, res, next) {

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

router.get('/:runId/:testId', function (req, res, next) {

    var outputDir = config.suman_server_config.outputDir;

    if (!outputDir) {
        console.error('no outputDir defined');
        return next(new Error('no outputDir defined'));
    }

    var folder = path.resolve(outputDir);
    var runId = req.params.runId;
    var testNum = req.params.testId;

    fs.readFile(path.resolve(folder + '/' + runId + '/' + testNum + '.txt'), {}, function (err, data) {

        if (err) {
            next(err);
        } else {

            var lastChar = String(data).slice(-1);
            if (lastChar === ',') {
                data = String(data).substring(0, String(data).length - 1); //strip off trailing comma
            }

            data = '[' + data + ']'; //make parseable by JSON
            // var parsed = JSON.parse(data);
            // console.log('parsed:', parsed);
            res.send(data);
            // res.send(ReactDOMServer.renderToString(<TestFileSuite data={parsed}/>));
        }
    });
});

router.get('/latest', function (req, res, next) {

    //TODO: this should render git branch and commit

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

                var i = 1;

                const childData = [];

                async.each(items, function (item, cb) {

                    fs.readFile(path.resolve(dirName + '/' + item), {}, function (err, result) {

                        var props = {
                            title: item,
                            id: i++,
                            runId: runId,
                            testId: String(path.basename(item, '.txt'))
                        };

                        childData.push(props);

                        cb(null, React.createElement(AccordionSection, props));
                    });
                }, function complete(err, results) {

                    if (err) {
                        next(err);
                    } else {
                        var data = ReactDOMServer.renderToString(React.createElement(
                            Accordion,
                            { title: 'Accordion Title Here' },
                            results
                        ));

                        // res.send(data);

                        res.render('index', {
                            data: data,
                            childData: JSON.stringify(childData)
                        });
                    }
                });
            }
        });
    }
});

router.get('/:runId', function (req, res, next) {

    var outputDir = config.suman_server_config.outputDir;

    if (!outputDir) {
        console.error('no outputDir defined');
        return next(new Error('no outputDir defined'));
    }

    var folder = path.resolve(outputDir);

    var runId = req.params.runId;

    var file = path.resolve(folder, runId, 'temp.html');
    console.log(file);
    res.sendFile(file);
});

module.exports = router;