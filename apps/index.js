var express = require('express');
var router = express.Router();

var search = require('./search');
var parser = require('./parser');
var appsListing = require('./apps.json');
console.log(appsListing);
router.use('/ssearch', search);
router.use('/pparser', parser);

router.get('/', function(req,res) {
	res.render('appIntro',{title:'Application Index', "apps":appsListing});
	});
 
module.exports = router;