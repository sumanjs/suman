/**
 * Created by denman on 12/16/15.
 */



//#config
const config = require('adore')(module, '*suman*', 'server/config/conf');

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
const _ = require('underscore');

//#project

//react-components

const HTMLParent = require('../react-components/HTMLParent');
const HTMLAdopterParent = require('../react-components/HTMLAdopterParent');
const TestFileSuite = require('../react-components/TestFileSuite');
const Accordion = require('../react-components/AccordionComp');
const AccordionSection = require('../react-components/AccordionSection');

//#helpers
const helpers = require('./helpers');
const watcher = helpers.watcher;

router.post('/done/:runId', function (req, res, next) {

	var data = body.data;

	try {
		var json = JSON.stringify(data.test);

		if (data.outputPath) {
			fs.appendFileSync(data.outputPath, json += ','); //we write synchronous because we have to ensure data doesn't get malformed in files on disk
			req.sumanData.success = {msg: 'appended data to ' + data.outputPath};
		}
		else {
			console.error(new Error('no outputPath property on data: ' + data).stack);
		}
		next();
	}
	catch (err) {
		next(err);
	}
});

router.post('/watch', function (req, res, next) {

	const paths = req.body.paths;

	const w = watcher.watcher;

	if(w){
		w.add(paths);
	}
	else{
		watcher.initWatcher(paths);
	}

});

module.exports = router;