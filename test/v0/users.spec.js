// users.spec.js
// Tests the routes and functionalities of users

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
var address = "http://localhost:" + port + "/" + version + "/users/"
var login = "http://localhost:" + port + '/' + version + "/login"

var usr_par = {
  email: "gavinchingy@gmail.com",
  name: "Gavin Ching",
  password: "derpsafafafsa",
  langs: ["a", "b", "c"]
}
var usr_id

describe("Users API", function(){
  it("POST /users", function(done){
    superagent.post(address)
    .send(usr_par)
    .end(function(err, response){
      expect(response.status).to.eql(200)
      var user = response.body.user
      expect(user.email).to.eql(usr_par.email)
      expect(user.name).to.eql(usr_par.name)
      expect(user.langs).to.eql(usr_par.langs)
      done()
    })
  })

  it("GET /users/:id", function(done){
    superagent.get(address + usr_par.email)
    .end(function(err, response){
      expect(response.status).to.eql(200)
      var user = response.body.user
      expect(user.email).to.eql(usr_par.email)
      expect(user.name).to.eql(usr_par.name)
      expect(user.langs).to.eql(usr_par.langs)
      done()
    })
  })

  it("GET /users", function(done){
    superagent.get(address)
    .end(function(err, response){
      expect(response.status).to.eql(200)
      expect(_.isArray(response.body.users)).to.be.true
      mapped_users_id = response.body.users.map(function(user){
        return user.email
      })
      expect(mapped_users_id).to.contain(usr_par.email)
      done()
    })
  })

  // TODO updates as null
  it("POST /users/:id", function(done){
    superagent.post(address + usr_par.email)
    .send({
      name: "Derp",
      langs: ["derp"]
    })
    .end(function(err, response){
      expect(response.status).to.eql(200)
      var user = response.body.user
      expect(user.name).to.eql("Derp")
      expect(user.langs).to.eql(["derp"])
      done()
    })

  })

  describe("and logging in", function(){
    before(function(done){
      superagent.post(login)
      .send({
        email: usr_par.email,
        password: usr_par.password
      })
      .end(function(e, res){
        msg = res.body.message
        done()
      })
    })

    it('should be successful', function(done){
      expect(msg).to.eql('success')
      done()
    })
  })

  describe("DELETE /users/:id", function(){
    beforeEach(function(done){
      superagent.del(address + usr_par.email)
      .end(function(err, response){
        msg = response.body.msg
        done()
      })
    })
    it("should be successful and not findable", function(done){
      expect(msg).to.eql("success")
      superagent.get(address)
      .end(function(err, response){
        mapped_users_id = response.body.users.map(function(usr){
          return usr.email
        })
        expect(mapped_users_id).to.not.contain(usr_par.email)
        done()
      })
    })
  })


})
