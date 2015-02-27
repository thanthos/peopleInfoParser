var bCrypt = require('bcrypt-nodejs');

var genID = function (username){
	var timeModfier = ""+(new Date()).getTime();
	return bCrypt.hashSync(username+timeModfier);
};

module.exports.genID = genID;