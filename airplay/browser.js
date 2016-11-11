/**
 * node-airplay
 *
 * @file bojour server
 * @author zfkun(zfkun@msn.com)
 * @thanks https://github.com/benvanik/node-airplay/blob/master/lib/airplay/browser.js
 */

var util = require('util');
var events = require('events');
var Bonjour = require('bonjour');
//var mdns = require( 'mdns' );
var EventEmitter = require('events').EventEmitter
var mdns = require('mdns-js');

var Device = require('./device').Device;

var Browser = function(options) {
  events.EventEmitter.call(this);
  this.init(options);
};

util.inherits(Browser, events.EventEmitter);

exports.Browser = Browser;


Browser.prototype.init = function(options) {
  var self = this;
  var nextDeviceId = 0;

  this.devices = {};
  this.addresses = []

  console.log('createBrowser...')
  var bonjour = new Bonjour()
  var list = new EventEmitter()
  var found = []
  var browser = bonjour.find({ type: 'airplay' }, function(service) {
    console.log('service', service)
    if (~found.indexOf(service.fqdn)) return
    found.push(service.fqdn)

    var info = [service.referer.address]
    var name = service.name

    device = new Device(nextDeviceId++, info, name);
    device.on('ready', function(d) {
      self.emit('deviceOn', d);
    });
    device.on('close', function(d) {
      delete self.devices[d.id];
      self.emit('deviceOff', d);
    });

    self.devices[device.id] = device;

  })

  list.players = []
  list.update = browser.update.bind(browser)
  list.destroy = bonjour.destroy.bind(bonjour)


  //   var browser = mdns.createBrowser();

  //   browser.on('ready', function() {
  //     browser.discover();
  //   });

  //   browser.on('serviceUp', function(data) {
  //   console.log(data)
  //   if (data.port && data.port == 7000 && self.addresses.indexOf(data.address) < 0) {
  //     var info = [data.address]
  //     var name = data.name
  //     self.addresses.push(data.address)

  //     device = new Device(nextDeviceId++, info, name);
  //     device.on('ready', function(d) {
  //       self.emit('deviceOn', d);
  //     });
  //     device.on('close', function(d) {
  //       delete self.devices[d.id];
  //       self.emit('deviceOff', d);
  //     });

  //     self.devices[device.id] = device;
  //   }
  //   //   });

  //   browser.on('serviceDown', function(info) {
  //     if (!self.isValid(info)) {
  //       return;
  //     }

  //     var device = self.getDevice(info);
  //     if (device) {
  //       device.close();
  //     }
  //   });
};

Browser.prototype.start = function() {
  this.emit('start');
  return this;
};

Browser.prototype.stop = function() {
  this.emit('stop');
  return this;
};

Browser.prototype.isValid = function(info) {
  if (!info || !/^en\d+$/.test(info.networkInterface)) {
    return !1;
  }
  return !0;
};

Browser.prototype.getDevice = function(info) {
  for (var deviceId in this.devices) {
    var device = this.devices[deviceId];
    if (device.match(info)) {
      return device;
    }
  }
};

Browser.prototype.getDeviceById = function(deviceId, skipCheck) {
  var device = this.devices[deviceId];
  if (device && (skipCheck || device.isReady())) {
    return device;
  }
};

Browser.prototype.getDevices = function(skipCheck) {
  var devices = [];
  for (var deviceId in this.devices) {
    var device = this.devices[deviceId];
    if (skipCheck || device.isReady()) {
      devices.push(device);
    }
  }
  return devices;
};