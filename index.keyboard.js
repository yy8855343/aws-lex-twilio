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

const speatFor_one = "You press 1, please say Hi";
const speatFor_two = "You press 2, please wait ";
const phoneNumber = "415-123-4567";

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
				return respond(callback, `
					<Gather input="speech" timeout="3" action="${API_URL}">
						<Say>${speatFor_one}</Say>
					</Gather>
					`);
				//--------- <Record action="${API_URL}" timeout="3"/>
			}
			if (keyboard == "2") {
				return respond(callback,
					`<Say>${speatFor_two}</Say><Dial timeout="10">${phoneNumber}</Dial>`);
			}
		}
	}
	return respond(callback,
		`<Gather input="dtmf" numDigits="1" action="${API_URL_SELF}">
			<Say>Hi</Say>
			<Pause length="1" />
			<Say>Welcome to Brentwood Chiropractic. Press 1 to book an appointment,  press 2 for all questions</Say>
		</Gather>
		<Redirect />`);
};

exports.handler = (event, context, callback) => {
	try {
		main(event, callback);
	} catch (e) {
		console.error(e);
		return respond(callback, `<Say>Some Error Occur at Lambda function ${e}</Say>`);
	}
};