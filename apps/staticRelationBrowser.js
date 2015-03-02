var express = require('express');
var router = express.Router();
var request = require("request");
var cheerio = require('cheerio');
var JSON = require('JSON');

router.get('/', function (req, res, next) {
	var formDetails={
		//TODO
	}
	res.render('neo4jBrowserInstance1', {
		f:formDetails
	});	
});

router.post('/', function (req, res, next) {
	//TODO
});

module.exports = router;
