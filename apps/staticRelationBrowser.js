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
function StaticStockModelGenerator(req, res, next) {
	this.staffDoneFlag = false;
	this.stockDoneFlag = false;
	this.edgeDoneFlag = false;

	this.req = req;
	this.res = res;
	this.next = next;

	this.graphs = {
		nodes : [],
		edges : []
	};
	var self = this;

	this.exportGraph = function () {

		fs.writeFile(outputFile, JSON.stringify(self.graphs), function (err) {
			if (err) {
				log.error("Error writing JSON model to File: %s", outputFile);
			} else {
				log.info("JSON saved to " + outputFile);
			}
		});
	}

	this.checkComplete = function () {
		if (self.staffDoneFlag && self.stockDoneFlag) {

			log.debug("Generator Loading Completed");
			self.linkNodes();
			self.exportGraph();
			return true;
		}
		console.log("Num of Node:" + self.graphs.nodes.length);
		console.log("Num of Edge:" + self.graphs.edges.length);
		return false;
	}

	this.setStaffCallBack = function (err, nodes) { //this is the callback for mongoose find function.
		//console.log(self);
		if (err) {
			//process looked up error
			log.error("Error looking up staff");
		} else {
			log.debug("Number of Graph Nodes Start:" + self.graphs.nodes.length);
			for (var i in nodes) {
				var doc = nodes[i];
				console.log(doc);
				var symbol = [];
				try{
					for (var x = 0; x < doc.symbols.length; x++) {
						symbol.push(doc.symbols[x].symbol);
					}
				}catch (dataError) {
					log.error("Data Integrity Error");
				}
				self.graphs.nodes.push({
					"name" : doc.name,
					"age" : doc.age,
					"id" : i,
					"size" : 0.5,
					"label" : doc.name,
					"symbol" : symbol,
					"x" : 100 * Math.cos(2 * i * Math.PI / nodes.length),
					"y" : 100 * Math.sin(2 * i * Math.PI / nodes.length),
					"color" : "purple",
					"nodeType" : "staff"
				});
			}
			log.debug("Number of Graph Nodes End:" + self.graphs.nodes.length);
		};
		self.staffDoneFlag = true;
		self.checkComplete();
		return;
	}

	this.setStockCallBack = function (err, nodes) { //this is the callback for mongoose find function.
		//console.log(self);
		if (err) {
			//process looked up error
			log.error("Error Looking stock");
		} else {
			log.debug("Number of Graph Nodes Start:" + self.graphs.nodes.length);
			for (var i in nodes) {
				var doc = nodes[i];
				self.graphs.nodes.push({
					"name" : doc.name,
					"id" : doc.symbol,
					"size" : 1,
					"label" : doc.name,
					"x" : 100 * Math.cos(2 * i * Math.PI / nodes.length) + 5,
					"y" : 100 * Math.sin(2 * i * Math.PI / nodes.length),
					"nodeType" : "stock"
				});
			}
			log.debug("Number of Graph Nodes End:" + self.graphs.nodes.length);
		};
		self.stockDoneFlag = true;
		self.checkComplete();
		return;
	}

	this.linkNodes = function () {
		console.log("Establishing the edges." + self.graphs.nodes.length);
		for (var i in self.graphs.nodes) {
			var node = self.graphs.nodes[i];
			console.log("Node: " + node.id);
			if (node.nodeType == 'staff') {
				for (var x = 0; x < node.symbol.length; x++) {
					self.graphs.edges.push({
						"id" : "e" + i + "x" + x,
						"source" : node.symbol[x],
						"target" : node.id
					});
				}
			}

			if (node.nodeType == 'stock') {
				if (node.id != 'SGXL.SI') {
					self.graphs.edges.push({
						"id" : "ss" + i,
						"source" : node.id,
						"target" : 'SGXL.SI'
					});
				}
			}
		}
		return;
	}

	this.mergeStaffCallBack = function (err, results) { //this is the call back to merge duplicate staff.
		//This class is to faciliate the update. It is a cascade as we need to remove first then update the record
		//Due to the index, if the records are not first remove, we will encounter the duplicate key exception.
		//[Starting to look like callback hell.]
		if (err) {
			log.error("Merging Staff: Aggregation Error");
		} else {
			//Retrieved and Process all the duplicates. ie the results are all the duplicate.
			log.info("Merging " + results.length + " records");
			log.debug(results);
			for (var i in results) {
				//Find the records that has duplicate
				Staff.find({
					"name" : results[i]._id.name,
					"age" : results[i]._id.age
				}, function (findErr, dupStaffs) { //expecting more than 1. Else the aggreagate funtion will not have picked it up.
					if (findErr) {
						log.error("Merging Staff: Looking Up Duplicate Record Error");
					} else {
						//dupStaffs will contain 2 or more records.
						var masterRecord = dupStaffs[0];
						var tobeDeleted = [];
						log.debug("Dup Records "+dupStaffs);
						for (var x = 1; x < dupStaffs.length; x++) {
							if (dupStaffs[x].symbols.length > masterRecord.symbols.length) {
								dupStaffs[x] = [masterRecord, masterRecord = dupStaffs[x]][0]; //switch this record and the master record. master record is retain.
							}
							masterRecord.symbols.push(dupStaffs[x].symbols[0]); //the symbol information of the duplicate is transfer into the master.
							log.debug("Id to be deleted "+dupStaffs[x]._id);
							log.debug("Id to be deleted "+dupStaffs[x].id);
							tobeDeleted.push({
								"_id" : dupStaffs[x]._id
							}); //Get the ID of the record to be remove.
						}
						
						

						function _internalHelper(mr) {
							this.record = mr;
							self = this;
							this.callback = function (delErr) {
								if (delErr) {
									log.error("Removing: Delete Duplicate Record Error");
								} else {
									log.info("Records removed. Updating " + self.record._id+":"+self.record.symbols);
									Staff.update({
										_id : self.record._id
									}, {
										symbols : self.record.symbols
									}, {
										"upsert" : true
									}, function (updateError, numberRecordAffected, raw) {
										if (updateError) {
											log.error("Update Record Error");
										} else {
											//Remove Successful.
											log.info("Record " + self.record._id + " updated");
										}
									});
								}
							};
						};
						
						var _internalHelper = new _internalHelper(masterRecord);
						log.debug("Master "+masterRecord);
						log.info("Following Record will be removed " + tobeDeleted);
						Staff.remove({
							"$or" : tobeDeleted
						}, _internalHelper.callback);
					}
				});
			}
		}

	};

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
	var collection = req.param.collections;
	var generator = new StaticStockModelGenerator();
	console.log("Generating static model");

	try {
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
		.exec(generator.mergeStaffCallBack);
	} catch (err) {
		console.log(err);
	}

	Stock.find({
		"exchange" : "Stock Exchange of Singapore"
	}, "symbol name", generator.setStockCallBack);
	Staff.find({}, "name age symbols", generator.setStaffCallBack);
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
