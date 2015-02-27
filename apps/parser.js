var express = require('express');
var router = express.Router();
var request = require("request");
var cheerio = require('cheerio');
var JSON = require('JSON');
var HashMap = require('hashmap').HashMap;

router.get('/', function (req, res, next) {
	var formDetails={
		"method":"POST",
		"action":"/apps/pparser",
		"id":"searchStockForm"
	}
	res.render('parser_form', {
		f:formDetails
	});	
	
	
	});
	
	
router.post('/', function (req, res, next) {
	var sym = encodeURIComponent(req.body.sym);
	//Tell the request that we want to fetch data, send the results to a callback function
	request({
		uri : 'http://www.reuters.com/finance/stocks/companyOfficers?symbol='+sym
	}, function (err, response, body) {
		// Hand the HTML response off to Cheerio and assign that to
		//  a local $ variable to provide familiar jQuery syntax.
		if (err && response.statusCode !== 200) {
			console.log('Request error.');
		}

		var $ = cheerio.load(body);

		var dataset = $("#companyNews * .dataTable .dataSmall")
			var map = new HashMap();

		res.setHeader("Content-Type", "application/json; charset=UTF-8 ");

		for (var i = 0; i < dataset.length; i++) {
			console.log("Iteration :" + i);
			//The following values must co-relate. It should.
			var headerArray = $(dataset[i]).find("tr th").map(function (i, o) {
					return $(o).text();
				});
			var dataArray = $(dataset[i]).find("tr td").map(function (i, o) {
					return $(o).text();
				});

			var category = [];
			var offset = 0;

			for (var n = 0; n < dataArray.length / headerArray.length; n++) {
				var instance = {};
				for (var c = 0; c < headerArray.length; c++) {
					instance[headerArray[c]] = dataArray["" + (c + offset)];
				}

				if (map.has(instance["Name"])) {

					for (var property in instance) {
						if (instance.hasOwnProperty(property) && 'Name' != property) {
							map.get(instance.Name)[property] = instance[property];
						}
					}
				}
					else {
						map.set(instance["Name"], instance);
					}
					offset = offset + headerArray.length;
				}
			}
			res.end(JSON.stringify(map.values()));
		});

});
	module.exports = router;
