var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var passport = require('passport');
var expressSession = require('express-session');
var flash = require('connect-flash');
var package_json = require('./package.json');
var bunyan = require('bunyan');
var log = bunyan.createLogger({
		name : 'zeusview.app',
		streams : [{
				path : './logs/app.log',
				level : 'debug'
			}, {
				stream : process.stderr,
				level : "debug"
			}
		]
	});

var dbConfig = require('./db');
var mongoose = require('mongoose');
// Connect to DB
mongoose.connect(dbConfig.url, dbConfig.options);

var app = express();
// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
//configure passport
app.use(expressSession({
		'secret' : 'to live is to learn. what have you learnt today?',
		'name' : 'zview.sid',
		'cookie' : {
			'maxAge' : 3600000
		}
	}));
app.use(passport.initialize());
app.use(passport.session());

// Using the flash middleware provided by connect-flash to store messages in session
// and displaying in templates
app.use(flash());

var routes = require('./routes/index');
var login = require('./routes/login');
var userApps = require('./apps/index');

app.set('env', package_json.env);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
		extended : false
	}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//setup access.logs
var accessLogStream = fs.createWriteStream(__dirname + '/logs/access.log', {
		flag : 'a'
	});
app.use(logger('combined', {
		stream : accessLogStream
	}));

//Route to Application Proper
/*
app.get('/testJade', function (req, res) { //Using this route to test my Jade Templates.
res.render('testJade',{"title":"Template Testing","apps":require('./apps/apps.json'),"user":{"displayName":"test"}});
});
 */
app.use('/login', login);
//Routes after the below root will be check for authentication.
app.use('/', routes); //routes above this are public. These action perform checks to ensure there is an authenticated users
app.use('/apps', userApps); //Applications


// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	log.error(err);
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function (err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message : err.message,
			error : err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message : err.message,
		error : {}
	});
});

module.exports = app;
