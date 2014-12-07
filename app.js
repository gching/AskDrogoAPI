var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override')
var session = require('express-session')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy

var cors = require('cors')
var cass = require('node-cassandra-cql')
var DB = require('./config/db')
var PUBNUB = require('./config/pubnub')
// Config file that sets certain parameters given the environment
var config = require('./config')();

var app = express();

// Middleware
app.use(logger('dev')); // Logs
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb'}));
app.use(methodOverride()); // looks for DELETE and PUT verbs in hidden fields
app.use(cors()) // Cross Origin
//app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));

// Setup database
var cassClient = new cass.Client({hosts: config.cass_db, keyspace: config.cass_keyspace});
DB.setDB(cassClient)

// Initialize PUBNUB
PUBNUB.setNub()


// Sessions and passport bootstrap for user login
app.use(session({secret: '32e91d5fc9fbee268f5ad0f17e7dfb8543f6ba878581afb7513f0d3819059c66b22a72c181eb5977b040c595a1f2a3153d244c29d1ed18fd28e783405ce33ed9', saveUninitialized: true, resave: true}));
app.use(passport.initialize());
app.use(passport.session());


/*  Routes   */

// Versioning
var VERSIONS = {
  'version0': '/v0'
}
// Route to display versions
app.get('/', function (req, res){
  res.json(VERSIONS)
})
// For each version, use their given routes.
for (var k in VERSIONS) {
  app.use(VERSIONS[k], require('./routes/' + k));
}


/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        var error_msg = {
          message: err.message,
          error: err
        }
        console.log(error_msg)
        res.send(error_msg);
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: {}
    });
});


module.exports = app;
