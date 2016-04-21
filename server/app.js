/**
 * Created by denman on 11/30/15.
 */

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var url = require('url');
var _ = require('underscore');
const domain = require('domain');

//create express app
var app = express();

//disable etags
app.disable('etag');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());


//app.use('/public',express.static('public'),{
//    maxage: '2h'
//});

app.use(express.static(path.resolve(__dirname + '/public'), {
    //maxAge: '5h'
}));

//app.use('/results',express.static(path.join(__dirname, 'results'),{
//    maxage: '58h'
//}));

//app.use('/results', express.static('results'));


app.use(function (req, res, next) {

    const d = domain.create();

    d.once('error', function (err) {
        console.error(err.stack);
        res.json({
            error: err.stack
        })
    });

    d.run(function () {
        next();
    })

});


function onEnd(msg) {
    console.log('res has emitted end event, message:', msg);
    var error = new Error('Not real error');
    console.log(error.stack);
}

app.use(function (req, res, next) {
    res.on('end', _.once(onEnd));
    res.on('close', _.once(onEnd));
    next();
});

app.use(function (req, res, next) {
    var requestUrl = req.parsedRequestUrl = url.parse(req.url);
    req.sumanData = {};
    next();
});


app.use('/', require('./lib-es5/routes/index'));
app.use('/users', require('./lib-es5/routes/users'));
app.use('/results', require('./lib-es5/routes/results'));


app.use(function (req, res, next) {

    if (req.sumanData && req.sumanData.success) {
        res.json({success: req.sumanData.success})
    }
    else {
        next();
    }

});


app.use(function (req, res, next) {
    var err = new Error('Not Found - ' + req.originalUrl);
    err.status = 404;
    next(err);
});


if (app.get('env') !== 'production') {
    app.use(function (err, req, res, next) {
        console.log(err.stack);
        res.status(err.status || 500);
        res.json({error: err.stack});
    });
}

app.use(function (err, req, res, next) {
    console.log(err.stack);
    res.status(err.status || 500);
    res.json({error: err.stack});
});


module.exports = app;
