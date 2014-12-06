// items.spec.js
// Tests the routes and functionalities of items

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
var item_id

describe("Items API", function(){
  it("POST /items", function(done){
    superagent.post(address)
    .send(item_parameters)
    .end(function(err, response){
      expect(response.status).to.eql(200)
      item_id = response.body.item.id
      expect(validator.isUUID(item_id)).to.be.true
      expect(response.body.item.source).to.eql(item_parameters.source)
      expect(response.body.item.lang).to.eql(item_parameters.lang)
      expect(response.body.item.targets).to.eql(item_parameters.targets)
      done()
    })
  })

  it("GET /items/:id", function(done){
    superagent.get(address + item_id)
    .end(function(err, response){
      expect(response.status).to.eql(200)
      expect(response.body.item.id).to.eql(item_id)
      expect(response.body.item.source).to.eql(item_parameters.source)
      expect(response.body.item.lang).to.eql(item_parameters.lang)
      expect(response.body.item.targets).to.eql(item_parameters.targets)
      done()
    })
  })

  it("GET /items", function(done){
    superagent.get(address)
    .end(function(err, response){
      expect(response.status).to.eql(200)
      expect(_.isArray(response.body.items)).to.be.true
      mapped_items_id = response.body.items.map(function(item){
        return item.id
      })
      expect(mapped_items_id).to.contain(item_id)
      done()
    })
  })
  // TODO updates as null
  it("POST /items/:id", function(done){
    superagent.post(address + item_id)
    .send({
      source: "New translate",
      targets: ["chinese"]
    })
    .end(function(err, response){
      expect(response.status).to.eql(200)
      expect(response.body.item.id).to.eql(item_id)
      expect(response.body.item.source).to.eql("New translate")
      expect(response.body.item.targets).to.eql(["chinese"])
      done()
    })

  })

  describe("and voting", function(){
    before(function(done){
      superagent.post(address + item_id + "/vote")
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
      superagent.get(address + item_id + "/vote")
      .end(function(err, response){
        var item_vote_count = response.body.vote.count
        expect(item_vote_count).to.eql(5)
        done()
      })
    })

  })

  describe("DELETE /items/:id", function(){
    beforeEach(function(done){
      superagent.del(address + item_id)
      .end(function(err, response){
        msg = response.body.msg
        done()
      })
    })
    it("should be successful and not findable", function(done){
      expect(msg).to.eql("success")
      superagent.get(address)
      .end(function(err, response){
        mapped_items_id = response.body.items.map(function(item){
          return item.id
        })
        expect(mapped_items_id).to.not.contain(item_id)
        done()
      })
    })
  })


})
