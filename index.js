'use strict';
const API_URL = "https://bss558zedf.execute-api.us-east-1.amazonaws.com/prod/twilioBlueprintHook";
const https = require('https');
var AWS = require('aws-sdk');

var lexruntime = new AWS.LexRuntime({
	apiVersion: '2016-11-28'
});

const respond = (callback, contents) => {
	// console.log('--------------------------------- last ---------------------------------');
	// console.log(contents);
	// console.log('--------------------------------- last length--------- ' + contents.length);
	callback(null,
		`<?xml version="1.0" encoding="UTF-8"?><Response>${contents}</Response>`
	)
};

// const contentType = "audio/l16; rate=16000; channels=1";
// const contentType = "audio/x-l16; sample-rate=16000; channel-count=1";
// const contentType = "audio/lpcm; sample-rate=8000; sample-size-bits=16; channel-count=1; is-big-endian=false";
// const contentType = "audio/x-cbr-opus-with-preamble; preamble-size=0; bit-rate=256000; frame-size-milliseconds=4";
const contentType = "text/plain; charset=utf-8";
var params = {
	botAlias: 'blue',
	contentType: contentType,
	botName: 'Bookappointment', //'Bookappointment',
	accept: "text/plain; charset=utf-8",
	userId: 'wyumpkwy84e5ka8r79hymiqsyk5l2cqj',
	requestAttributes: {},
	sessionAttributes: {}
};

const callAmazonLex = (event, callback, speach) => {
	params.inputStream = speach;
	respond(callback,
		`<Play>${speach}</Play>
		<Redirect />`);
	// lexruntime.postContent(params, function (err, data) {
	// 	if (err) {
	// 		console.log("error Message", err.stack);
	// 		const error = err.stack.trim();
	// 		respond(callback, `<Say>Error from lex</Say><Redirect />`); // an error occurred
	// 	} else {
	// 		console.log('----------------------- Data BEGIN -----------------------');
	// 		console.log("success message", data);
	// 		console.log('----------------------- Data END -----------------------');
	// 		respond(callback,
	// 			`<Play>${speach}</Play><Say>${data.message}</Say>
	// 			<Redirect />`);
	// 	}
	// });
};
const speatBegin = "we are waiting "; //"Please Speak."
const recordVoice = (event, callback) => {

	const bodyJson = event["body-json"] + "";
	const arrString = bodyJson.split('&') || [];
	for (let i = 0; i < arrString.length; i++) {
		if (arrString[i].includes("SpeechResult")) {
			let findBegin = arrString[i].indexOf("=") + 1;
			let speach = arrString[i].slice(findBegin);
			console.log(" -------------- speach --------------- ")
			console.log(speach)
			return callAmazonLex(event, callback, speach);
		}
	}
	respond(callback,
		`<Gather input="speech" method="POST" numDigits="1" action="${API_URL}">
			<Say>${speatBegin}</Say>
		</Gather>`);
};

const main = (event, callback) => {
	console.log('------------------ BEGIN ----------------------   ');
	console.log(event);
	console.log('------------------ END   ----------------------   ');
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