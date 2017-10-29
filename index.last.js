'use strict';
const API_URL = "https://bss558zedf.execute-api.us-east-1.amazonaws.com/prod/twilioBlueprintHook";
// const API_URL_RECORD = "https://bss558zedf.execute-api.us-east-1.amazonaws.com/prod/twilioBlueprintHook";

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

var params = {
	botAlias: 'blue',
	contentType: "audio/lpcm; sample-rate=8000; sample-size-bits=16; channel-count=1; is-big-endian=false",
	botName: 'Bookappointment',
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
				console.log("------------------ buffer   --------------- ");
				console.log(buffer.toString());
				callAmazonLex(event, callback, buffer);
			});
		})
		.on('error', (e) => {
			respond(callback, `<Say>${e}</Say><Redirect></Redirect>`);
		});

};
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
	respond(callback, `<Say>Please Speak. </Say><Record action="${API_URL}?type=record" /><Redirect></Redirect>`);
};
// const detectKeyboard = (event, callback) => {

// 	const bodyJson = event["body-json"] + "";
// 	const arrString = bodyJson.split('&') || [];
// 	for (let i = 0; i < arrString.length; i++) {
// 		if (arrString[i].includes("Digits")) {
// 			let keyboard = arrString[i].slice(-1);
// 			if (keyboard == "1") {
// 				return recordVoice(event, callback);
// 			}
// 			if (keyboard == "2") {
// 				return respond(callback,
// 					'<Say>You select 2</Say>' +
// 					'<Redirect></Redirect>');
// 				return respond(callback, `<Say>You are press Two</Say><Redirect></Redirect>`);
// 			}
// 			break;
// 		}
// 	}

// 	return respond(callback,
// 		`<Gather method="POST" numDigits="1" action="${API_URL}">` +
// 		'<Say>Hi</Say><Pause length="1" /><Say>Welcome to Brentwood Chiropractic. Press 1 to book an appointment,  press 2 for all questions</Say>' +
// 		'</Gather>' +
// 		'<Redirect></Redirect>');
// 	// */
// };
const detectKeyboard = (event, callback) => {

	const bodyJson = event["body-json"] + "";
	const arrString = bodyJson.split('&') || [];
	for (let i = 0; i < arrString.length; i++) {
		if (arrString[i].includes("Digits")) {
			let keyboard = arrString[i].slice(-1);
			if (keyboard == "1") {
				return recordVoice(event, callback);
			}
			if (keyboard == "2") {
				return respond(callback,
					'<Say>You select 2</Say>' +
					'<Redirect></Redirect>');
				return respond(callback, `<Say>You are press Two</Say><Redirect></Redirect>`);
			}
			break;
		}
	}
};

function getRequestType(event) {
	try {
		const params = event["params"] || {};
		const querystring = params["querystring"] || {};
		const requestType = querystring["type"] + "";
		if (requestType == null || requestType == undefined || requestType == "undefined") requestType = "";
		return requestType;
	} catch (e) {
		console.log("get request type catch");
		console.log(e);
		return "";
	}
}
const main = (event, callback) => {
	// recordVoice(event, callback);
	
	const requestType = getRequestType(event);
	console.log('------------------ BEGIN ----------------------   ');
	console.log(event);
	console.log(requestType);
	console.log('------------------ END   ----------------------   ');

	// first request
	// if (requestType.length == 0) {
	// 	return respond(callback,
	// 		`<Gather method="POST" numDigits="1" action="${API_URL}?type=gather">` +
	// 		'<Say>Hi</Say><Pause length="1" /><Say>Welcome to Brentwood Chiropractic. Press 1 to book an appointment,  press 2 for all questions</Say>' +
	// 		'</Gather>' +
	// 		'<Redirect></Redirect>');
	// }
	// if (requestType == "gather") {
	// 	detectKeyboard(event, callback);
	// }
	// if (requestType == "record") {

	// }

	const bodyJson = event["body-json"] + "";
	const arrString = bodyJson.split('&') || [];
	for (let i = 0; i < arrString.length; i++) {
		// User press Keyboard
		if (requestType == "gather" && arrString[i].includes("Digits")) {
			let keyboard = arrString[i].slice(-1);
			if (keyboard == "1") {
				return respond(callback, `<Say>Please Speak. </Say><Record action="${API_URL}?type=record" /><Redirect></Redirect>`);
			}
			if (keyboard == "2") {
				return respond(callback,
					'<Say>You select 2</Say>');
			} else {
				return respond(callback,
					`<Gather method="POST" numDigits="1" action="${API_URL}?type=gather">` +
					'<Say>Hi</Say><Pause length="1" /><Say>Press 1 to book an appointment,  press 2 for all questions</Say>' +
					'</Gather>' +
					'<Redirect></Redirect>');
			}
		}
		//User talk with Bot
		// if (requestType == "record") {
		// 	if (arrString[i].includes("RecordingUrl")) {
		// 		let findBegin = arrString[i].indexOf("=") + 1;
		// 		let url = arrString[i].slice(findBegin);
		// 		var tmpUrl = decodeURIComponent(url);
		// 		return getAudioBufferFromUrl(event, callback, tmpUrl);
		// 	} else {
		// 		// return respond(callback,
		// 		// 	'<Say>Record else</Say><Redirect></Redirect>');
		// 		// return respond(callback, `<Say>Please Speak. </Say><Record action="${API_URL}?type=record" /><Redirect></Redirect>`);
		// 	}
		// }
		console.log('==================================== ' + i + " " + arrString[i])
	}

	// return respond(callback,
	// 	`<Say> End of Lambda function.   request type is   ${requestType} </Say>` +
	// 	'<Redirect></Redirect>');
	return respond(callback,
		`<Gather method="POST" numDigits="1" action="${API_URL}?type=gather">` +
		'<Say>Hi</Say><Pause length="1" /><Say>Welcome to Brentwood Chiropractic. Press 1 to book an appointment,  press 2 for all questions</Say>' +
		'</Gather>' +
		'<Redirect></Redirect>');

	//*/

};

exports.handler = (event, context, callback) => {
	try {
		main(event, callback);
	} catch (e) {
		console.error(e);
		return respond(callback, '<Say>Some Error Occur at Lambda function</Say>');
	}
};