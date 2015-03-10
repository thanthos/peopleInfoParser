var bCrypt = require('bcrypt-nodejs');

module.exports = {
	"genID" : function (username) {
		var timeModfier = "" + (new Date()).getTime();
		return bCrypt.hashSync(username + timeModfier);
	},
	"removeNonNumbers" : function (str) {
		return str.replace(/[^\d.]/g, '');
	}
}
