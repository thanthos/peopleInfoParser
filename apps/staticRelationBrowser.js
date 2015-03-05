var express = require('express');
var router = express.Router();
var request = require("request");
var cheerio = require('cheerio');
var JSON = require('JSON');
var Stock = require('../models/stock.js');
var Staff = require('../models/staff.js');
var fs = require('fs');
var events = require('events');
var outputFile = "./apps/staticGraphs/staticModel.json";
var bunyan = require('bunyan');
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

/*
 * This model stores the necessary information to generate the graph obect for sigma
 * Once the 3 steps are done. The graphs is exported out to the filesystem.
 */
function StaticStockModelGenerator() {
	this.staffDoneFlag = false;
	this.stockDoneFlag = false;
	this.edgeDoneFlag = false;

	this.graphs = {
		nodes : [],
		edges : []
	};

	this.exportGraph = function () {

		fs.writeFile(outputFile, JSON.stringify(self.graphs), function (err) {
			if (err) {
				console.log(err);
			} else {
				console.log("JSON saved to " + outputFile);
			}
		});
	}

	this.checkComplete = function () {
		if (self.staffDoneFlag && self.stockDoneFlag) {

			console.log("Complete");
			self.linkNodes();
			self.exportGraph();
			return true;
		}
		console.log("Num of Node:" + self.graphs.nodes.length);
		console.log("Num of Edge:" + self.graphs.edges.length);
		return false;
	}

	this.setStaff = function (err, nodes) {
		//console.log(self);
		if (err) {
			//process looked up error
			console.log("Find Error " + err);
		} else {
			console.log("Number of Graph Nodes Start:" + self.graphs.nodes.length);
			for (var i in nodes) {
				var doc = nodes[i];
				self.graphs.nodes.push({
					"name" : doc.name,
					"age" : doc.age,
					"id" : i,
					"size" : 2,
					"label" : doc.name + ":" + doc.position,
					"x" : 100 * Math.cos(2 * i * Math.PI / nodes.length),
					"y" : 100 * Math.sin(2 * i * Math.PI / nodes.length),
					"symbol" : doc.symbol,
					"color" : "purple",
					"nodeType" : "staff"
				});
			}
			console.log("Number of Graph Nodes End:" + self.graphs.nodes.length);
		};
		self.staffDoneFlag = true;
		self.checkComplete();
		return;
	}

	this.setStock = function (err, nodes) { //this is the callback for mongoose find function.
		//console.log(self);
		if (err) {
			//process looked up error
			console.log("Find Error " + err);
		} else {
			console.log("Number of Graph Nodes Start:" + self.graphs.nodes.length);
			for (var i in nodes) {
				var doc = nodes[i];
				self.graphs.nodes.push({
					"name" : doc.name,
					"id" : doc.symbol,
					"size" : 2,
					"label" : doc.name,
					"x" : 100 * Math.cos(2 * i * Math.PI / nodes.length) + 5,
					"y" : 100 * Math.sin(2 * i * Math.PI / nodes.length),
					"nodeType" : "stock"
				});
			}
			console.log("Number of Graph Nodes End:" + self.graphs.nodes.length);
		};
		self.stockDoneFlag = true;
		self.checkComplete();
		return;
	}

	this.linkNodes = function () {

		for (var i in self.graphs.nodes) {
			var node = self.graphs.nodes[i];
			if (node.nodeType == 'staff') {
				self.graphs.edges.push({
					"id" : "e" + i,
					"source" : node.symbol,
					"target" : node.id
				});
			}
		}
		return;
	}
	var self = this;
}

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
				log.debug("files "+files);
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
	modelHelper.filename = './apps/staticGraphs/'+req.params.filename+".json";
	log.info("Retriving %s", modelHelper.filename + ".json");
	fs.readFile(modelHelper.filename, modelHelper.getJSONModelFile);
});

router.get('/listModels', function (req, res, next) {
	var modelHelper = new StaticModelHelper(req, res, next);
	modelHelper.dir= './apps/staticGraphs/';
	log.info("Getting File Listings");
	fs.readdir(modelHelper.dir, modelHelper.listJSONModels);
});

/**
 * Deprecated. This is only use to generate the static model. Once.
 */
router.get('/genStaticModel', function (req, res, next) {

	var collection = req.param.collections;
	var generator = new StaticStockModelGenerator();
	console.log("Generating static model");
	console.log(generator);
	Stock.find({
		"exchange" : "Stock Exchange of Singapore"
	}, "symbol name", generator.setStock);
	Staff.find({}, "name age symbol position", generator.setStaff);

	res.end("Generating.....");
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
