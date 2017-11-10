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

function getRequestSessionStr(event) {
	try {
		const params = event["params"] || {};
		const querystring = params["querystring"] || {};
		var sessionAttr = querystring["SessionAttr"] + "";
		if (sessionAttr === null || sessionAttr === undefined || sessionAttr === "undefined") sessionAttr = "";
		return decodeURIComponent(sessionAttr);
	} catch (e) {
		console.log("get request type catch");
		console.log(e);
		return "";
	}
	return "";
}
const DEFAULT_USER_ID = "wyumpkwy84e5ka8r79hymiqsyk5l2cqj";

function getRequestUserID(event) {
	try {
		const params = event["params"] || {};
		const querystring = params["querystring"] || {};
		var userId = querystring["userId"] + "";
		if (userId === null || userId === undefined || userId === "undefined") return DEFAULT_USER_ID;
		return userId;
	} catch (e) {
		console.log("get request type catch");
		console.log(e);
	}
	return DEFAULT_USER_ID;
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
	const userId = getRequestUserID(event);
	console.log("userIdFromParam=", userId)
	params.userId = userId;
	params.inputStream = buffer;
	var sessionAttributes_str = getRequestSessionStr(event);

	console.log("Session=", sessionAttributes_str);
	if (sessionAttributes_str == "")
		params.sessionAttributes = {};
	else {
		params.sessionAttributes = JSON.parse(sessionAttributes_str);
	}

	lexruntime.postContent(params, function (err, data) {
		console.log('-------------------------------------------- From Lex --------------------------------------------')
		console.log(data, err);
		if (err) {
			console.log("lexApiError=", err.stack);
			var sessionAttributes_str_encode = encodeURIComponent(sessionAttributes_str);
			respond(callback, `<Redirect>${API_URL}?userId=${getRequestUserID(event)}&amp;SessionAttr=${sessionAttributes_str_encode}</Redirect>`); // an error occurred
		} else {
			var inputTranscript = data.inputTranscript;
			var dialogState = data.dialogState;
			var message = data.message;
			console.log("inputTranscript=", inputTranscript)
			console.log("________message=", message);

			if (dialogState == 'Fulfilled') {
				return respond(callback,
					`<Say voice="woman">${data.message}</Say>
					 <Hangup />
					`);
			}
			var sessionAttributes_str2 = "";
			if (data.sessionAttributes != {})
				sessionAttributes_str2 = JSON.stringify(data.sessionAttributes);
			var sessionAttributes_str2_encode = encodeURIComponent(sessionAttributes_str2);
			console.log("SSSS=", sessionAttributes_str2_encode);
			respond(callback, `<Say voice="woman">${data.message}</Say><Redirect>${API_URL}?userId=${getRequestUserID(event)}&amp;SessionAttr=${sessionAttributes_str2_encode}</Redirect>`);
		}
	});
};

const getAudioBufferFromUrl = (event, callback, audioUrl) => {
	const RecordingStatus = getParam(event, "RecordingStatus");
	const RecordingDuration = getParam(event, "RecordingDuration");
	const RecordingUrl = getParam(event, "RecordingUrl");

	console.log("Event=", event);
	console.log("RecordingStatus=", RecordingDuration, RecordingStatus);
	setTimeout(function () {
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
					console.log("audioError=" + error + response.statusCode);
					var sessionAttributes = encodeURIComponent(getRequestSessionStr(event));
					// respond(callback, `<Play>${audioUrl}</Play>
					// 			   <Pause length="1" />
					// 			   <Say voice="woman">audio download error</Say>
					// 			   <Redirect>${API_URL}?userId=${getRequestUserID(event)}&amp;SessionAttr=${sessionAttributes}</Redirect>`);
					respond(callback, `
								   <Redirect>${API_URL}?userId=${getRequestUserID(event)}&amp;SessionAttr=${sessionAttributes}</Redirect>`);
				}
			});
	}, 300);
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
	// console.log("BodyJson(recordVoice)=" + bodyJson)
	const arrString = bodyJson.split('&') || [];

	for (let i = 0; i < arrString.length; i++) {
		if (arrString[i].includes("RecordingUrl")) {
			let findBegin = arrString[i].indexOf("=") + 1;
			let url = arrString[i].slice(findBegin);
			var tmpUrl = decodeURIComponent(url);
			return getAudioBufferFromUrl(event, callback, tmpUrl);
		}
	}

	var sessionAttributes = encodeURIComponent(getRequestSessionStr(event));
	// http://docs.aws.amazon.com/lex/latest/dg/gl-limits.html
	// https://www.twilio.com/docs/api/twiml/record
	// Record Max Time => 15 second, 
	respond(callback, `<Record action="${API_URL}?userId=${getRequestUserID(event)}&amp;SessionAttr=${sessionAttributes}" timeout="2" trim="do-not-trim" />`);
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
		//return respond(callback, '<Say voice="woman">Some Error Occur at Lambda function</Say>');
		return respond(callback, '');
	}
};