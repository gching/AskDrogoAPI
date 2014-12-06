/*
* db.js
* Assists in hiding db and propagating it to routes/models.
* Defaults to local.
*/

var cql = require('node-cassandra-cql');

var config = require('./index')("local")
var cassClient = new cql.Client({hosts: config.cass_db, keyspace: config.cass_keyspace});

function DB(){

}

DB.setDB = function(db){
  DB.db = db || cassClient
}

DB.getDB = function(){
  return DB.db
}

module.exports = DB
