#!/bin/bash

install() {
	yarn install --production
	rm -rf package.json
	rm -rf yarn.lock
}

install