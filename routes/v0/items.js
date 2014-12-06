// v0/items.js
// Routes for interacting with items.

var express = require('express')
var router = express.Router()
var cass = require('node-cassandra-cql')
var DB =  (require('../../config/db')).getDB();

// Index
router.get('/', function(req, res, next){
  DB.execute("SELECT id, user_id, team_id, name, description, start_page, app_data FROM applications",      cass.types.consistencies.one, function(e, results){
  if (e) return next(e)
    res.send(results.rows)
  })
})

// Create
router.post('/', function(req, res, next) {
var application_id = cass.types.uuid()


var params = {
id: application_id,
user_id: req.body.user_id || null,
team_id: req.body.team_id || null,
name: req.body.name || null,
description: req.body.description || null,
start_page:  req.body.start_page || null,
app_data: req.body.app_data || null
}

DB.execute("INSERT into applications (id, user_id, team_id, name, description, start_page, app_data) values (?, ?, ?, ?, ?, ?, ?)",
[params.id, params.user_id, params.team_id, params.name, params.description, params.start_page, JSON.stringify(params.app_data)],
cass.types.consistencies.any,
function(err, result){
if (err) return next(err)
res.send(params)
})

})


// Update
router.post('/:id', function(req, res, next){
// Grab the json
json_req = req.body
// Go through each key value pair and Update given the new string query
var cql_query = "UPDATE applications SET "
// Go through the json and push them to array, then join them by comma and add to query
var cql_params = []
var cql_params_values = []
for (var key in json_req){
cql_params.push(key + "=?")
if (key == "app_data"){
cql_params_values.push(JSON.stringify(json_req[key]))
} else {
cql_params_values.push(json_req[key])
}
}
cql_query += cql_params.join(',') + " WHERE id=?"
// Add in id to end of cql_params_values
cql_params_values.push(req.params.id)
// Execute
DB.execute(cql_query, cql_params_values, cass.types.consistencies.any, function(err, result){
if (err) return next(err)
res.send((result)?{msg:'success'}:{msg:'error'})
})
})

// Show
router.get('/:id', function(req, res, next){
DB.execute("SELECT id, user_id, team_id, name, description, start_page, app_data FROM applications WHERE id=?", [req.params.id], cass.types.consistencies.one, function(e, result){
if (e) return next(e)
app_result = result.rows[0]

// if app_result undefined, then return msg error
if (!app_result){
  res.send({msg: "Application cannot be found."})
} else {
  res.send({
    id: app_result.id,
    user_id: app_result.user_id,
    team_id: app_result.team_id,
    name: app_result.name,
    description: app_result.description,
    start_page: app_result.start_page,
    app_data: JSON.parse(app_result.app_data)
  })
}
})
})

// Delete
router.delete('/:id', function(req, res, next){
DB.execute("DELETE FROM applications WHERE id=?", [req.params.id], cass.types.consistencies.any, function(err, result){
if (err) return next(err)
  res.send((result)?{msg:'success'}:{msg:'error'})
})
})



module.exports = router
