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
NPX=$(which npx)
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
	npm install package.json
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
	$(GO) build -o target/YourPlaceBeta main.go

clean:
ifeq ($(OS), Windows_NT)
	$(PS) -Command "& {Remove-Item target/ -Force -Recurse -ErrorAction SilentlyContinue}"
	$(PS) -Command "& {Remove-Item node_modules/ -Force -Recurse -ErrorAction SilentlyContinue}"
	$(PS) -Command "& {Remove-Item src/www/js/ -Force -Recurse -ErrorAction SilentlyContinue}"
	$(GO) clean
else
	rm -rf target/
	rm -rf node_modules/
	rm -rf src/www/js/
	go clean
endif

run:
ifeq ($(OS), Windows_NT)
	target/YourPlaceBeta.exe config.yaml
else
	./target/YourPlaceBeta config.yaml
endif