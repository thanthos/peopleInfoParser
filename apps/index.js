var express = require('express');
var router = express.Router();

var search = require('./search');
var parser = require('./parser');

router.use('/ssearch', search);
router.use('/pparser', parser);

module.exports = router;