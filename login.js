var express = require('express');
var router = express.Router();
var request = require("request");
var cheerio = require('cheerio');
var JSON = require('JSON');
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;

router.get('/', function (req, res, next) {
	res.render('login', {
		title : 'Login',
		action : '/login'
	});
});

router.post('/', function (req, res,next) {
	console.log("Posting Login");
	res.end("Login");
});

module.exports = router;