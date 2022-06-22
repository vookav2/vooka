#!/bin/bash

init(){
	yarn install
	yarn build
	touch config.json
}
copyFiles() {
	cp ecosystem.config.js ./build
	cp scripts/build.sh ./build
	cp package.json ./build
	cp yarn.lock ./build
	cp config.json ./build
	tar -zcvf build.tar.gz ./build
}

init
copyFiles

exit 0