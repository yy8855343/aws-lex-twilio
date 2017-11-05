'use strict';
const API_URL = "https://bss558zedf.execute-api.us-east-1.amazonaws.com/prod/twilioBlueprintHook";
var request = require("request");

var AWS = require('aws-sdk');
var lexruntime = new AWS.LexRuntime({
	apiVersion: '2016-11-28'
});

const respond = (callback, contents) => {
	callback(null,
		`<?xml version="1.0" encoding="UTF-8"?><Response>${contents}</Response>`
	)
};

function getRequestSession(event) {
	try {
		const params = event["params"] || {};
		const querystring = params["querystring"] || {};
		var requestType = querystring["SessionAttr"] + "";
		if (requestType === null || requestType === undefined || requestType === "undefined") requestType = "";
		return decodeURIComponent(requestType);
	} catch (e) {
		console.log("get request type catch");
		console.log(e);
		return "";
	}
	return "";
}

const contentType = "audio/lpcm; sample-rate=8000; sample-size-bits=16; channel-count=1; is-big-endian=false";
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

	const RecordingStatus = getParam(event, "RecordingStatus");
	const RecordingDuration = getParam(event, "RecordingDuration");
	const RecordingUrl = getParam(event, "RecordingUrl");
	const Caller = getParam(event, "CallSid");
	
	params.userId = Caller;
	params.inputStream = buffer;
	var sessionAttributes = getRequestSession(event);

	console.log("Session=", sessionAttributes);
	if(sessionAttributes=="")
		params.sessionAttributes = {};
	else{
		params.sessionAttributes = JSON.parse(sessionAttributes);
	}
	
	console.log("Event=", event);
	console.log("Params=", params.userId, RecordingStatus, RecordingDuration,  RecordingUrl);


	lexruntime.postContent(params, function (err, data) {
		console.log('-------------------------------------------- From Lex --------------------------------------------')
		console.log(data, err);
		if (err) {
			console.log("error Message", err.stack);
			respond(callback, `<Say>Lex API error</Say><Redirect>${API_URL}?SessionAttr=${sessionAttributes}</Redirect>`); // an error occurred
		} else {
			var inputTranscript = data.inputTranscript;
			var dialogState = data.dialogState;
			var message = data.message;
			console.log("inputTranscript", inputTranscript)
			console.log("message        ", message);

			if (dialogState == 'Fulfilled') {
				return respond(callback,
					`<Say>${data.message}</Say>
					 <Hangup />
					`);
			}
			var sessionAttributes = "";
			if(sessionAttributes!= {})
				sessionAttributes = JSON.stringify(data.sessionAttributes);
			sessionAttributes = encodeURIComponent(sessionAttributes);
			console.log("SSSS=", sessionAttributes);
			respond(callback, `<Say>${data.message}</Say><Redirect>${API_URL}?SessionAttr=${sessionAttributes}</Redirect>`);
		}
	});
};

const getAudioBufferFromUrl = (event, callback, audioUrl) => {
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
	console.log("AudioUrl=", audioUrl);
	request.get(requestOptions,
		function (error, response, body) {
			console.log("download success", !error && response.statusCode == 200);
			if (!error && response.statusCode == 200) {
				callAmazonLex(event, callback, body, audioUrl);
			} else {
				var sessionAttributes = encodeURIComponent(getRequestSession(event));
				respond(callback, `<Say>audio download error</Say><Redirect>${API_URL}?SessionAttr=${sessionAttributes}</Redirect>`);
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
	console.log("BodyJson(recordVoice)=" + bodyJson)
	const arrString = bodyJson.split('&') || [];	

	for (let i = 0; i < arrString.length; i++) {
		if (arrString[i].includes("RecordingUrl")) {
			let findBegin = arrString[i].indexOf("=") + 1;
			let url = arrString[i].slice(findBegin);
			var tmpUrl = decodeURIComponent(url);
			return getAudioBufferFromUrl(event, callback, tmpUrl);
		}
	}

	var sessionAttributes = encodeURIComponent(getRequestSession(event));

	respond(callback, `<Record action="${API_URL}?SessionAttr=${sessionAttributes}" timeout="3" trim="do-not-trim" />`);
};

const main = (event, callback) => {
	console.log('**********************************************   BEGIN  ************************************************');
	console.log('********************************************************************************************************');

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