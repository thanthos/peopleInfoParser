var express = require('express');
var router = express.Router();
var request = require("request");
var cheerio = require('cheerio');
var JSON = require('JSON');
var Staff = require('../models/staff.js');
var HashMap = require('hashmap').HashMap;
var http = require('http');
var util = require('../libs/utils'); 
var bunyan = require('bunyan');
var log = bunyan.createLogger({
		name : 'people_parser',
		streams : [{
				path : './logs/app.log',
				level : 'debug'
			}, {
				stream : process.stderr,
				level : "debug"
			}
		]
	});

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
	log.info("people parser inputs: %s %s",sym, saveRequired);
	//Tell the request that we want to fetch data, send the results to a callback function
	request({
		uri : 'http://www.reuters.com/finance/stocks/companyOfficers?symbol=' + sym
	}, function (err, response, body) {
		// Hand the HTML response off to Cheerio and assign that to
		//  a local $ variable to provide familiar jQuery syntax.
		if (err && response.statusCode !== 200) {
			log.error('Unable to get Data from Source.');
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
							log.debug("Parsing for Saving %s",instance); 
							var s = new Staff();
							s.name = instance["Name"];
							s.age = instance["Age"];
							s.symbols = [ {"symbol":realSymbol,
											 "since" :instance["Since"],
											 "position":instance["Current Position"],
											 "Description":instance["Description"],
											 "lastFiscalCompensation":util.removeNonNumbers(instance["Fiscal Year Total"]),
											 "optionsHolding":util.removeNonNumbers(instance["Options"]),
											 "optionsValue":util.removeNonNumbers(instance["Value"])
											 }],
							s.searchInitiateBy = req.user.id;
							s.foundOn = s.updatedOn = new Date();
							log.debug("Saving Staff : %s",s); 
							s.save(function (ee, staff, numberAffected) {
								if (ee) {
									if (!(("" + ee).indexOf("E11000") > -1))
										log.error('Error in Saving Staff: ' + ee); //TODO: Update Error Handling
								} else {
									log.info(staff.name + " saved(" + numberAffected + ")");
								}
							});
						} catch (e) {
							log.warn("Error with parsiing %s",e);
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
				log.warn("Unable to find " + sym + ". Found " + realSymbol + " instead");
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
