setup:
	npm install

install:
	npm ci
	npm link

run:
	rm -rf temp
	mkdir temp
	./bin/page-loader.js --output temp https://ru.hexlet.io/courses

lint:
	npx eslint .

test:
	npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8

publish:
	npm publish --dry-run
