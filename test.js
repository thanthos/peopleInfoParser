var mongoose = require('mongoose');
var dbConfig = require('./db');
mongoose.connect(dbConfig.url);
var User = require('./models/user.js');


User.findOne({
				'provider.name' : 'google'
				},function (err, user){
			if(err) {
				console.log(err);
			}
			if(!user) {
				console.log("User not found");
			}else{
				console.log(user);
			}
			
			});