'use strict';
const API_URL_SELF = "https://bss558zedf.execute-api.us-east-1.amazonaws.com/prod/twilioblueprinthookkeyboard";
const API_URL = "https://bss558zedf.execute-api.us-east-1.amazonaws.com/prod/twilioBlueprintHook";
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

const speatFor_one = "You press 1, please say Hi";
const speatFor_two = "You press 2, please wait ";
const phoneNumber = "415-123-4567";


const callAmazonWithHi = (event, callback) => {
	const contentType = "text/plain; charset=utf-8";

	var paramsText = {
		botAlias: 'blue',
		contentType: contentType,
		botName: 'Bookappointment', //'Bookappointment',
		accept: "text/plain; charset=utf-8",
		userId: 'wyumpkwy84e5ka8r79hymiqsyk5l2cqj',
	};
	paramsText.inputStream = "hi";

	lexruntime.postContent(paramsText, function (err, data) {
		if (err) {
			console.log("error Message", err.stack);
			respond(callback, `<Say>The lex have some error</Say>`); // an error occurred
		} else {
			console.log('----------------------- Data BEGIN -----------------------');
			console.log("success message", data);
			console.log('----------------------- Data END -----------------------');
			respond(callback,
				`<Say>Lambda result </Say><Say>${data.message}</Say>
				<Redirect>${API_URL}?Digits=1</Redirect>
				`);
		}
	});
};

function getRequestDigits(event) {
	try {
		const params = event["params"] || {};
		const querystring = params["querystring"] || {};
		var requestType = querystring["Digits"] + "";
		if (requestType === null || requestType === undefined || requestType === "undefined") requestType = "";
		return requestType;
	} catch (e) {
		console.log("get request type catch");
		console.log(e);
		return "";
	}
}

const main = (event, callback) => {

	const requestType = getRequestDigits(event);
	console.log('------------------ BEGIN ----------------------   ');
	console.log(event);
	console.log(requestType);
	console.log('------------------ END   ----------------------   ');
	if (requestType == "1") {
		return respond(callback, `
		<Redirect>${API_URL}?Digits=1</Redirect>
		`);
	}

	const bodyJson = event["body-json"] + "";
	const arrString = bodyJson.split('&') || [];
	for (let i = 0; i < arrString.length; i++) {

		// User press Keyboard
		if (arrString[i].includes("Digits")) {
			let keyboard = arrString[i].slice(-1);
			if (keyboard == "1") {
				return callAmazonWithHi(event, callback);
			}
			if (keyboard == "2") {
				return respond(callback,
					`<Say>${speatFor_two}</Say><Dial timeout="10">${phoneNumber}</Dial>`);
			}
		}
	}
	return respond(callback,
		`<Gather method="POST" numDigits="1" action="${API_URL_SELF}">
			<Say>Hi</Say>
			<Pause length="1" />
			<Say>Welcome to Brentwood Chiropractic. Press 1 to book an appointment,  press 2 for all questions</Say>
		</Gather>`);
};

exports.handler = (event, context, callback) => {
	try {
		main(event, callback);
	} catch (e) {
		console.error(e);
		return respond(callback, `<Say>Some Error Occur at Lambda function ${e}</Say>`);
	}
};