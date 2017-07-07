
clean:
	rm -rf coverage dist

tests: 
	npm run lint
	mocha

prepublish: clean
	babel src --out-dir dist

watch:
		mocha --require babel-register --watch --timeout 5000
