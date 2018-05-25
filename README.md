# Decentralized IoT dashboard

A working prototype designed to experiment with the way IoT devices could be controlled through a smart contract.

## Hardware requirements

* [Raspberry Pi Zero W](https://www.kiwi-electronics.nl/raspberry-pi-zero-w?gclid=CjwKCAjw8r_XBRBkEiwAjWGLlCVT-3tXLl3jDlezD9mDh_CCtOEHtGgEWXgElLJL6nBdQER-hvzKrBoCZSEQAvD_BwE)
* You could use a normal LED, but because I wanted a bit more light I used a [LED ring](https://www.kiwi-electronics.nl/neopixel-ring-12x-ws2812-5050-rgb-led-met-drivers?search=LED%20ring)
* 3D printed lightbulb, print it slightly bigger so the Raspberry Pi fits. [3D parts](https://www.thingiverse.com/thing:2280081)

## With `testrpc`

> Use port 8545

```
npm install -g ethereumjs-testrpc
testrpc
yarn install
yarn start
```

## With `truffle develop`

> Use port 9545

```
npm install -g truffle
truffle develop
yarn install
yarn start
```
# IoT-dashboard-DApp
