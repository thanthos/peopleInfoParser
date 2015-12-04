'use strict';

var JSON = require('JSON');
var Stock = require('../models/stock.js');
var Staff = require('../models/staff.js');
var fs = require('fs');
var EventEmitter = require("events").EventEmitter;
var bunyan = require('bunyan');
var log = bunyan.createLogger({
		name : 'modelGenerator',
		streams : [{
				stream : process.stdout,
				level : "debug"
			}
		]
	});

/**
 * This is a fix model that will generate a graph based on the the stock and staff model.
 * It is assume that if the staff have the same name and age, they are the same person.
 */
var ee = new EventEmitter();

var ModelGenerator = function () {

	//Keep tracks of the data in database which are considered duplicates.e
	/*
	 *	Duplicate data example:
	 *   [{id:{name:"someone",age:20},total:2},
	 *	 {id:{name:"anotherone",age:21},total:2}]
	 */
	this.duplicates = [];
	this.tobeUpdated = [];

	//This is the sigma model which we need to generate.
	this.graph = {
		nodes : [],
		edges : []
	};

	var self = this;
	this.state = "NOT STARTED";
	this.outputFile = "./apps/staticGraphs/staticModel.json";

	//Process the duplicate staff records. Merge the symbols into the master records. The master records, is define as the one with more information.
	this.processDuplicates = function () {
		log.info("Duplicate Found:: Processing %", self.duplicates.length);
		for (var i in self.duplicates) {
			Staff.find({
				"name" : self.duplicates[i].name,
				"age" : self.duplicates[i].age
			}, function (err, results) {
				if (err) {
					log.warn("Error looking up %s %s", self.duplicates[i].name, self.duplicates[i].age);
				} else {
					//Merge the duplicate
					var masterRec = results[0];
					for (var x = 1; x < results.length; x++) {
						if (masterRec.symbols.length < staff[x].symbols.length) { //execute swap
							staff[x] = [masterRec, masterRec = results[x]][0];
						}
						masterRec.symbols.push(results[x].symbols);
						Staff.remove({
							"name" : staff[x].name,
							"age" : staff[x].age,
							"symbols.symbol" : staff[x].symbols[0].symbol
						});
						Staff.update({
							"_id" : masterRec._id
						}, {
							symbols : masterRec.symbols
						}, function (updateErr, num, raw) {
							if (updateErr) {
								log.warn("Error Updating Duplicate Staff");
							} else {
								log.info("Duplicate Staff. Successfully Merge Symbols.");
							}
						});
					}

				}
			});
		}
		//Move on to the next regardless if procesed successfully. Else it will be reflected in the next round of generation.
		ee.emit("duplicateProcessed");
	};
	this.processStocks = function () {
		//Populate the stocks portion of the nodes.
		log.info("Populating Stocks."+arguments.length);
		Stock.find({
			"exchange" : "Stock Exchange of Singapore"
		}, "symbol name",
			function (err, docs) {
			if (err) {
				log.error("Error Retrieving Stocks for Population.");
				ee.emit("generationCompleted");
			} else {
				try {
					for (var i in docs) {
						var doc = docs[i];
						var availcolor = ["blue", "green", "black", "darkgreen", "indianred"];
						var color = availcolor[(Math.random() * 5) | 0]
							if (doc.symbol == 'SGXL.SI')
								color = "Yellow";
							self.graph.nodes.push({
								"name" : doc.name,
								"id" : doc.symbol,
								"size" : 0.8,
								"label" : doc.name,
								"x" : 50 * Math.cos(2 * i * Math.PI / nodes.length) + 5,
								"y" : 60 * Math.sin(2 * i * Math.PI / nodes.length),
								"nodeType" : "stock",
								"color" : color
							});
					}
					log.debug("Loaded %s stocks.", docs.length);
					ee.emit("populatedNodes");
				} catch (findError) {
					log.error("Error Looking up Stocks %s", findError);
					ee.emit("generationCompleted");
				}
			}
		});
	};
	this.processStaffs = function () {
		log.info("Populating Staffs.");
		Staff.find({}, "name age symbols", function (err, docs) {
			if (err) {
				log.error("Error Retriving Staffs");
				ee.emit("generationCompleted");
			} else {
				for (var i in docs) {
					var doc = docs[i];
					var symbols = [];
					if (doc.symbols.length < 1) {
						log.warn("Record Quality Issue. %s %s", doc.name, doc.age);
						continue;
					}
					for (var x = 0; x < doc.symbols.length; x++) {
						//only put the symbol info
						symbols.push(doc.symbols[x].symbol);
					}
					self.graph.nodes.push({
						"name" : doc.name,
						"age" : doc.age,
						"id" : i,
						"size" : 0.35,
						"label" : doc.name,
						"symbol" : symbol,
						"x" : 110 * Math.cos(2 * i * Math.PI / nodes.length),
						"y" : 120 * Math.sin(2 * i * Math.PI / nodes.length),
						"color" : "purple",
						"nodeType" : "staff"
					});
				}
				log.info("Loaded %s Staff node", docs.length);
				ee.emit("populatedStaff");
			}
		});
	};
	this.establishEdges = function () {
		log.info("Linking Nodes. Establishing Edges");
		try {
			for (var i in self.graph.nodes) {
				var node = graph.nodes[i];
				log.debug("Node: " + node.id);
				if (node.nodeType == 'staff') {
					for (var x = 0; x < node.symbol.length; x++) {
						self.graph.edges.push({
							"id" : "e" + i + "x" + x,
							"source" : node.symbol[x],
							"target" : node.id,
							"label" : "works for"
						});
					}
				}

				if (node.nodeType == 'stock') {
					if (node.id != 'SGXL.SI') {
						self.graph.edges.push({
							"id" : "ss" + i,
							"source" : node.id,
							"target" : 'SGXL.SI'
						});
					}
				}
			}
			ee.emit("modelCompleted");
			log.info("Model Completed. N:%s E:%s", graph.nodes.length, graph.edges.length);
		} catch (e) {
			log.error("Error: Generic");
			ee.emit("generationCompleted");
		}
	};
	this.exportToFile = function () {
		log.info("Model Ready to Export");
		try {
			fs.writeFile(self.outputFile, JSON.stringify(self.graphs), function (err) {
				if (err) {
					log.error("Error to File: %s", self.outputFile);
				} else {
					log.info("Model Saved to %s", self.outputFile);
				}
			});
		} catch (e) {
			log.error("Error to File: %s", self.outputFile);
		}
		ee.emit("generationCompleted.");

	};
	this.generationCompleted = function () {
		self.state = "NOT STARTED";
	};

	ee.on("duplicateFound", this.processDuplicates)
	.on("duplicateProcessed", this.processStocks)
	.on("populatedNodes", this.processStaffs)
	.on("populatedStaff", this.establishEdges)
	.on("modelCompleted", this.exportToFile)
	.on("generationCompleted", this.generationCompleted);

	this.callBack = function (err,results){
		console.log(self);
		if (err) {
				log.error("Finding Duplicate: DB Aggregate Error");
				
				ee.emit("generationCompleted", self);
			} else {
				//process results.
				log.info("Found Possible %s duplicates ", results.length);

				if (results.length == 0) {
					log.debug("Skipping: Goto Populating");
					ee.emit("duplicateProcessed", self);
					
				} else {
					for (var i in results) {
						var res = results[i];
						log.debug("Duplicate %s : %s", i, results[i]._id);
						self.duplicates.push(results[i]);
					}
					log.debug("Skipping: Got to Populating");
					ee.emit("duplicateFound", self );
				}
				//hand over to another method
				
			}
			log.debug("End Aggregation Function");
	}
	
	this.start = function () {
		log.debug("Current State %s", this.state);
		if (self.state != "NOT STARTED")
			throw "Currently Generating";
		self.state = "STARTED";
		//Get the list of duplicates.
		Staff.aggregate()
		.group({
			_id : {
				name : "$name",
				age : '$age'
			},
			total : {
				$sum : 1
			}
		})
		.match({
			total : {
				$gt : 1
			}
		})
		.exec(this.callBack);

/*		{
			
		}); */
	}
}
module.exports = ModelGenerator;
