// v0/users.js
// Routes for interacting with users.

var express = require('express')
var router = express.Router()
var cass = require('node-cassandra-cql')
var DB =  require('../../config/db').getDB();
var pubnub = require('../../config/pubnub').getNub();
var validator = require('validator')
var pass = require('pwd');

var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy

var default_read = cass.types.consistencies.one
var default_write = cass.types.consistencies.any
var quorem = cass.types.consistencies.quorem

var _ = require("underscore")


// Permitted params
var permitted_params = function(request_params){
  var permitted = {
    email: request_params.email || null,
    password: require_params.password || null
  }
  return permitted
}

passport.use('local-login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
},
function(req, email, password, callback) {
  // Try to find the user
  DB.executeAsPrepared("SELECT * FROM users WHERE email=?", [email], function(err, response){
    if(err) return callback(err)

    // Check if it exists, if it doesnt, error
    if (response.rows.length == 0){
      return callback(null, false, {message: "User " + email + " does not exist."})
    }
    var potential_user = response.rows[0]
    // Check if password matches
    pass.hash(password, potential_user.salt, function(err, hash){
      if(err || hash != potential_user.password) return callback(null, false, {message: "Invalid password"})

      // All passed, now callback with actual user
      return callback(null, potential_user)
    })

  })
}))


passport.serializeUser(function(user, done) {
  done(null, user.email);
});

passport.deserializeUser(function(email, done) {
  DB.executeAsPrepared("SELECT email, name, langs, FROM users WHERE email=?", [email], function(err, response){
    done(err, response.rows[0])
  })
});

router.post('/', function(req, res, next) {
  passport.authenticate('local-login', function(err, user, info) {
    if (err) { return next(err); }
    // Redirect if it fails

    if (!user) { return res.send(info); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      // Redirect if it succeeds
      return res.send({message: "success"});
    });
  })(req, res, next);
});

                /*
                router.post('/:data_source_id/login', passport.authenticate('local-datasource-login'), function(req, res, next){
                res.send({message:"success"})
              })
              */
module.exports = router
