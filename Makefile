#!make
.DEFAULT_GOAL := clean build run
EXECUTABLE=YourPlaceBeta
ifeq ($(OS), Windows_NT)
PS=C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
GO=C:\Program Files\Go\bin\go.exe
NODE=C:\Program Files\nodejs
export PATH:=$(NODE);$(PATH)
else
OS=$(cat /etc/lsb-release)
GO=$(which go)
NPX=$(which npx)
NPM=$(which npm)
NODE=$(which node)
endif

install:
ifeq ($(OS), Windows_NT)
	choco install -y --force nodejs
	npm install package.json
else
	npm install package.json
endif

build:
	npx webpack --config src/typescript/webpack.config.js
ifeq ($(OS), Windows_NT)
	IF EXIST target\ del /F /Q target\*
	$(GO) build -o target\YourPlaceBeta.exe main.go
else
	rm -f target/*
	go build -o target/YourPlaceBeta main.go
endif

linuxbuild:
	$(NPX) webpack --config src/typescript/webpack.config.js
	export GOARCH=amd64
	export GOOS=linux
	$(GO) build -o target/YourPlace main.go

clean:
ifeq ($(OS), Windows_NT)
	$(PS) Remove-Item target/* -Force -Recurse -ErrorAction SilentlyContinue
	$(GO) clean
else
	rm -rf target/
	go clean
endif

run:
ifeq ($(OS), Windows_NT)
	target/YourPlaceBeta.exe
else
	cp config.yaml target/config.yaml
	./target/YourPlaceBeta
endif