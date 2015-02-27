/*
Handles all the global functions which currently include:
1) Login
2) Logout
*/

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/*', function (req, res, next) {
	if (req.isAuthenticated()) {
		console.log("isAuthenticated = True");
		console.log(req.user);
		return next();
	} else {
		// if the user is not authenticated then redirect him to the login page
		console.log("isAuthenticated = False");
		//return next(); //This is for test
		res.redirect('/login');
	}
});

/* Handle Logout */
router.get('/signout', function (req, res) {
	req.logout();
	res.redirect('/login');
});

module.exports = router;
