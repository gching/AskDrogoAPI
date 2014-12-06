VERSION?= v0
TESTS =  test/$(VERSION)/*.js
CONFIG?= local

test:
	env CONFIG=$(CONFIG) VERSION=$(VERSION)  mocha --timeout 10000 $(TESTS)

	.PHONY: test
