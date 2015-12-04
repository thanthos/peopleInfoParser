/*
Handles all the global functions which currently include:
1) Login
2) Logout
*/

var express = require('express');
var router = express.Router();
var bunyan = require('bunyan');
var log = bunyan.createLogger({
		name : 'zeusview.login',
		streams : [{
				path : './logs/login.log',
				level : 'info'
			}, {
				stream : process.stderr,
				level : "debug"
			}
		]
	});

/* GET home page. */
router.get('/*', function (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	} else {
		// if the user is not authenticated then redirect him to the login page
		log.warn("Unauthorized: Not Login for: %s",req.path);
		//return next(); //This is for test
		res.redirect('/login');
	}
});

/* Handle Logout */
router.get('/signout', function (req, res) {
	log.info("User %s %s Logged Out",req.user.id, req.user.displayName);
	req.logout();
	res.redirect('/login');
});

module.exports = router;
