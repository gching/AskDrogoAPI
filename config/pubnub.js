// pubnub.js
// stores the curent configuration of pubnub.
var pubnub = require("pubnub")({
  //ssl           : true,  // <- enable TLS Tunneling over TCP
  publish_key   : "pub-c-c8d5cd45-ae07-4818-a5b8-fc981bca1970",
  subscribe_key : "sub-c-fc9b3cd2-7bc4-11e4-8ce0-02ee2ddab7fe"
});



function PUBNUB(){

}

PUBNUB.setNub = function(nub){
  PUBNUB.nub = nub || pubnub
}

PUBNUB.getNub = function(){
  return PUBNUB.nub
}

module.exports = PUBNUB
