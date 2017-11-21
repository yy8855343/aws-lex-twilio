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

function getQuery(event, paramKey) {
	try {
		const params = event["params"] || {};
		const querystring = params["querystring"] || {};
		var query = querystring[paramKey] + "";
		if (query === null || query === undefined || query === "undefined" || query === "") return false;
		return query;
	} catch (e) {
		console.log("getQuery() error");
		console.log(e);
		return false;
	}
}

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

const callAmazonLex = (event, callback, keyboard) => {
	const userId = generateUserId(event);
	const appointmentId = getQuery(event, "appointmentId");
	const appointmentDate = getQuery(event, "appointmentDate");
	const appointmentTime = getQuery(event, "appointmentTime");

	params.userId = userId;
	params.inputStream = "hi";
	var session_obj = {};
	session_obj.appointmentId = appointmentId;
	session_obj.keyboard = keyboard;
	session_obj.appointmentDate = appointmentDate;
	session_obj.appointmentTime = appointmentTime;

	params.sessionAttributes = session_obj;

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
				<Redirect>${API_URL}?userId=${userId}&amp;appointmentId=${appointmentId}&amp;keyBoard=${keyboard}</Redirect>
				`);
		}
	});
};

function afterPress(event, callback){
	const bodyJson = event["body-json"] + "";
	const arrString = bodyJson.split('&') || [];
	const appointmentId = getQuery(event, "appointmentId");
	const notFoundSpeach = "I am sorry, I can not find your appointment from the phone number you called in. I will redirect you not to someone who can help you.";
	for (let i = 0; i < arrString.length; i++) {

		// User press Keyboard
		if (arrString[i].includes("Digits")) {
			let keyboard = arrString[i].slice(-1);
			if (keyboard == "1") {
				return callAmazonLex(event, callback, 1);
			}
			else if (keyboard == "2") {
				console.log("AppointID=", appointmentId);
				if(appointmentId == 0 || appointmentId == "0")
					return respond(callback,
						`<Say voice="woman">${notFoundSpeach}</Say><Dial timeout="10">${phoneNumber}</Dial>`);
				return callAmazonLex(event, callback, 2);
			}
			else if( keyboard == "3") {
				if(appointmentId == 0 || appointmentId == "0")
					return respond(callback,
						`<Say voice="woman">${speatFor_two}</Say><Dial timeout="10">${phoneNumber}</Dial>`);
				return callAmazonLex(event, callback, 3);
			}
			else if( keyboard == "4") {
				return respond(callback,
					`<Say voice="woman">${speatFor_two}</Say><Dial timeout="10">${phoneNumber}</Dial>`);
			}
		}
	}
	
}

function convertDate(date){
    if(!date)
        return null;
    return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
}

function getPhoneNumber(phonenumber, event, callback){
	var request = require('request'); //Import the NPM package
    const username = "root@gmail.com";
    const password = "BB290AA450CI";
    let auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
    const ajaxUrl = "https://secure.bookedfusion.com/api/v1/calendar/?search="+phonenumber;
    
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    request(ajaxUrl, function (err, response, body) {
        if (err) {
            console(err);
        } else {   
            const results = JSON.parse(body).results;
            if(results.length == 0){
            	return respond(callback,
					`<Gather method="POST" numDigits="1" action="${API_URL_SELF}?PhoneCheck=true">
						<Say voice="woman">Hi Welcome</Say>
						<Pause length="1" />
						<Say voice="woman">Press 1 to book an appointment,  press 2 to reschedule, press 3 to cancel, press 4 for all other questions</Say>
					</Gather>
					<Redirect />`);
                console.log("No Results");
                return;
            }
            const start_datetime = results[0].start_datetime;
            const customer_id = results[0].users_customer;
            const appointmentId = results[0].id;
            const appointmentDate = start_datetime.substr(0, 10);
            const appointmentTime = start_datetime.substr(11, 5);
            console.log(customer_id, appointmentDate, appointmentTime);
            var options = {
                "method": "get",
                url: "https://secure.bookedfusion.com/api/v1/users/"+customer_id,
                headers: {
                    "Authorization": auth,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            };
            request(options, function(err, response, body) {
                if( err) {
                    console.log("get Customer Info Error", err);
                } else {
                    const customer_name = JSON.parse(body).name;
                    return respond(callback,
						`<Gather method="POST" numDigits="1" action="${API_URL_SELF}?PhoneCheck=true&amp;appointmentId=${appointmentId}&amp;appointmentDate=${appointmentDate}&amp;appointmentTime=${appointmentTime}&amp;customer_name=${customer_name}">
							<Say voice="woman">Hi ${customer_name}. Welcome back.</Say>
							<Pause length="1" />
							<Say voice="woman">Press 1 to book an appointment,  press 2 to reschedule, press 3 to cancel.</Say>
						</Gather>
						<Redirect />`);
                }
            });
        }
    });
}

const main = (event, callback) => {

	console.log('------------------ BEGIN ----------------------   ');
	console.log(event);
	console.log('------------------ END   ----------------------   ');

	let from = getParam(event, "From");
	const phonenumber = "5595158971";//from.substring(4, from.length);
	console.log("PhoneNumber=", phonenumber);
	const phonecheck = getQuery(event, "PhoneCheck");
	console.log("PhoneCheck=", phonecheck);

	if(phonecheck){
		afterPress(event, callback, phonenumber);
	}
	else
		getPhoneNumber(phonenumber, event, callback);

	
};

exports.handler = (event, context, callback) => {
	try {
		console.log(`event=`+JSON.stringify(event));
		main(event, callback);
	} catch (e) {
		console.error(e);
		return respond(callback, `<Say voice="woman">Some Error Occur at Lambda function ${e}</Say>`);
	}
};