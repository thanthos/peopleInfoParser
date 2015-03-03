var express = require('express');
var router = express.Router();
var request = require("request");
var cheerio = require('cheerio');
var JSON = require('JSON');
var Stock = require('../models/stock.js');

router.get('/', function (req, res, next) {
	var formDetails = {
		"method" : "POST",
		"action" : "/apps/ssearch",
		"id" : "searchStockForm"
	}
	res.render('search_form', {
		f : formDetails
	});
});

router.post('/', function (req, res, next) {
	var searchContext = encodeURIComponent(req.body.searchStockSymbol);
	var saveRequired = encodeURIComponent(req.body.submit);

	console.log("search.js?query=" + searchContext);

	//http://www.reuters.com/finance/stocks/lookup?searchType=any&search=cordlife%20limited
	request({
		uri : 'http://www.reuters.com/finance/stocks/lookup?searchType=any&search=' + searchContext
	}, function (err, response, body) {
		// Hand the HTML response off to Cheerio and assign that to
		//  a local $ variable to provide familiar jQuery syntax.
		if (err && response.statusCode !== 200) {
			console.log('Unable to get Data from Source.');
			next(err);
		} else {
			var $ = cheerio.load(body);
			var dataset = $("#content * .module .moduleBody .dataTable");
			var datasetJSON = [];
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
					if (saveRequired != "Search") {
						var s = new Stock();
						s.symbol = instance['Symbol'];
						s.name = instance['Company Name'];
						s.exchange = instance['Prime Exchange'];
						try {
							s.searchInitiateBy = req.user.id;
						} catch (e) {
							//Chances are the session has expire.
							console.log("Cannot Get UserID from the session. Session Expired or User not login.");
							res.writeHead(302, {
								'location' : '/login'
							});
							res.end();
							return;
						}
						s.foundOn = s.updatedOn = new Date();
						s.save(function (err, stock, numberAffected) {
							if (err) {
								if (!(("" + err).indexOf("E11000") > -1))
									console.log('Error in Saving stock: ' + err); //TODO: Update Error Handling
							} else {
								console.log(stock.symbol + " saved(" + numberAffected + ")");
							}
						});
					}
					offset = offset + headerArray.length;
				}
			}
			res.setHeader("Content-Type", "application/json; charset=UTF-8 ");
			res.end(JSON.stringify(datasetJSON));
		}
	});
});

module.exports = router;
