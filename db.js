/*
Visit this page for the options available. 
http://mongodb.github.io/node-mongodb-native/2.0/tutorials/connecting/
*/
module.exports = {
	'url' : 'mongodb://thanthos:quinnie71@widmore.mongohq.com:10000/jamesDB',
	//'url' : 'mongodb://<dbuser>:<dbpassword>@novus.modulusmongo.net:27017/<dbName>'
	'options' : {
		'db' : {
			'native_parser' : true,
			'w' : 1,
			'numberOfRetries' : 5
		},
		'server' : {
			'poolSize' : 5,
			'socketOptions' : {
				'keepAlive' : 1
			}
		}
	}
}
