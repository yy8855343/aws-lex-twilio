'use strict';
const API_URL_SELF = "https://bss558zedf.execute-api.us-east-1.amazonaws.com/prod/twilioblueprinthookkeyboard";
const API_URL = "https://bss558zedf.execute-api.us-east-1.amazonaws.com/prod/twilioBlueprintHook";

const respond = (callback, contents) => {
	console.log('--------------------------------- last ---------------------------------');
	console.log(contents);
	console.log('--------------------------------- last length--------- ' + contents.length);
	callback(null,
		`<?xml version="1.0" encoding="UTF-8"?><Response>${contents}</Response>`
	)
};

function getRequestDigits(event) {
	try {
		const params = event["params"] || {};
		const querystring = params["querystring"] || {};
		var requestType = querystring["Digits"] + "";
		if (requestType == null || requestType == undefined || requestType == "undefined") requestType = "";
		return requestType;
	} catch (e) {
		console.log("get request type catch");
		console.log(e);
		return "";
	}
}

const speatFor_one = "You press 1, please say Hi";
const speatFor_two = "You press 2, please wait ";
const phoneNumber = "415-123-4567";

const main = (event, callback) => {
	const requestType = getRequestDigits(event);
	console.log('------------------ BEGIN ----------------------   ');
	console.log(event);
	console.log(requestType);
	console.log('------------------ END   ----------------------   ');


	// if (requestType == "1") {
	// 	return respond(callback, `
	// 	<Gather input="speech" timeout="3" action="${API_URL}">
	// 		<Say>${speatFor_one}</Say>
	// 	</Gather>
	// 	<Redirect>${API_URL_SELF}?Digits=1</Redirect>
	// 	`);
	// }
	const bodyJson = event["body-json"] + "";
	const arrString = bodyJson.split('&') || [];

	// User press Keyboard
	for (let i = 0; i < arrString.length; i++) {
		if (arrString[i].includes("RecordingUrl")) {
			let findBegin = arrString[i].indexOf("=") + 1;
			let url = arrString[i].slice(findBegin);
			var tmpUrl = decodeURIComponent(url);
			return respond(callback, `<Play>${tmpUrl}</Play><Redirect />`);
		}
	}
	respond(callback, `<Say>Please Speak. </Say><Record action="${API_URL_SELF}?type=record" /><Redirect />`);
	// return respond(callback,
	// 	`<Gather input="dtmf" numDigits="1" action="${API_URL_SELF}">
	// 		<Say>Hi</Say>
	// 		<Pause length="1" />
	// 		<Say>Welcome to Brentwood Chiropractic. Press 1 to book an appointment,  press 2 for all questions</Say>
	// 	</Gather>`);

};

exports.handler = (event, context, callback) => {
	try {
		main(event, callback);
	} catch (e) {
		console.error(e);
		return respond(callback, `<Say>Some Error Occur at Lambda function ${e}</Say>`);
	}
};