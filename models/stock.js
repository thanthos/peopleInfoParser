var mongoose = require('mongoose');

module.exports = mongoose.model('Stock', {
		symbol : String,
		name : String,
		exchange: String,
		searchInitiateBy: String,
		foundOn: Date,
		updatedOn: Date
}

/*
The envisage model to capture the following information.
[
{
"Symbol": "CORD.SI",
"Company Name": "Cordlife Group Ltd",
"Prime Exchange": "Stock Exchange of Singapore"
},
{
"Symbol": "CLIFF.PK",
"Company Name": "Cordlife Group Ltd",
"Prime Exchange": "OTC Markets Group"
}
]

*/
