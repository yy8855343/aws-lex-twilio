'use strict';
const API_URL = "https://bss558zedf.execute-api.us-east-1.amazonaws.com/prod/twilioBlueprintHook";
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
		`<?xml version="1.0" encoding="UTF-8"?>
		<Response>
			${contents}
		</Response>`
	)
};

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

function getSpeech(speech){ //speech includes "." in the end at some case.  eg: Hi.
	var index = speech.indexOf(".");
	var result = "";
	if(index == -1)
		result = speech;
	else
		result = speech.substr(0, speech.length - 1);
	result = result.replace(/[+]/g, ' ');
	
	return result.toLowerCase();
}

const callAmazonLex = (event, callback, speech) => {
    var inputStream = getSpeech(speech);
	params.inputStream = inputStream;
	console.log("Speech=" + inputStream);
	lexruntime.postContent(params, function (err, data) {
		if (err) {
			console.log("error Message", err.stack);
			respond(callback, `<Say>${err.stack}</Say><Redirect />`); // an error occurred
		} else {
			console.log('----------------------- Data BEGIN -----------------------');
			console.log("success message", data);
			console.log('----------------------- Data END -----------------------');
			respond(callback,
				`<Gather input="speech" timeout="3" action="${API_URL}">
				<Say>${data.message}</Say>
				</Gather>
				<Redirect />
				`);
		}
	});
};

const main = (event, callback) => {
	console.log('------------------ BEGIN ----------------------   ');
	console.log(JSON.stringify(event));
	console.log('------------------ END   ----------------------   ');
	let speech =  '';
	const bodyJson = event["body-json"] + "";
	const arrString = bodyJson.split('&') || [];
	for (let i = 0; i < arrString.length; i++) {
		if (arrString[i].includes("SpeechResult")) {
			let findBegin = arrString[i].indexOf("=") + 1;
			speech = arrString[i].slice(findBegin);
			console.log("------------------------ Speak -------------------------- ")
		    console.log(speech)
			console.log("------------------------ Speak -------------------------- ")
			
			return callAmazonLex(event, callback, speech);
		}
	}

	var waiting = "we are waiting";
	respond(callback,
		`<Gather input="speech" timeout="3" action="${API_URL}">
			<Say>${waiting}</Say>
		</Gather>
		<Redirect />
		`);
};

exports.handler = (event, context, callback) => {
	try {
		main(event, callback);
	} catch (e) {
		console.error("MainError=" + e);
		return respond(callback, '<Say>Some Error Occur at Lambda function</Say>');
	}
};