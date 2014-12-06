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
  translate: "Hi there",
  to: ["arabic", "japanese"]
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
      expect(response.body.item.translate).to.eql(item_parameters.translate)
      expect(response.body.item.to).to.eql({arabic: null, japanese: null})
      done()
    })
  })

  it("GET /items/:id", function(done){
    superagent.get(address + item_id)
    .end(function(err, response){
      expect(response.status).to.eql(200)
      expect(response.body.item.id).to.eql(item_id)
      expect(response.body.item.translate).to.eql(item_parameters.translate)
      expect(response.body.item.to).to.eql(item_parameters.to)
      expect(response.body.item.results).to.eql({arabic: null, japanese: null})
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

  it("POST /items/:id", function(done){
    superagent.post(address + item_id)
    .send({
      translate: "New translate",
      to: ["chinese"]
    })
    .end(function(err, response){
      expect(response.status).to.eql(200)
      expect(response.body.item.id).to.eql(item_id)
      expect(response.body.item.translate).to.eql("New translate")
      expect(response.body.item.to).to.eql(["chinese"])
      expect(response.body.item.results).to.eql({chinese: null})
      done()
    })

  })

  describe("DELETE /items/:id", function(){
    beforeEach(function(done){
      superagent.del(address + item_id)
      .end(function(err, response){
        var msg = response.body.msg
        done()
      })
    })
    it("should be successful", function(done){
      expect(msg).to.eql("success")
      done()
    })
    it("should be not findable", function(done){
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
