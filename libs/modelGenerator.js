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
			}, {
				path : './logs/modelGenerator.log',
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
	 *   [{_id:{name:"someone",age:20},total:2},
	 *	 {_id:{name:"anotherone",age:21},total:2}]
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
		for (var i in self.duplicates) {
			Staff.find({
				"name" : self.duplicates[i]._id.name,
				"age" : self.duplicates[i]._id.age
			}, function (err, results) {
				if (err) { //Process the found results
					log.warn("Error looking up %s %s", self.duplicates[i]._id.name, self.duplicates[i]._id.age);
				} else {
					//Merge the duplicate
					log.debug("Found Results %s", JSON.stringify(results));
					var masterRec = results[0];
					for (var x = 1; x < results.length; x++) {
						try {
							if (masterRec.symbols.length < results[x].symbols.length) { //execute swap
								results[x] = [masterRec, masterRec = results[x]][0];
								log.debug("Master Record Swapping Position");
							}
							masterRec.symbols.push(results[x].symbols[0]);
							Staff.remove({
								"name" : results[x].name,
								"age" : results[x].age,
								"symbols.symbol" : results[x].symbols[0].symbol
							}, function (e) {
								if (e) {
									log.debug("Error Removing Record :%s", e);
								} else {
									log.debug("Record Removed");
								}
							});
							Staff.update({
								"_id" : masterRec._id
							}, {
								symbols : masterRec.symbols,
								updatedOn : new Date()
							}, function (updateErr, num, raw) {
								if (updateErr) {
									log.warn("Error Updating Duplicate Staff");
								} else {
									log.info("Duplicate Staff. Successfully Merge Symbols.");
								}
							});
						} catch (e) {
							log.error("Issue merging %s", masterRec);
						}

					}

				}
			});
		};
		//Move on to the next regardless if procesed successfully. Else it will be reflected in the next round of generation.
		ee.emit("duplicateProcessed");
	};
	this.processStockCallBack = function (err, docs) {
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
							"x" : 50 * Math.cos(2 * i * Math.PI / docs.length) + 5,
							"y" : 60 * Math.sin(2 * i * Math.PI / docs.length),
							"nodeType" : "stock",
							"color" : color
						});
				}
				log.debug("Loaded %s stocks.", docs.length);
				ee.emit("populatedNodes");
			} catch (findError) {
				log.error("Error Looking up Stocks. %s", findError);
				ee.emit("generationCompleted");
			}

		}
	}
	this.processStocks = function () {
		//Populate the stocks portion of the nodes.
		log.info("Populating Stocks.");
		Stock.find({
			"exchange" : "Stock Exchange of Singapore"
		}, "symbol name",
			self.processStockCallBack);
	};
	this.processStaffsCallBack = function (err, docs) {
		if (err) {
			log.error("Error Retriving Staffs Collections");
			ee.emit("generationCompleted");
		} else {
			try {
				for (var i in docs) {
					var doc = docs[i];
					var symbols = [];
					if (doc.symbols.length < 1) {
						log.warn("Record Quality Issue. %s %s", doc.name, doc.age);
						continue;
					}
					try {
						for (var x = 0; x < doc.symbols.length; x++) {
							//only put the symbol info
							symbols.push(doc.symbols[x].symbol);
						}
					} catch (ee) {
						log.error("Error Processing Staff Association. %s. Error: %s", doc.name, ee);
						symbols = [];
					}
					self.graph.nodes.push({
						"name" : doc.name,
						"age" : doc.age,
						"id" : i,
						"size" : 0.15,
						"label" : doc.name,
						"symbol" : symbols,
						"x" : 120 * Math.cos(2 * i * Math.PI / docs.length),
						"y" : 100 * Math.sin(2 * i * Math.PI / docs.length),
						"color" : "purple",
						"nodeType" : "staff"
					});
				}
				log.info("Loaded %s Staff node", docs.length);
				ee.emit("populatedStaff");
			} catch (findError) {
				log.error("Error Prcessing Staff. %s", findError);
				ee.emit("generationCompleted");
			}
		}
	}
	this.processStaffs = function () {
		log.info("Populating Staffs.");
		Staff.find({}, "name age symbols", self.processStaffsCallBack);
	};
	this.establishEdges = function () {
		log.info("Linking Nodes. Establishing Edges (%s)", self.graph.nodes.length);
		try {
			for (var i in self.graph.nodes) {
				var node = self.graph.nodes[i];
				log.debug("Node: %s :: %s", node.id, node.name);
				if (node.nodeType == 'staff') {
					for (var x = 0; x < node.symbol.length; x++) {
						var edge = {
							"id" : "e" + i + "x" + x,
							"source" : node.symbol[x],
							"target" : node.id,
							"label" : "works for"
						};
						if (node.symbol.length > 1) {
							edge.type = 'curvedArrow';
						} //else just leave it as default.

						self.graph.edges.push(edge);
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
			log.info("Model Completed. N:%s E:%s", self.graph.nodes.length, self.graph.edges.length);
			ee.emit("modelCompleted");
		} catch (e) {
			log.error("Error: Generic %s", e);
			ee.emit("generationCompleted");
		}
	};
	this.exportToFile = function () {
		log.info("Model Ready to Export");
		try {
			fs.writeFile(self.outputFile, JSON.stringify(self.graph), function (err) {
				if (err) {
					log.error("Error to File: %s", self.outputFile);
				} else {
					log.info("Model Saved to %s", self.outputFile);
				}
			});
		} catch (e) {
			log.error("Error to File: %s", self.outputFile);
		}
		ee.emit("generationCompleted");
	};
	this.generationCompleted = function () {
		log.info("Generation Completed. Set state to NOT STARTED");
		try {

			//because this event might not be triggered. All the time. So clean up.
			if (ee.listeners("duplicateFound").length > 0) {
				ee.removeAllListeners("duplicateFound")
			}
				if (ee.listeners("duplicateProcessed").length > 0) {
				ee.removeAllListeners("duplicateProcessed")
			}
				if (ee.listeners("populatedNodes").length > 0) {
				ee.removeAllListeners("populatedNodes")
			}
				if (ee.listeners("populatedStaff").length > 0) {
				ee.removeAllListeners("populatedStaff")
			}
				if (ee.listeners("modelCompleted").length > 0) {
				ee.removeAllListeners("modelCompleted")
			}
			
			log.debug("Listeners Length : %s %s %s %s %s %s", ee.listeners("duplicateFound").length,
				ee.listeners("duplicateProcessed").length,
				ee.listeners("populatedNodes").length,
				ee.listeners("populatedStaff").length,
				ee.listeners("modelCompleted").length,
				ee.listeners("generationCompleted").length);
		} catch (e) {
			log.error("Error Checking on Listner: %s", e);
		}
		self.state = "NOT STARTED";
	};

	//this are convenience method.
	this.startCallBack = function (err, results) {
		if (err) {
			log.error("Finding Duplicate: DB Aggregate Error");
			ee.emit("generationCompleted", self);
			//hand over to another method
		} else {
			//process results.
			log.info("Found Possible %s duplicates ", results.length);
			if (results.length == 0) {
				log.debug("Skipping: Goto Populating");
				ee.emit("duplicateProcessed", self);
				//hand over to another method

			} else {
				for (var i in results) {
					var res = results[i];
					self.duplicates.push(results[i]);
				}
				ee.emit("duplicateFound", self);
				//hand over to another method
			}
		}
	}

	this.start = function () {

		var arraysOfListenersforGenerator = ee.listeners("generationCompleted");
		if (arraysOfListenersforGenerator != null) {
			log.info("Number of Generation Completed Listeners %s", arraysOfListenersforGenerator.length);
			if (arraysOfListenersforGenerator.length > 0) {
				throw "Generation Already In Progress. ";
			}
		}

		ee.once("duplicateFound", this.processDuplicates)
		.once("duplicateProcessed", this.processStocks)
		.once("populatedNodes", this.processStaffs)
		.once("populatedStaff", this.establishEdges)
		.once("modelCompleted", this.exportToFile)
		.once("generationCompleted", this.generationCompleted);

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
		.exec(this.startCallBack);
		return;
	}
}

module.exports = ModelGenerator;
