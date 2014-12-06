// config/index.js
// Defines the server parameters given the environment declared.
// Defaults to local.

var config = {
    local: {
        mode: 'local',
	      port: 3000,
        cass_db: ["127.0.0.1"],
        cass_keyspace: "askdrogo-local"
    },
    staging: {
        mode: 'staging',
        port: 4000,
        cass_db: ["127.0.0.1"],
        cass_keyspace: "askdrogo-staging"
    },
    production: {
        mode: 'production',
        port: 5000,
        cass_db: ["127.0.0.1"],
        cass_keyspace: "askdrogo-production"
    }
}
module.exports = function(mode) {
    return config[mode || process.argv[2] || 'local'] || config.local;
}
