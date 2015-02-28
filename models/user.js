var mongoose = require('mongoose');

module.exports = mongoose.model('User', {
		z_id : String, //using z_id so as not to get confuse with the id that is going to be assign by the db
		displayName : String,
		name : {
			familyName : String,
			givenName : String
		},
		emails : [{
				value : String
			}
		],
		email :String,
		updated : Date,
		username : String,
		password : String,
		provider : [{
				name : String,
				id : String,
				link : String,
				picture : String,
				gender : String,
				locale : String
			}
		],
	});

/*
The envisage model.
This is to cater the upate 
{
	id :  < ID > ,
	displayName : 'James Tang',
	name : {
		familyName : 'Tang',
		givenName : 'James'
	},
	emails : [{
			value : 'jamez.tang@gmail.com'
		}
	],
	updated :  < Date - User Non Editable >
	username :  < username >
	password :  < password >
	provider : [{
			name : 'google',
			id : '112723240810698687216',
			link : 'https://plus.google.com/112723240810698687216',
			picture : 'https://lh3.googleusercontent.com/-ESHbLPRJ5Rk/AAAAAAAAAAI/AAAAAAAAEag/BYVGMavEZ6k/photo.jpg',
			gender : 'male',
			locale : 'en'
			lastsync: <date> non editable
		}, {
			name : 'facebook'
		}, {
			name : 'twitter'
		}, {
			name : 'linkedin'
		}
	]
}


{ provider: 'google',
id: '112723240810698687216',
displayName: 'James Tang',
name: { familyName: 'Tang', givenName: 'James' },
emails: [ { value: 'jamez.tang@gmail.com' } ],
_json:{ id: '112723240810698687216',
email: 'jamez.tang@gmail.com',
verified_email: true,
name: 'James Tang',
given_name: 'James',
family_name: 'Tang',
link: 'https://plus.google.com/112723240810698687216',
picture: 'https://lh3.googleusercontent.com/-ESHbLPRJ5Rk/AAAAAAAAAAI/AAAAAAAAEag/BYVGMavEZ6k/ph
oto.jpg',
gender: 'male',
locale: 'en' } }


*/
