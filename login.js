var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy   = require('passport-local').Strategy;
var bCrypt = require('bcrypt-nodejs');
var User = require('./models/user.js');


var isValidPassword = function (user, password) {
	return bCrypt.compareSync(password, user.password);
}

var createHash = function(password){
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

var isValidPassword = function (user, password) {
	return bCrypt.compareSync(password, user.password);
}

passport.serializeUser(function (user, done) {
	console.log('serializing user: ');
	console.log(user);
	done(null, user._id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		console.log('deserializing user:', user);
		done(err, user);
	});
});

passport.use('login', new LocalStrategy({
		passReqToCallback : true
	},
		function (req, username, password, done) {
		console.log("Executing Login Strategy");
		// check in mongo if a user with username exists or not
		User.findOne({
			'username' : username
		},
			function (err, user) {
			// In case of any error, return using the done method
			if (err)
				return done(err);
			// Username does not exist, log the error and redirect back
			if (!user) {
				console.log('User Not Found with username ' + username);
				return done(null, false, req.flash('message', 'User Not found.'));
			}
			// User exists but wrong password, log the error
			if (!isValidPassword(user, password)) {
				console.log('Invalid Password');
				return done(null, false, req.flash('message', 'Invalid Password')); // redirect back to login page
			}
			// User and password both match, return user from done method
			// which will be treated like success
			return done(null, user);
		});

	}));

/*
* Handle the login page rendering
*/
router.get('/', function (req, res, next) {
	res.render('login', {
		title : 'Login',
		action : '/login'
	});
});

/*
/* Handle Login POST 
*/
router.post('/', passport.authenticate('login', {
		successRedirect : '/home.html',
		failureRedirect : '/',
		failureFlash : true
	}));

module.exports = router;
