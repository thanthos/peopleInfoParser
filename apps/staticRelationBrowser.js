var express = require('express');
var router = express.Router();
var request = require("request");
var cheerio = require('cheerio');
var JSON = require('JSON');
var Stock = require('../models/stock.js');
var Staff = require('../models/staff.js');
var fs = require('fs');
var events = require('events');
var outputFile = "./apps/staticModel.json";

/*
 * This model stores the necessary information to generate the graph obect for sigma
 * Once the 3 steps are done. The graphs is exported out to the filesystem.
 */
function StaticModel() {
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
					"x" : 100 * Math.cos(2 * i * Math.PI / nodes.length),
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

router.get('/', function (req, res, next) {
	var formDetails = {
		//TODO
	}
	res.render('neo4jBrowserInstance1', {
		f : formDetails

	});
});

router.get('/staticModel.json', function (req, res, next) {
	var model = require('./staticModel.json');
	res.setHeader("Content-Type", "application/json; charset=UTF-8 ");
	res.end(JSON.stringify(model));
});

router.get('/genStaticModel', function (req, res, next) {

	var collection = req.param.collections;
	var model = new StaticModel();
	console.log("Generating static model");
	console.log(model);
	Stock.find({
		"exchange" : "Stock Exchange of Singapore"
	}, "symbol name", model.setStock);
	Staff.find({}, "name age symbol position", model.setStaff);

	res.end("Generating.....");
});

router.post('/', function (req, res, next) {
	//TODO
});

module.exports = router;
