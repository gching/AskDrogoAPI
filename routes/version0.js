// version0.js
// Defines the API routes for version 0

var express = require('express')
var router = express.Router()

// Route requiring
var items = require('./v0/items')
var results = require('./v0/results')

// Item routes
router.use('/items', items)
router.use('/items', results)


module.exports = router;
