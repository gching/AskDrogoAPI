// items.spec.js
// Tests the routes and functionalities of items

var superagent = require('superagent')
var expect = require('chai').expect
var faker = require('faker')
var _ = require('underscore')

var config = require('../../config')(process.env.CONFIG)

// Set the port
var port = config.port

// Set the version.
var version = process.env.VERSION

// Set the address.
var address = "http://localhost:" + port + "/" + version + "/items/"

describe("Items API", function(){
  
})
