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

const callAmazonLex = (event, callback) => {
	params.inputStream = "hi";

	lexruntime.postContent(params, function (err, data) {
		if (err) {
			console.log("error Message", err.stack);
			respond(callback, `<Say>${err.stack}</Say><Redirect></Redirect>`); // an error occurred
		} else 
		{
			console.log('----------------------- Data BEGIN -----------------------');
			console.log("success message", data);
			console.log('----------------------- Data END -----------------------');
			respond(callback,
				`<Gather input="speech dtmf" timeout="10" action="${API_URL}"><Say>${data.message}</Say></Gather>
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
						<Say>${speatFor_one}</Say>
					</Gather>
					<Redirect />
					`);*/
				//--------- <Record action="${API_URL}" timeout="3"/>
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