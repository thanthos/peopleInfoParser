var express = require('express');
var router = express.Router();

var search = require('./search');
var parser = require('./parser');

router.use('/ssearch', search);
router.use('/pparser', parser);

router.get('/', function(req,res) {
	res.render('appIndex',{title:'Application Index',apps:[{"name":"Stock Search","Link":"/apps/ssearch"},{"name":"People Search","Link":"/apps/pparser"}]});
	});

module.exports = router;