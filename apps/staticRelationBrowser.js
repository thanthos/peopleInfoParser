var express = require('express');
var router = express.Router();
var request = require("request");
var cheerio = require('cheerio');
var JSON = require('JSON');
var Stock = require('../models/stock.js');


router.get('/', function (req, res, next) {
	var formDetails={
		//TODO
	}
	res.render('neo4jBrowserInstance1', {
		f:formDetails
	});	
});

router.get('/staticModel.json', function (req, res, next) {
	console.log("Here");
	var appsListing = require('./apps.json');
	console.log("Here "+appsListing);
	var model = require('./staticModel.json');
	console.log("Here "+model);
	res.setHeader("Content-Type", "application/json; charset=UTF-8 ");
	console.log("Here");
	res.end(JSON.stringify(model));
});


router.post('/', function (req, res, next) {
	//TODO
});

module.exports = router;
