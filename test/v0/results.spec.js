// results.spec.js
// Tests the routes and functionalities of results

var superagent = require('superagent')
var expect = require('chai').expect
var faker = require('faker')
var _ = require('underscore')
var validator = require('validator')

var config = require('../../config')(process.env.CONFIG)

// Set the port
var port = config.port

// Set the version.
var version = process.env.VERSION

// Set the address.
var address = "http://localhost:" + port + "/" + version + "/items/"

var item_parameters = {
  source: "Hi there",
  lang: "english",
  targets: ["arabic", "japanese"]
}
var result_params = {
  response: "Nihongo",
  lang: "japanese"
}
var item
var result_id
var redirect_url

describe("After creating the item", function(){
  before(function(done){
    superagent.post(address)
    .send(item_parameters)
    .end(function(err, response){
      item = response.body.item
      done()
    })
  })
  after(function(done){
    superagent.del(address + item.id)
    .end(function(){
      done()
    })
  })

  describe("Result API calls", function(){
    it("POST /items/:item_id/results", function(done) {
      superagent.post(address + item.id + "/results")
      .send(result_params)
      .end(function(err, response){
        var result = response.body.result
        expect(validator.isUUID(result.id)).to.be.true
        result_id = result.id
        expect(result.lang).to.eql(result_params.lang)
        expect(result.response).to.eql(result_params.response)
        done()
      })
    })

    it("GET /items/:item_id/results/:lang/:id", function(done){
      superagent.get(address + item.id + "/results/" + result_params.lang + "/" + result_id )
      .end(function(err, response){
        var result = response.body.result
        expect(result.id).to.eql(result_id)
        expect(result.lang).to.eql(result_params.lang)
        expect(result.response).to.eql(result_params.response)
        done()
      })
    })

    it("GET /items/:item_id/results", function(done){
      superagent.get(address + item.id + "/results?lang=" + result_params.lang)
      .end(function(err, response){
        var mapped_results = response.body.results.map(function(result){
          return result.id
        })
        expect(mapped_results).to.contain(result_id)
        done()
      })
    })
    it("POST  /items/:item_id/results/:id", function(done){
      superagent.post(address + item.id + "/results/" + result_params.lang + "/" + result_id )
      .send({
        response: "Bonjour",
        lang: "french"
      })
      .end(function(err, response){
        var updated_result = response.body.result
        expect(updated_result.response).to.eql("Bonjour")
        expect(updated_result.lang).to.eql("french")
        expect(updated_result.redirect_url).to.eql("/results/french/" +  result_id)
        redirect_url = updated_result.redirect_url
        done()
      })
    })

    describe("and voting", function(){
      before(function(done){
        superagent.post(address + item.id + redirect_url + "/vote")
        .send({
          vote: 5
        })
        .end(function(err, response){
          msg = response.body.msg
          done()
        })
      })
      it("should be successful", function(done){
        expect(msg).to.eql("success")
        done()
      })
      it("should have incremented the vote count by 5", function(done){
        superagent.get(address + item.id + redirect_url + "/vote")
        .end(function(err, response){
          var item_vote_count = response.body.vote.count
          expect(item_vote_count).to.eql(5)
          done()
        })
      })

    })
    it("DELETE /items/:item_id/results/:id", function(done){
      superagent.del(address + item.id + redirect_url )
      .end(function(err, response){
        expect(response.body.msg).to.eql("success")
        done()
      })
    })

  })

})
