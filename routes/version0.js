// version0.js
// Defines the API routes for version 0

var express = require('express')
var router = express.Router()

// Route requiring
var items = require('./v0/items')

// Item routes
router.use('/items', items)


module.exports = router;
