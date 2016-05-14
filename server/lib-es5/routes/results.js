'use strict';

/**
 * Created by denman on 12/16/15.
 */

//#config
var config = require('adore')(module, '*suman*', 'server/config/conf');

//#core
var fs = require('fs');
var os = require('os');
var path = require('path');
var async = require('async');

//#npm
var React = require('react');
var ReactDOMServer = require('react-dom/server');

var express = require('express');
var router = express.Router();
var _ = require('underscore');

//#project

//react-components

var HTMLParent = require('../react-components/HTMLParent');
var HTMLAdopterParent = require('../react-components/HTMLAdopterParent');
var TestFileSuite = require('../react-components/TestFileSuite');
var Accordion = require('../react-components/AccordionComp');
var AccordionSection = require('../react-components/AccordionSection');

//#helpers
var helpers = require('./helpers/index');
// const findSumanServer = require('../../lib/find-suman-server');

router.get('/', function (req, res, next) {

    var outputDir = config.suman_home_dir;

    if (!outputDir) {
        console.error('no outputDir defined');
        return next(new Error('no outputDir defined'));
    }

    var project = ['Rover', 'Viper', 'Falcor', 'Brokerify'];
    var runBy = ['Mike', 'Alex', 'Jim'];
    var runAt = [new Date('December 31 1999 23:59:59'), new Date('December 4, 1995 03:24:00'), new Date('December 17, 1995 09:24:00')];

    fs.readdir(path.resolve(outputDir), function (err, items) {

        if (err) {
            next(err);
        } else {
            items = items.map(function (item) {

                return React.createElement(
                    'div',
                    null,
                    React.createElement(
                        'tr',
                        null,
                        React.createElement(
                            'td',
                            null,
                            _.sample(project).toString()
                        ),
                        React.createElement(
                            'td',
                            null,
                            React.createElement(
                                'a',
                                { href: '/results/' + item },
                                item
                            )
                        ),
                        React.createElement(
                            'td',
                            null,
                            _.sample(runBy).toString(),
                            ' '
                        ),
                        React.createElement(
                            'td',
                            null,
                            ' ',
                            _.sample(runAt).toString(),
                            ' '
                        )
                    )
                );
            });

            res.send(ReactDOMServer.renderToString(React.createElement(
                'html',
                null,
                React.createElement(
                    'head',
                    null,
                    React.createElement('link', { href: 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css',
                        rel: 'stylesheet' }),
                    React.createElement('link', { rel: 'stylesheet',
                        href: 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap-theme.min.css' }),
                    React.createElement('link', { href: 'https://cdnjs.cloudflare.com/ajax/libs/normalize/3.0.3/normalize.css',
                        rel: 'stylesheet' }),
                    React.createElement('link', { rel: 'stylesheet',
                        href: '/styles/suman-styles.css' })
                ),
                React.createElement(
                    'body',
                    null,
                    React.createElement(
                        'div',
                        null,
                        React.createElement(
                            'div',
                            null,
                            React.createElement('img', { id: 'suman_logo', 'class': 'col-md-4', src: '/images/suman-main-logo.png' })
                        ),
                        React.createElement(
                            'table',
                            { className: 'table text-center' },
                            React.createElement(
                                'thead',
                                { className: 'text-center' },
                                React.createElement(
                                    'th',
                                    { className: 'text-center' },
                                    ' Project '
                                ),
                                React.createElement(
                                    'th',
                                    { className: 'text-center' },
                                    ' Run ID'
                                ),
                                React.createElement(
                                    'th',
                                    { className: 'text-center' },
                                    ' Run by user'
                                ),
                                React.createElement(
                                    'th',
                                    { className: 'text-center' },
                                    ' Run Date'
                                )
                            ),
                            React.createElement(
                                'tbody',
                                { className: 'text-center' },
                                items
                            )
                        )
                    )
                )
            )));
        }
    });
});

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
    var timestamp = body.timestamp;
    var outputDir = config.suman_home_dir;

    if (!outputDir) {
        console.error('no outputDir defined');
        return next(new Error('no outputDir defined'));
    }

    var outputPath = path.resolve(outputDir + '/' + timestamp + '/temp.html');

    fs.writeFile(outputPath, rendered, function (err) {
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
    var timestamp = body.timestamp;

    try {
        var outputDir = config.suman_home_dir;

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

    //TODO: this should render git branch and commit

    var outputDir = config.suman_home_dir;

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

        req.runId = runId;
        req.folder = folder;
        next();
    }
}, getRunId);

function getRunId(req, res, next) {

    var folder = req.folder;
    var runId = req.runId;

    var dirName = path.resolve(folder + '/' + runId);

    fs.readdir(dirName, function (err, items) {

        if (err) {
            next(err);
        } else {
            var j;

            (function () {

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

                j = 1;


                var childData = [];

                async.each(items, function (item, cb) {

                    fs.readFile(path.resolve(dirName + '/' + item), {}, function (err, data) {

                        if (err) {
                            cb(err);
                        } else {

                            var lastChar = String(data).slice(-1);
                            if (lastChar === ',') {
                                data = String(data).substring(0, String(data).length - 1); //strip off trailing comma
                            }

                            data = JSON.parse('[' + data + ']'); //make parseable by JSON

                            var topLevelDescribe = null;

                            for (var i = 0; i < data.length; i++) {
                                var val = data[i];
                                if (val.testId === 0) {
                                    topLevelDescribe = val;
                                    break;
                                }
                            }

                            var fileName = String(path.basename(item, '.txt'));

                            var props = {
                                title: 'TestSuite: ' + topLevelDescribe.desc + ' @' + fileName,
                                id: j++,
                                runId: runId,
                                testId: fileName
                            };

                            childData.push(props);

                            cb(null, React.createElement(AccordionSection, props));
                        }
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
            })();
        }
    });
}

router.get('/:runId/:testId', function (req, res, next) {

    var outputDir = config.suman_home_dir;

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

router.get('/:runId', function (req, res, next) {

    var outputDir = config.suman_home_dir;

    if (!outputDir) {
        console.error('no outputDir defined');
        return next(new Error('no outputDir defined'));
    }

    var folder = path.resolve(outputDir);

    req.runId = req.params.runId;
    req.folder = folder;
    next();
}, getRunId);

module.exports = router;