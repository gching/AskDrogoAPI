// v0/items.js
// Routes for interacting with items.

var express = require('express')
var router = express.Router()
var cass = require('node-cassandra-cql')
var DB =  (require('../../config/db')).getDB();
var default_read = cass.types.consistencies.one
var default_write = cass.types.consistencies.any

var _ = require("underscore")

/**** Schema *****
  CREATE TABLE item(
    id timeuuid,
    source text,
    lang text,
    voting text,
    targets set<text>,
    PRIMARY KEY(id)
  );
*/


// Permitted params
var permitted_params = function(request_params){
  var permitted = {
    id: request_params.id || null,
    source: request_params.source || null,
    lang: request_params.lang || null,
    targets: request_params.targets || null
  }
  return permitted
}

// Index
router.get('/', function(req, res, next){
  DB.execute("SELECT * FROM items", default_read, function(e, results){
  if (e) return next(e)
    res.send({ items: results.rows})
  })
})

// Create
router.post('/', function(req, res, next) {
  var item_id = cass.types.timeuuid()

  var params = permitted_params(req.body)

  // Compile query and execute
  var query = "INSERT into items (id, source, lang, targets) values (?, ?, ?, ?)"
  var query_params = [item_id, params.source, params.lang, params.targets]

  DB.executeAsPrepared(query, query_params, default_write, function(err){
    if(err) return next(err)
    // Set the id in the params and return it
    params.id = item_id
    res.send({ item: params })
  })



})


// Update
router.post('/:id', function(req, res, next){

  // Get permitted params
  var params = permitted_params(req.body)

  var id = req.params.id

  // Compile query and execute
  var query = "UPDATE items SET source=?, lang=?, targets = targets + ? WHERE id=?"
  var query_params = [params.source, params.lang, params.targets, id]

  DB.executeAsPrepared(query, query_params, default_write, function(err){
    if(err) return next(err)
    // Set the id in the params and return it
    params.id = id
    res.send({ item: params })
  })
})

// Show
router.get('/:id', function(req, res, next){
  // Prepare query and execute
  var query = "SELECT * FROM items WHERE id=?"
  var id = req.params.id
  DB.executeAsPrepared(query, [req.params.id], default_read, function(error, result){
    if(error) return next(error)
    var item = result.rows[0]
    if(!item) {
      res.send({msg: "Error: Item not found."})
    } else {
      res.send({item: item})
    }
  })
})

// Delete
router.delete('/:id', function(req, res, next){
  // Prepare query and delete
  var query = "DELETE FROM items WHERE id=?"
  var id = req.params.id
  DB.executeAsPrepared(query, [id], default_write, function(err, result){
    if (err) return next(err)
    res.send((result)?{msg:'success'}:{msg:'error'})
  })
})



module.exports = router
