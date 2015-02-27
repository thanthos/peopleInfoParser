var express = require('express');
var router = express.Router();

var search = require('./search');
var parser = require('./parser');
var appsListing = require('./apps.json');

router.use('/ssearch', search);
router.use('/pparser', parser);

router.get('/', function(req,res) {
	res.render('default_application_main',{title:'ZeusView: Applications Index', "apps":appsListing,"user":req.user});
	});
 
module.exports = router;