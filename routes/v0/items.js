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
    target text,
    source text,
    lang text,
    results text,
    voting text,
    targets set<text>,
    PRIMARY KEY(id, target)
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
  // Compile partition key insert by going through each target and inserting each target language by batch
  var queries = []
  _.each(params.targets, function(target){
    queries.push({
      query: "INSERT into items (id, target, source, lang, targets) values (?, ?, ?, ?, ?)",
      params: [item_id, target, params.source, params.lang, params.targets]
    })
  })

  DB.executeBatch(queries, default_write, function(err){
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
  // First get all the targets current in the database by executing a read
  DB.executeAsPrepared("SELECT targets FROM items WHERE id=? LIMIT 1", [id], default_read, function(err, response){
    if (err) return next(err)
    // Go through each of the targets, old or new ones by unioning the read targets and request targets
    // and do an update / insert.
    var old_targets = response.rows[0].targets
    var queries = []

    // Update old ones with the new targets by adding them in cql
    _.each(old_targets, function(target){
      queries.push({
        query: "UPDATE items SET source=?, lang=?, targets = targets + ? WHERE id=? and target=?",
        params: [params.source, params.lang, params.targets, id, target]
      })
    })

    // Insert the new ones by differencing them and doing an insert with the combined
    var new_targets = _.difference(params.targets, old_targets)
    var all_targets = _.union(new_targets, old_targets)
    _.each(new_targets, function(target){
      queries.push({
        query: "INSERT into items (id, target, source, lang, targets) values (?, ?, ?, ?, ?)",
        params: [id, target, params.source, params.lang, all_targets]
      })
    })

    DB.executeBatch(queries, default_write, function(err){
      if(err) return next(err)
        // Set the id in the params and return it
        params.id = req.params.id
        res.send({ item: params })
      })
  })
})

// Show
router.get('/:id', function(req, res, next){
  // Prepare query and execute
  var query = "SELECT * FROM items WHERE id=? LIMIT 1"
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
