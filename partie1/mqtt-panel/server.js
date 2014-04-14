#!/usr/bin/env node
/**
 * Copyright (c) 2013, Fabian Affolter <fabian@affolter-engineering.ch>
 * Released under the MIT license. See LICENSE file for details.
 */

var MongoClient = require('mongodb').MongoClient;
var date;

var mqtt = require('mqtt');
var socket = require('socket.io');
//var firmata = require('firmata');

var mqttbroker = 'localhost';
//var mqttbroker = '169.254.100.228';
var mqttport = 1883;

var io = socket.listen(3000);
var mqttclient = mqtt.createClient(mqttport, mqttbroker);

// Reduce socket.io debug output
io.set('log level', 0)

// Subscribe to topic
io.sockets.on('connection', function (socket) {
    socket.on('subscribe', function (data) {
        mqttclient.subscribe(data.topic);
    });
});

// Push the message to socket.io
mqttclient.on('message', function(topic, payload) {
    io.sockets.emit('mqtt',
        {'topic'  : topic,
         'payload' : payload
        }
    );
    date = new Date();
    MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
    	if(err) throw err;
	db.collection('m2m').insert({mesure_gaz : payload, dates : date.toGMTString()}, function(err, records) {
		if (err) throw err;
		console.log("une ligne ajoutee: "+records[0]._id);
	});
    });
});
