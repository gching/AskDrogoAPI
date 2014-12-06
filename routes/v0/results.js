// v0/results.js
// Routes for interacting with results.

var express = require('express')
var router = express.Router()
var cass = require('node-cassandra-cql')
var DB =  (require('../../config/db')).getDB();
var default_read = cass.types.consistencies.one
var default_write = cass.types.consistencies.any
var quorem = cass.types.consistencies.quorem

var _ = require("underscore")

/**** Schema *****
CREATE TABLE results(
  item_id timeuuid,
  lang text,
  id timeuuid,
  response text,
  PRIMARY KEY((item_id, lang, id))
);
*/

var permitted_params = function(params){
  var permitted = {
    response: params.response,
    lang: params.lang
  }
  return permitted
}

// Index
router.get('/:item_id/results', function(req, res, next){
  var lang = req.query.lang
  if (!lang) return next(new Error("Requires language query param in url (lang)."))
  var query = "SELECT * FROM results where item_id=? and lang=?"
  var params = [req.params.item_id, lang]
  DB.executeAsPrepared(query, params, default_read, function(e, results){
    if (e) return next(e)
    res.send({ results: results.rows})
  })
})

// Create
router.post('/:item_id/results', function(req, res, next) {
  var result_id = cass.types.timeuuid()

  var params = permitted_params(req.body)

  // Compile query and execute
  var query = "INSERT into results (item_id, lang, id, response) values (?, ?, ?, ?)"
  var query_params = [req.params.item_id, params.lang, result_id, params.response]

  DB.executeAsPrepared(query, query_params, default_write, function(err){
    if(err) return next(err)
    // Set the id in the params and return it
    params.id = result_id
    res.send({ result: params })
  })
})


// Update
router.post('/:item_id/results/:lang/:id', function(req, res, next){

  // Get permitted params
  var params = permitted_params(req.body)

  // Destry the old and create the new
  var delete_query = "DELETE FROM results WHERE item_id=? and lang=? and id=?"
  var delete_params =  [req.params.item_id, req.params.lang, req.params.id]

  DB.executeAsPrepared(delete_query, delete_params, default_write, function(err){
    if(err) return next(err)

    // Now insert!
    // Compile query and execute
    var query = "INSERT into results (item_id, lang, id, response) values (?, ?, ?, ?)"
    var query_params = [req.params.item_id, params.lang, req.params.id, params.response]

    DB.executeAsPrepared(query, query_params, default_write, function(err){
      if(err) return next(err)
      // Set the id in the params and return it
      params.id = req.params.id
      // Set the new redirect url
      params.redirect_url = "/results/" + params.lang + "/" + params.id
      res.send({ result: params })
    })
  })
})

// Show
router.get('/:item_id/results/:lang/:id', function(req, res, next){
  // Prepare query and execute
  var query = "SELECT * FROM results WHERE item_id=? and lang=? and id=?"
  var params = [req.params.item_id, req.params.lang, req.params.id]
  DB.executeAsPrepared(query, params, default_read, function(error, resp){
    if(error) return next(error)
    var result = resp.rows[0]
    if(!result) {
      res.send({msg: "Error: Result not found."})
    } else {
      res.send({result: result})
    }
  })
})

// Post for vote
router.post('/:item_id/results/:lang/:id/vote', function(req, res, next){
  // Increment the vote by updating
  var query = "UPDATE votes SET count = count + ? WHERE id=?"
  var query_params = [{value: req.body.vote, hint: "counter"}, req.params.id]
  DB.executeAsPrepared(query, query_params, quorem, function(err, response){
    if (err) return next(err)
    res.send({msg: "success"})
  })
})

// Get for vote
router.get('/:item_id/results/:lang/:id/vote', function(req, res, next){
  // Get the vote by its id
  var query = "SELECT * FROM votes WHERE id=?"
  var query_params = [req.params.id]

  DB.executeAsPrepared(query, query_params, quorem, function(err, response){
    if (err) return next(err)
    res.send({vote : {count: response.rows[0].count.low } })
  })
})


// Delete
router.delete('/:item_id/results/:lang/:id', function(req, res, next){

  // Prepare query and delete
  var delete_query = "DELETE FROM results WHERE item_id=? and lang=? and id=?"
  var delete_params =  [req.params.item_id, req.params.lang, req.params.id]

  DB.executeAsPrepared(delete_query, delete_params, default_write, function(err, result){
    if(err) return next(err)
    res.send((result) ? {msg: "success"} : {msg: "error"})
  })
})



module.exports = router
