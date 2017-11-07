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

const contentType = "text/plain; charset=utf-8";

var params = {
	botAlias: 'blue',
	contentType: contentType,
	botName: 'Bookappointment', //'Bookappointment',
	accept: "text/plain; charset=utf-8",
	userId: 'wyumpkwy84e5ka8r79hymiqsyk5l2cqj',
};

function getParam(event, parameter) {
	try {
		const bodyJson = event["body-json"] + "";
		const arrString = bodyJson.split('&') || [];
		for (let i = 0; i < arrString.length; i++) {
			if (arrString[i].includes(parameter)) {
				let findBegin = arrString[i].indexOf("=") + 1;
				let url = arrString[i].slice(findBegin);
				return url;
			}
		}
	} catch (e) {
		console.log("get request type catch");
		console.log(e);
	}
	return "";
}

const DEFAULT_USER_ID = "wyumpkwy84e5ka8r79hymiqsyk5l2cqj";
// genereate new User ID from 'CallSid' + Random 5 digits
// @Param 'event' Object
// @Return String
function generateUserId(event) {
	var callerId = getParam(event, "CallSid");
	if (callerId.length == 0) return DEFAULT_USER_ID;
	const random = Math.floor(Math.random() * 10000);
	const userId = callerId + random;
	return userId;
}

const callAmazonLex = (event, callback) => {
	const userId = generateUserId(event);

	params.userId = userId;
	params.inputStream = "hi";
	console.log("generateUserId=" + userId);

	lexruntime.postContent(params, function (err, data) {
		if (err) {
			console.log("error Message", err.stack);
			respond(callback, `<Say voice="woman">${err.stack}</Say><Redirect></Redirect>`); // an error occurred
		} else {
			console.log('----------------------- Data BEGIN -----------------------');
			console.log("success message", data);
			console.log('----------------------- Data END -----------------------');
			respond(callback,
				`<Say voice="woman">${data.message}</Say>
				<Redirect>${API_URL}?userId=${userId}</Redirect>
				`);
		}
	});
};


const main = (event, callback) => {

	console.log('------------------ BEGIN ----------------------   ');
	console.log(event);
	console.log('------------------ END   ----------------------   ');

	const bodyJson = event["body-json"] + "";
	const arrString = bodyJson.split('&') || [];
	for (let i = 0; i < arrString.length; i++) {

		// User press Keyboard
		if (arrString[i].includes("Digits")) {
			let keyboard = arrString[i].slice(-1);
			if (keyboard == "1") {
				return callAmazonLex(event, callback);
				/*return respond(callback, `
					<Gather input="speech dtmf" timeout="3" action="${API_URL}">
						<Say voice="woman">${speatFor_one}</Say>
					</Gather>
					<Redirect />
					`);*/
				//--------- <Record action="${API_URL}" timeout="3"/>
			}
			if (keyboard == "2") {
				return respond(callback,
					`<Say voice="woman">${speatFor_two}</Say><Dial timeout="10">${phoneNumber}</Dial>`);
			}
		}
	}
	return respond(callback,
		`<Gather method="POST" numDigits="1" action="${API_URL_SELF}">
			<Say voice="woman">Hi</Say>
			<Pause length="1" />
			<Say voice="woman">Welcome to Brentwood Chiropractic. Press 1 to book an appointment,  press 2 for all questions</Say>
		</Gather>
		<Redirect />`);
};

exports.handler = (event, context, callback) => {
	try {
		main(event, callback);
	} catch (e) {
		console.error(e);
		return respond(callback, `<Say voice="woman">Some Error Occur at Lambda function ${e}</Say>`);
	}
};