# Initial setup 
setup: 
	npm install -g pxt
	pxt target microbit
	pxt install

build:
	PXT_FORCE_LOCAL=1 pxt build


deploy:
	PXT_FORCE_LOCAL=1 pxt deploy

test:
	pxt test
