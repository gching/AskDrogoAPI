VERSION?= v0
TESTS =  test/$(VERSION)/*.js
CONFIG?= local

server:
	DEBUG=AskDrogoAPI ./bin/www $(CONFIG)

test:
	env CONFIG=$(CONFIG) VERSION=$(VERSION)  mocha --timeout 10000 $(TESTS) --reporter nyan

.PHONY: test
