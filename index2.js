/*
'use strict';

const respond = (callback, contents) => callback(null,
	`<?xml version="1.0" encoding="UTF-8"?><Response>${contents}</Response>`
);


exports.handler = (event, context, callback) => {


};
//*/
'use strict';

const crypto = require('crypto');
var AWS = require('aws-sdk');

var lexruntime = new AWS.LexRuntime({
    apiVersion: '2016-11-28'
});

const respond = (callback, contents) => callback(null,
    `<?xml version="1.0" encoding="UTF-8"?><Response>${contents}</Response>`
);

var params = {
    botAlias: 'prod',
    botName: 'OrderFlowers',
    inputStream: "I would like to order some flowers",
    contentType: "text/plain; charset=utf-8",
    userId: 'dha06kdcahyixqxmzin1ko4vsmhy38e0',
    requestAttributes: {},
    sessionAttributes: {}
};

const callAmazonLex = (event, context, callback) => {
    params.inputStream = "I would like to order some flowers";
    lexruntime.postContent(params, function (err, data) {
        if (err) {
            console.error(err);
            respond(callback, `<Say>${err.stack}</Say>`); // an error occurred
        } else {
            console.log(data);
            respond(callback, `<Say>${data}</Say>`);
        }
    });
};
const detectKeyboard = (event, context, callback) => {
    callAmazonLex(event, context, callback);
    /*
    const bodyJson = event["body-json"] + "";
    const arrString = bodyJson.split('&') || [];
    for (let i = 0; i < arrString.length; i++) {
    	if (arrString[i].includes("Digits")) {
    		let keyboard = arrString[i].slice(-1);
    		if (keyboard == "1") {
    			return respond(callback,
    				'<Say>You select 1</Say>' +
    				'<Redirect></Redirect>');
    			callAmazonLex(event, context, callback);
    		}
    		if (keyboard == "2") {
    			return respond(callback,
    				'<Say>You select 2</Say>' +
    				'<Redirect></Redirect>');
    			return respond(callback, `<Say>You are press Two</Say><Redirect></Redirect>`);
    		}
    		break;
    	}
    }

    return respond(callback,
    	'<Gather method="POST" numDigits="1" action="https://bss558zedf.execute-api.us-east-1.amazonaws.com/prod/twilioBlueprintHook">' +
    	'<Say>Hi</Say><Pause length="1" /><Say>Welcome to Brentwood Chiropractic. Press 1 to book an appointment,  press 2 for all questions</Say>' +
    	'</Gather>' +
    	'<Redirect></Redirect>');
    	// */
};
exports.handler = (event, context, callback) => {
    try {
        console.log('------------------ BEGIN ----------------------   ');
        console.log(event)
        console.log('------------------- END ---------------------   ');

        detectKeyboard(event, context, callback);
    } catch (e) {
        console.error(e);
        return respond(callback, '<Say>Some Error Occur at Lambda function</Say>');
    }
    // const response = [];

    // if (query.Message && query.Message.trim().substring(0, 4).toLowerCase() === 'http') {
    //     // Play the given message from an HTTP URL
    //     response.push(`<Play>${query.Message}</Play>`);
    // } else if (query.Message) {
    //     // Read back the message given
    //     response.push(`<Say>${query.Message}</Say>`);
    // } else {
    //     // Default message
    //     response.push('<Say>You are now entering the conference line.</Say>');
    // }

    // Get the conference name or generate a unique hash if none is provided
    // const name = query.Name || crypto.createHash('md5').update(JSON.stringify(query)).digest('hex');

    // response.push(`<Dial method="GET"><Conference>${name}</Conference></Dial>`);

    // Flush out response
    // respond(callback, response.join(''));
    //*/
};