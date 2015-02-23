var express = require('express');
var router = express.Router();
var request = require("request");
var cheerio = require('cheerio');
var JSON = require('JSON');

router.get('/', function (req, res, next) {
	res.render('search', {
		title : 'Company Search',
		action : '/apps/ssearch'
	});
});

router.post('/', function (req, res, next) {
	var searchContext = encodeURIComponent(req.body.searchStockSymbol);
	
	console.log("This is the search strings "+searchContext);
	
	//http://www.reuters.com/finance/stocks/lookup?searchType=any&search=cordlife%20limited
	request({
		uri : 'http://www.reuters.com/finance/stocks/lookup?searchType=any&search='+searchContext
	}, function (err, response, body) {
		// Hand the HTML response off to Cheerio and assign that to
		//  a local $ variable to provide familiar jQuery syntax.
		if (err && response.statusCode !== 200) {
			console.log('Request error.');
		}

		var $ = cheerio.load(body);
		var dataset = $("#content * .module .moduleBody .dataTable");
		var datasetJSON = [];

		res.setHeader("Content-Type", "application/json; charset=UTF-8 ");

		for (var i = 0; i < dataset.length; i++) {
			//The following values must co-relate. It should.
			var headerArray = $(dataset[i]).find("tr th").map(function (i, o) {
					return $(o).text();
				});
			var dataArray = $(dataset[i]).find("tr td").map(function (i, o) {
					return $(o).text();
				});

			var offset = 0;

			for (var n = 0; n < dataArray.length / headerArray.length; n++) {
				var instance = {};
				for (var c = 0; c < headerArray.length; c++) {
					instance[headerArray[c]] = dataArray["" + (c + offset)];
				}
				datasetJSON.push(instance);
				offset = offset + headerArray.length;
			}
		}
		res.end(JSON.stringify(datasetJSON));

	});
});

module.exports = router;
