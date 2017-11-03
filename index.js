'use strict';
const API_URL = "https://bss558zedf.execute-api.us-east-1.amazonaws.com/prod/twilioBlueprintHook";
var request = require("request");

var AWS = require('aws-sdk');
var lexruntime = new AWS.LexRuntime({
	apiVersion: '2016-11-28'
});

const respond = (callback, contents) => {
	// console.log('--------------------------------- last ---------------------------------');
	// console.log(contents);
	callback(null,
		`<?xml version="1.0" encoding="UTF-8"?><Response>${contents}</Response>`
	)
};
// const contentType = "audio/l16; rate=16000; channels=1";
// const contentType = 'audio/x-l16; sample-rate=16000';
const contentType = "audio/lpcm; sample-rate=8000; sample-size-bits=16; channel-count=1; is-big-endian=false";
// const contentType = "audio/x-cbr-opus-with-preamble; preamble-size=0; bit-rate=256000; frame-size-milliseconds=4";
var params = {
	botAlias: 'blue',
	contentType: contentType,
	botName: 'Bookappointment', //'Bookappointment',
	accept: "text/plain; charset=utf-8",
	userId: 'wyumpkwy84e5ka8r79hymiqsyk5l2cqj',
	requestAttributes: {},
	sessionAttributes: {}
};

const callAmazonLex = (event, callback, buffer, audioUrl) => {
	params.inputStream = buffer;
	lexruntime.postContent(params, function (err, data) {
		console.log('==================== From Lex ===================')
		console.log(data, err);
		if (err) {
			console.log("error Message", err.stack);
			respond(callback, `<Say>Lamda api postContent have errors</Say><Redirect></Redirect>`); // an error occurred
		} else {
			var dialogState = data.dialogState;
			if (dialogState == 'Fulfilled') {
				return respond(callback,
					`<Say>${data.message}</Say>
					 <Hangup />
					`);
			}
			respond(callback, `<Play>${audioUrl}</Play><Say>${data.message}</Say><Redirect></Redirect>`);


		}
	});
};
const getAudioBufferFromUrl = (event, callback, audioUrl) => {
	console.log('==================== Audio url ===================')
	console.log(audioUrl);
	var sid = "AC4b33ce4f86f272fb4045df8a110c0047";
	var auth = "d0b71067ea78687d521aee42de4ec159";
	var requestOptions = {
		host: 'api.twilio.com',
		port: 443,
		path: audioUrl,
		url: audioUrl,
		encoding: null,
		method: 'GET',
		//auth: sid + ":" + auth,
		agent: false
	};
	request.get(requestOptions,
		function (error, response, body) {
			console.log("============================== DOWNLOAD ========================");
			console.log(error, response.statusCode, "body.length", body.length, 'typeof body', typeof body);
			if (!error && response.statusCode == 200) {
				callAmazonLex(event, callback, body, audioUrl);
			} else {
				respond(callback, `<Say>Error while download wav file</Say><Redirect></Redirect>`);
			}
		});
};
const speatBegin = "we are waiting "; //"Please Speak."

function getParam(event, parameter) {
	try {
		const bodyJson = event["body-json"] + "";
		const arrString = bodyJson.split('&') || [];
		for (let i = 0; i < arrString.length; i++) {
			if (arrString[i].includes(parameter)) {
				let findBegin = arrString[i].indexOf("=") + 1;
				let url = arrString[i].slice(findBegin);
				if (parameter == "RecordingUrl") return decodeURIComponent(url);
				return url;
			}
		}
	} catch (e) {
		console.log("get request type catch");
		console.log(e);
	}
	return "";
}

const recordVoice = (event, callback) => {

	const bodyJson = event["body-json"] + "";
	const arrString = bodyJson.split('&') || [];

	const RecordingStatus = getParam(event, "RecordingStatus");
	console.log("============================== RecordingStatus ========================");
	console.log(RecordingStatus);

	const RecordingDuration = getParam(event, "RecordingDuration");
	console.log("============================== RecordingDuration ========================");
	console.log(RecordingDuration);
	// const RecordingUrl = getParam(event, "RecordingUrl");
	// console.log("============================== RecordingUrl ========================");
	// console.log(RecordingUrl);

	for (let i = 0; i < arrString.length; i++) {
		if (arrString[i].includes("RecordingUrl")) {
			let findBegin = arrString[i].indexOf("=") + 1;
			let url = arrString[i].slice(findBegin);
			var tmpUrl = decodeURIComponent(url);
			return getAudioBufferFromUrl(event, callback, tmpUrl);
		}
	}
	respond(callback, `<Say>${speatBegin}</Say><Record action="${API_URL}" trim="do-not-trim" timeout="2" /><Redirect></Redirect>`);
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