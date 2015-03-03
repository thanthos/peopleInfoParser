var express = require('express');
var router = express.Router();
var request = require("request");
var cheerio = require('cheerio');
var JSON = require('JSON');
var Staff = require('../models/staff.js');
var HashMap = require('hashmap').HashMap;
var http = require('http');

router.get('/', function (req, res, next) {
	var formDetails = {
		"method" : "POST",
		"action" : "/apps/pparser",
		"id" : "searchStockForm"
	}
	res.render('parser_form', {
		f : formDetails
	});

});

router.post('/', function (req, res, next) {
	var sym = encodeURIComponent(req.body.sym);
	var saveRequired = encodeURIComponent(req.body.submit);

	//Tell the request that we want to fetch data, send the results to a callback function
	request({
		uri : 'http://www.reuters.com/finance/stocks/companyOfficers?symbol=' + sym
	}, function (err, response, body) {
		// Hand the HTML response off to Cheerio and assign that to
		//  a local $ variable to provide familiar jQuery syntax.
		if (err && response.statusCode !== 200) {
			console.log('Unable to get Data from Source.');
			next(err);
		} else {
			var realSymbol = ("" + response.request.path).substring(response.request.path.indexOf("=") + 1);
			if (sym == realSymbol) {
				var $ = cheerio.load(body);
				var dataset = $("#companyNews * .dataTable .dataSmall");
				var map = new HashMap();

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

						if (map.has(instance["Name"])) {

							for (var property in instance) {
								if (instance.hasOwnProperty(property) && 'Name' != property) {
									map.get(instance.Name)[property] = instance[property];
								}
							}
						} else {
							map.set(instance["Name"], instance);
						}

						offset = offset + headerArray.length;
					}
				}
				if (saveRequired != "Search") {
					for (var i in map.values()) {
						try {
							var instance = map.values()[i];
							var s = new Staff();
							s.name = instance["Name"];
							s.age = instance["Age"];
							s.symbol = realSymbol;
							s.since = instance["Age"];
							s.position = instance["Current Position"];
							s.Description = instance["Description"];
							s.lastFiscalCompensation = ((instance["Fiscal Year Total"]) == "--" ? 0 : instance["Fiscal Year Total"]);
							s.optionsHolding = instance["Options"];
							s.optionsValue = instance["Value"];
							s.searchInitiateBy = req.user.id;
							s.foundOn = s.updatedOn = new Date();

							s.save(function (err, staff, numberAffected) {
								if (err) {
									if (!(("" + err).indexOf("E11000") > -1))
										console.log('Error in Saving Staff: ' + err); //TODO: Update Error Handling
								} else {
									console.log(staff.name + " saved(" + numberAffected + ")");
								}
							});
						} catch (err) {
							console.log("Cannot Get UserID from the session. Session Expired or User not login.");
							res.writeHead(302, {
								'location' : '/login'
							});
							res.end();
							return;
						}
					}
				}
				res.setHeader("Content-Type", "application/json; charset=UTF-8 ");
				res.end(JSON.stringify(map.values()));
			} else {
				//Need to consider if it is wise to return an http error code instead.
				console.log("Unable to find " + sym + ". Found " + realSymbol + " instead");
				res.statusCode = 404;
				res.setHeader("Content-Type", "application/json; charset=UTF-8 ");
				res.end(JSON.stringify({
						'sym' : sym,
						'result' : 'unable to find an exact match',
						'found' : realSymbol
					}));
			}
		}
	});

});
module.exports = router;
