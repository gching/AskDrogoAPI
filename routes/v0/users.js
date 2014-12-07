// v0/users.js
// Routes for interacting with users.

var express = require('express')
var router = express.Router()
var cass = require('node-cassandra-cql')
var DB =  require('../../config/db').getDB();
var pubnub = require('../../config/pubnub').getNub();
var validator = require('validator')
var pass = require('pwd');
var default_read = cass.types.consistencies.one
var default_write = cass.types.consistencies.any
var quorem = cass.types.consistencies.quorem

var _ = require("underscore")

/**** Schema *****
CREATE TABLE users(
id timeuuid,
email string,
name string,
langs string
PRIMARY KEY(id)
);
*/


// Permitted params
var permitted_params = function(request_params){
  var permitted = {
    email: request_params.email || null,
    password: request_params.password || null,
    name: request_params.name || null,
    langs: request_params.langs|| null
  }
  return permitted
}

// Index
router.get('/', function(req, res, next){
  DB.executeAsPrepared("SELECT email, name, langs FROM users", default_read, function(e, results){
    if (e) return next(e)
    // Map over and unstringify langs
    var users_mapped = results.rows.map(function(user){
      var new_user = user
      new_user.langs = JSON.parse(new_user.langs)
      return new_user
    })
    res.send({ users: users_mapped})
  })
})

  // Create
  router.post('/', function(req, res, next) {

    var params = permitted_params(req.body)

    if(!validator.isEmail(params.email)){
      return next(new Error("The email is not an email!"))
    }
    // Compile query and execute
    var query = "INSERT into users (email, password, salt, name, langs) values (?, ?, ?, ?, ?)"
    // Hash the password and salt
    pass.hash(params.password, function(err, salt, hash){
      if(err) return next(new Error("User could not be created."))
      var query_params = [params.email, hash, salt, params.name, JSON.stringify(params.langs)]
      DB.executeAsPrepared(query, query_params, default_write, function(err){
        if(err) return next(err)
          // Set the id in the params and return it

          res.send({user: _.omit(params, "password")})
        })
      })

    })


    // Update
    router.post('/:email', function(req, res, next){

      // Get permitted params
      var params = permitted_params(req.body)

      if(req.params.email && !validator.isEmail(req.params.email)){
        return next(new Error("The email is not an email!"))
      }


      // Compile query and execute
      var query = "UPDATE users SET name=?, langs=? WHERE email=?"
      var query_params = [ params.name, JSON.stringify(params.langs), req.params.email]

      DB.executeAsPrepared(query, query_params, default_write, function(err){
        if(err) return next(err)
          // Set the id in the params and return it
          params.email = req.params.email

          res.send({ user: params })
        })
      })

      // Show
      router.get('/:email', function(req, res, next){
        // Prepare query and execute
        var query = "SELECT email, name, langs FROM users WHERE email=?"
        var email = req.params.email
        DB.executeAsPrepared(query, [email], default_read, function(error, result){
          if(error) return next(error)
            var user = result.rows[0]

            if(!user) {
              res.send({msg: "Error: Item not found."})
            } else {
              user.langs = JSON.parse(user.langs)
              res.send({user: user})
            }
          })
        })
// Delete
router.delete('/:email', function(req, res, next){
  // Prepare query and delete
  var query = "DELETE FROM users WHERE email=?"
  var email = req.params.email
  DB.executeAsPrepared(query, [email], default_write, function(err, result){
    if (err) return next(err)

      res.send((result)?{msg:'success'}:{msg:'error'})
    })
  })



  module.exports = router
