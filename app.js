/**
 * Created by amills001c on 11/30/15.
 */

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var url = require('url');
var _ = require('underscore');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(express.static(path.join(__dirname, 'public'),{
    maxage: '2h'
}));
//app.use('/results', express.static('results'));


function onEnd(msg){
    console.log('res has emitted end event, message:',msg);
    var error = new Error('Not real error');
    console.log(error.stack);
}

app.use(function(req,res,next){
    res.on('end',_.once(onEnd));
    res.on('close',_.once(onEnd));
    next();
});

app.use(function(req,res,next){
    var requestUrl = req.parsedRequestUrl = url.parse(req.url);
    console.log('requestUrl:', requestUrl);
    req.sumanData = {};
    next();
});


app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/results', require('./routes/results'));


app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
