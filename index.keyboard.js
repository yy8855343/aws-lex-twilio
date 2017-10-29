'use strict';
const API_URL = "https://bss558zedf.execute-api.us-east-1.amazonaws.com/prod/twilioBlueprintHook";

const respond = (callback, contents) => {
	console.log('--------------------------------- last ---------------------------------');
	console.log(contents);
	console.log('--------------------------------- last length--------- ' + contents.length);
	callback(null,
		`<?xml version="1.0" encoding="UTF-8"?><Response>${contents}</Response>`
	)
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
				return respond(callback, `<Say>Please Speak. </Say><Record action="${API_URL}" /><Redirect></Redirect>`);
			}
			if (keyboard == "2") {
				return respond(callback,
					'<Say>Now calling our company</Say> <Dial timeout="10">415-123-4567</Dial>');
			}
			//  else {
			// 	return respond(callback,
			// 		`<Gather method="POST" numDigits="1" action="${API_URL}">` +
			// 		'<Say>Press 1 to book an appointment,  press 2 for all questions</Say>' +
			// 		'</Gather>' +
			// 		'<Redirect></Redirect>');
			// }
		}
	}
	return respond(callback,
		`<Gather method="POST" numDigits="1" action="${API_URL}">` +
		'<Say>Hi</Say><Pause length="1" /><Say>Welcome to Brentwood Chiropractic. Press 1 to book an appointment,  press 2 for all questions</Say>' +
		'</Gather>' +
		'<Redirect></Redirect>');
};

exports.handler = (event, context, callback) => {
	try {
		main(event, callback);
	} catch (e) {
		console.error(e);
		return respond(callback, '<Say>Some Error Occur at Lambda function</Say>');
	}
};