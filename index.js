'use strict';
const API_URL = "https://bss558zedf.execute-api.us-east-1.amazonaws.com/prod/twilioBlueprintHook";

const crypto = require('crypto');
const https = require('https');
var AWS = require('aws-sdk');

var lexruntime = new AWS.LexRuntime({
	apiVersion: '2016-11-28'
});

const respond = (callback, contents) => {
	console.log('--------------------------------- last ---------------------------------');
	console.log(contents);
	console.log('--------------------------------- last length--------- ' + contents.length);
	callback(null,
		`<?xml version="1.0" encoding="UTF-8"?><Response>${contents}</Response>`
	)
};
const contentType = "audio/lpcm; sample-rate=8000; sample-size-bits=16; channel-count=1; is-big-endian=false";
// const contentType = "audio/lpcm; sample-rate=8000; sample-size-bits=16; channel-count=1; is-big-endian=false";

var params = {
	botAlias: 'blue',
	contentType: contentType,
	botName: 'Bookappointment', //'Bookappointment',
	accept: "text/plain; charset=utf-8",
	userId: 'wyumpkwy84e5ka8r79hymiqsyk5l2cqj',
	requestAttributes: {},
	sessionAttributes: {}
};

const callAmazonLex = (event, callback, buffer) => {
	params.inputStream = buffer;
	lexruntime.postContent(params, function (err, data) {
		if (err) {
			console.log("error Message", err.stack, "type of err", typeof err);
			respond(callback, `<Say>${err.stack}</Say><Redirect></Redirect>`); // an error occurred
		} else {
			console.log("success message", data.message, "type of message", typeof data.message);
			respond(callback, `<Say>${data.message}</Say><Redirect></Redirect>`);
		}
	});
};
const getAudioBufferFromUrl = (event, callback, audioUrl) => {
	console.log("Called GetAudioBuffer : " + audioUrl);
	var sid = "AC4b33ce4f86f272fb4045df8a110c0047";
	var auth = "d0b71067ea78687d521aee42de4ec159";
	var options = {
		host: 'api.twilio.com',
		port: 443,
		path: audioUrl,
		method: 'GET',
		auth: sid + ":" + auth,
		agent: false
	};
	https.get(options, function (res) {
			var data = [];

			res.on('data', function (chunk) {
				data.push(chunk);
			}).on('end', function () {
				//at this point data is an array of Buffers
				//so Buffer.concat() can make us a new Buffer
				//of all of them together
				var buffer = Buffer.concat(data);
				// console.log("------------------ buffer   --------------- ");
				// console.log(buffer.toString());
				callAmazonLex(event, callback, buffer);
			});
		})
		.on('error', (e) => {
			respond(callback, `<Say>${e}</Say><Redirect></Redirect>`);
		});

};
const speatBegin = "we are waiting "; //"Please Speak."
const recordVoice = (event, callback) => {

	const bodyJson = event["body-json"] + "";
	const arrString = bodyJson.split('&') || [];
	for (let i = 0; i < arrString.length; i++) {
		if (arrString[i].includes("RecordingUrl")) {
			let findBegin = arrString[i].indexOf("=") + 1;
			let url = arrString[i].slice(findBegin);
			var tmpUrl = decodeURIComponent(url);
			return getAudioBufferFromUrl(event, callback, tmpUrl);
		}
	}
	respond(callback, `<Say>${speatBegin}</Say><Record action="${API_URL}" /><Redirect></Redirect>`);
};

const main = (event, callback) => {
	// console.log('------------------ BEGIN ----------------------   ');
	// console.log(event);
	// console.log('------------------ END   ----------------------   ');
	recordVoice(event, callback);
};

exports.handler = (event, context, callback) => {
	try {
		main(event, callback);
	} catch (e) {
		console.error(e);
		return respond(callback, '<Say>Some Error Occur at Lambda function</Say>');
	}
};