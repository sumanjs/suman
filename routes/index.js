/**
 * Created by amills001c on 12/16/15.
 */

var path = require('path');

//config
var config = require('univ-config')(module, '*suman*', 'config/conf');

//core
var express = require('express');
var router = express.Router();
var ejs = require('ejs');



router.get('/',function(req,res){

   res.render('index');

});




module.exports = router;