.PHONY: test

clean:
	rm -rf coverage dist .nyc_output

test: 
	npm run lint
	nyc mocha --timeout 5000

prepublish: clean
	babel src --out-dir dist

watch:
	mocha --require babel-register --watch --timeout 5000

dev: link
	./node_modules/.bin/babel src --out-dir dist --watch
link:
	npm link