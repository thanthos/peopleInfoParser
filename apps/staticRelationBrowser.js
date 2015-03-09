var express = require('express');
var router = express.Router();
var request = require("request");
var cheerio = require('cheerio');
var JSON = require('JSON');
var Stock = require('../models/stock.js');
var Staff = require('../models/staff.js');
var ModelGenerator = require("../libs/modelGenerator");
var fs = require('fs');
var bunyan = require('bunyan');
var outputFile = "./apps/staticGraphs/staticModel.json";
var log = bunyan.createLogger({
		name : 'zeusview.app',
		streams : [{
				path : './logs/app.log',
				level : 'info'
			}, {
				stream : process.stderr,
				level : "debug"
			}
		]
	});


function StaticModelHelper(req, res, next) {
	this.req = req;
	this.res = res;
	this.next = next;
	this.dir = "";
	this.filename = "";

	var self = this;
	log.debug("StaticModelHelper created");
	this.getJSONModelFile = function (err, data) {
		if (err) {
			log.error("Error loading File");
			self.next("Unable to Open File " + self.filename); //Error Loading file.
		} else {
			try {
				var staticModel = JSON.parse(data); //hopefully it is not too big a file.
				self.res.setHeader("Content-Type", "application/json; charset=UTF-8 ");
				self.res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
				self.res.setHeader("Pragma", "no-cache");
				self.res.setHeader("Expires", "0");
				self.res.end(JSON.stringify(staticModel));
				log.info("staticModel generated");
			} catch (parseErr) {
				log.error("Error Parsing JSON file " + self.filename);
				self.next("Error Parsing JSON file " + self.filename);

			}
		}
	}

	this.listJSONModels = function (err, files) {
		if (err) {
			log.error("Error Scanning File in: %s", self.dir);
			self.next("Error Scanning File in " + self.dir); //Error listing Directory
		} else {
			try {
				self.res.setHeader("Content-Type", "application/json; charset=UTF-8 ");
				self.res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
				self.res.setHeader("Pragma", "no-cache");
				self.res.setHeader("Expires", "0");
				self.res.end(JSON.stringify(files));
				log.debug("files " + files);
				log.info("Directory Listing Generated.");
			} catch (e) {
				log.error(e);
				self.next(e);
			}
		}
	}
}
  
router.get('/staticModel/:filename.json', function (req, res, next) {
	var modelHelper = new StaticModelHelper(req, res, next);
	modelHelper.filename = './apps/staticGraphs/' + req.params.filename + ".json";
	log.info("Retriving %s", modelHelper.filename + ".json");
	fs.readFile(modelHelper.filename, modelHelper.getJSONModelFile);
});

router.get('/listModels', function (req, res, next) {
	var modelHelper = new StaticModelHelper(req, res, next);
	modelHelper.dir = './apps/staticGraphs/';
	log.info("Getting File Listings");
	fs.readdir(modelHelper.dir, modelHelper.listJSONModels);
});

/**
 * Deprecated. This is only use to generate the static model. Once.
 */
router.get('/genStaticModel', function (req, res, next) {
	var generator = new ModelGenerator();
	try{
		generator.start();	
		}catch (e) {
			log.error(e);
		}
	res.end("Generating....");
});

router.post('/', function (req, res, next) {
	//TODO
});

router.get('/', function (req, res, next) {
	var formDetails = {
		//TODO
	}
	res.render('neo4jBrowserInstance1', {
		f : formDetails

	});
});

module.exports = router;
