var ws281x = require("rpi-ws281x-native");

var NUM_LEDS = parseInt(process.argv[2], 10) || 8,
  pixelData = new Uint32Array(NUM_LEDS);

var brightness = 128;
var exports = (module.exports = {});
ws281x.init(8);

rainbow_interval = null;
var offset = 0;

exports.lightsOff = function() {
  clearInterval(rainbow_interval);
  ws281x.init(8);
  for (var i = 0; i < NUM_LEDS; i++) {
    pixelData[i] = color(0, 0, 0);
  }
  ws281x.render(pixelData);
  ws281x.reset();
};

var signals = {
  SIGINT: 2,
  SIGTERM: 15
};

function shutdown(signal, value) {
  console.log("Stopped by " + signal);
  exports.lightsOff();
  process.nextTick(function() {
    process.exit(0);
  });
}

Object.keys(signals).forEach(function(signal) {
  process.on(signal, function() {
    shutdown(signal, signals[signal]);
  });
});

exports.init = function() {
  ws281x.init(8);
};

exports.lightsOn = function() {
  clearInterval(rainbow_interval);
  ws281x.init(8);

  for (var i = 0; i < NUM_LEDS; i++) {
    pixelData[i] = color(255, 255, 255);
  }

  offset = (offset + 1) % 256;
  ws281x.render(pixelData);
};

exports.changeColor = function(r, g, b, a) {
  clearInterval(rainbow_interval);
  ws281x.init(8);

  for (var i = 0; i < NUM_LEDS; i++) {
    pixelData[i] = color(r, g, b);
  }

  offset = (offset + 1) % 256;
  ws281x.render(pixelData);
};

exports.rainbow = function() {
  clearInterval(rainbow_interval);
  ws281x.init(8);
  // ---- animation-loop
  rainbow_interval = setInterval(function() {
    for (var i = 0; i < NUM_LEDS; i++) {
      pixelData[i] = wheel((i * 256 / NUM_LEDS + offset) % 256);
    }

    offset = (offset + 1) % 256;
    ws281x.render(pixelData);
  }, 1000 / 30);
};

// generate rainbow colors accross 0-255 positions.
function wheel(pos) {
  pos = 255 - pos;
  if (pos < 85) {
    return color(255 - pos * 3, 0, pos * 3);
  } else if (pos < 170) {
    pos -= 85;
    return color(0, pos * 3, 255 - pos * 3);
  } else {
    pos -= 170;
    return color(pos * 3, 255 - pos * 3, 0);
  }
}

// generate integer from RGB value
function color(r, g, b) {
  r = r * brightness / 255;
  g = g * brightness / 255;
  b = b * brightness / 255;
  return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
}
