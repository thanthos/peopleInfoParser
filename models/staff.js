var mongoose = require('mongoose');

module.exports = mongoose.model('staff', {
		name : String,
		age : Number,
		symbol : String,
		since : Number,
		position : String,
		description : String,
		lastFiscalCompensation : Number,
		optionsHolding : Number,
		optionsValue : Number,
		searchInitiateBy : String,
		foundOn : Date,
		updatedOn : Date
	});

/*
The envisage model to capture the following information.

{
"Name": "Choon Hou Ho",
"Age": "43",
"Since": "2011",
"Current Position": "Non-Executive Non-Independent Chairman of the Board",
"Description": "Dr. Ho Choon Hou is Non-Executive Non-Independent Chairman of the Board of Cordlife Group Ltd since June 16, 2011. Dr. Ho Choon Hou was first appointed as a Director of the Company in June 2011 and was last re-elected on 18 October 2013. Dr. Ho is currently an Executive Director at Southern Capital Group Limited, a private equity firm, where he is responsible for the origination and execution of investments. Dr. Ho graduated with a Bachelor of Medicine & Bachelor of Surgery (Honours) from The University of Sheffield, as well as a Master of Medicine (Surgery) from the National University of Singapore. He also obtained his Master of Business Administration (Honours) from The University of Chicago (The Graduate School of Business). Dr. Ho is an Independent Director of both Advanced Holdings Ltd. and Mclean Bhd, and the Non-Independent Non-Executive Director of StemLife Berhad, an associate company of Cordlife Group Limited.",
"Fiscal Year Total": "--",
"Options": "0",
"Value": "0"
},
*/
