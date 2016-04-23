/**
 * Created by denman on 12/16/15.
 */

var path = require('path');

//config
var config = require('adore')(module, '*suman*', 'server/config/conf');

//core
var express = require('express');
var router = express.Router();


router.get('/',function(req,res){

   res.render('index');

});



module.exports = router;