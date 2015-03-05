var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bCrypt = require('bcrypt-nodejs');
var User = require('../models/user.js');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var callBackHost = require('../callbackConfig.json').host;
var util = require('../libs/utils'); 

var isValidPassword = function (user, password) {
	return bCrypt.compareSync(password, user.password);
}

var createHash = function (password) {
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

var isValidPassword = function (user, password) {
	return bCrypt.compareSync(password, user.password);
}

//   Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is
//   serialized and deserialized.
passport.serializeUser(function (user, done) {
	//console.log(user);
	done(null, user);
});

passport.deserializeUser(function (obj, done) {
	//ToDo: Identified the loging mechanism and deserialize the user accordingly.

	//This is use by Local User login.
	//  User.findById(id, function (err, user) {
	//	console.log('deserializing user:', user);
	//  done(err, user);
	//  });
	done(null, obj);
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
			function (err, user) { //user here is the return result.
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

//   Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
		clientID : '854924225793-kse5do7ud0qle7hkhs6ndbm6mrg79hu3.apps.googleusercontent.com',
		clientSecret : 'E00vUB9aFVlAlSrcGuPWmroR',
		callbackURL : "http://" + callBackHost + ":3000/login/google/callback"
	},
		function (accessToken, refreshToken, profile, done) {
		process.nextTick(function () {

			// To keep the example simple, the user's Google profile is returned to
			// represent the logged-in user.  In a typical application, you would want
			// to associate the Google account with a user record in your database,
			// and return that user instead.
			//ToDo to refine the flow
			console.log("GoogleProfile Returned:"+profile.id+"::"+profile.provider+"::"+profile.displayName);
			
			
			User.findOne({
				'provider.id' : profile.id,
				'provider.name' : profile.provider
			},
				function (err, user) {
				// In case of any error, return using the done method
				if (err) {
					return done(err);
				}
				// Username does not exist, log the error and redirect back
				if (!user) {
					console.log('User Not Found. Insert Into Our User Profile');
					var newUser = new User();

					// set the user's local credentials
					newUser.z_id = util.genID(profile.id)
					newUser.displayName = profile.displayName;
					newUser.name.familyName = profile.name.familyName;
					newUser.name.givenName = profile.name.givenName;
					newUser.emails = profile.emails;
					newUser.email = profile.emails[0].value;
					newUser.updated = new Date();
					newUser.provider = [{
							"name" : profile.provider,
							"id" : profile.id,
							"link" : profile._json.link,
							"picture" : profile._json.picture,
							"gender" : profile._json.gender,
							"locale" : profile._json.locale
						}
					];
					// save the user
					newUser.save(function (err) {
						if (err) {
							console.log('Error in Saving user: ' + err);
							throw err;
						}
						console.log('User Registration succesful');
					});
					
					return done(null,{"id":newUser.z_id,"displayName":newUser.displayName, "picture":profile._json.picture });
				}
				console.log("Found"+user.displayName);
				var picture ="";
				for ( var i in user.provider){
					if ( (""+user.provider[i].name).toLowerCase() == 'google') {
						picture = user.provider[i].picture;
					}	
				}
				return done(null, {"id":user.z_id,"displayName":user.displayName,"picture":picture});

			});

		})
	}));

/*
 * Handle the login page rendering
 */
router.get('/', function (req, res, next) {
	res.render('default_login', {
		title : 'Login',
		action : '/login'
	});
});

/*
/* Handle Login POST
 */
router.post('/', passport.authenticate('login', {
		successRedirect : '/apps',
		failureRedirect : '/login',
		failureFlash : true
	}));

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
router.get('/google',
	passport.authenticate('google', {
		scope : ['https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email']
	}),
	function (req, res) {
	// The request will be redirected to Google for authentication, so this
	// function will not be called.
});

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
router.get('/google/callback',
	passport.authenticate('google', {
		failureRedirect : '/login'
	}),
	function (req, res) {
	res.redirect('/apps');
});

module.exports = router;
