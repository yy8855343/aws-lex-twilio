'use strict';

/**
 * This code sample demonstrates an implementation of the Lex Code Hook Interface
 * in order to serve a bot which manages dentist appointments.
 * Bot, Intent, and Slot models which are compatible with this sample can be found in the Lex Console
 * as part of the 'MakeAppointment' template.
 *
 * For instructions on how to set up and test this bot, as well as additional samples,
 *  visit the Lex Getting Started documentation.
 */


// --------------- Helpers to build responses which match the structure of the necessary dialog actions -----------------------

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message, responseCard) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
            responseCard,
        },
    };
}

function confirmIntent(sessionAttributes, intentName, slots, message, responseCard) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ConfirmIntent',
            intentName,
            slots,
            message,
            responseCard,
        },
    };
}

function close(sessionAttributes, fulfillmentState, message, responseCard) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
            responseCard,
        },
    };
}

function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}

// Build a responseCard with a title, subtitle, and an optional set of options which should be displayed as buttons.
function buildResponseCard(title, subTitle, options) {
    let buttons = null;
    if (options != null) {
        buttons = [];
        for (let i = 0; i < Math.min(5, options.length); i++) {
            buttons.push(options[i]);
        }
    }
    return {
        contentType: 'application/vnd.amazonaws.card.generic',
        version: 1,
        genericAttachments: [{
            title,
            subTitle,
            buttons,
        }],
    };
}

// ---------------- Helper Functions --------------------------------------------------

function isContain(str, key){
    if(str.indexOf(key) == -1)
        return false;
    return true;
}

function analNSelect(nSelect){
    if(isContain(nSelect,"repeat"))
        return 1;
    if(isContain(nSelect, "choose")||isContain(nSelect, "another"))
        return 2;
    return -1;
}

function parseLocalDate(date) {
    /**
     * Construct a date object in the local timezone by parsing the input date string, assuming a YYYY-MM-DD format.
     * Note that the Date(dateString) constructor is explicitly avoided as it may implicitly assume a UTC timezone.
     */
    const dateComponents = date.split(/\-/);
    return new Date(dateComponents[0], dateComponents[1] - 1, dateComponents[2]);
}

function isValidDate(date) {
    try {
        return !(isNaN(parseLocalDate(date).getTime()));
    } catch (err) {
        return false;
    }
}

function isToday(date) {
    const year = parseInt(date.substring(0, 4), 10);
    const month = parseInt(date.substring(5, 7), 10);
    const day = parseInt(date.substring(8, 10), 10);
    const today = new Date();
    if ((year == today.getFullYear()) && (month == (today.getMonth() + 1)) && (day == today.getDate())) {
        return true;
    }
    return false;

}

function incrementTimeByThirtyMins(time) {
    var arr = time.split(":").map(val => Number(val));
    const hour = parseInt(arr[0], 10);
    const minute = parseInt(arr[1], 10);
    return (minute === 30) ? `${hour + 1}:00` : `${hour}:30`;
}

// Returns a random integer between min (included) and max (excluded)
function getRandomInt(min, max) {
    const minInt = Math.ceil(min);
    const maxInt = Math.floor(max);
    return Math.floor(Math.random() * (maxInt - minInt)) + minInt;
}

function DateToString(date){
    if(!date)
        return null;
    return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
}

/**
 * Helper function which in a full implementation would  feed into a backend API to provide query schedule availability.
 * The output of this function is an array of 30 minute periods of availability, expressed in ISO-8601 time format.
 *
 * In order to enable quick demonstration of all possible conversation paths supported in this example, the function
 * returns a mixture of fixed and randomized results.
 *
 * On Mondays, availability is randomized; otherwise there is no availability on Tuesday / Thursday and availability at
 * 10:00 - 10:30 and 4:00 - 5:00 on Wednesday / Friday.
 */
function getAvailabilities(onSuccess, date, intentRequest, callback) {
    var request = require('request'); //Import the NPM package

    const username = "root@gmail.com";
    const password = "BB290AA450CI";
    let auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
    var options = {
        "method": "post",
        url: "https://secure.bookedfusion.com/api/v1/calendar/get_main_calendar_from_date/?format=json",
        headers: {
            "Authorization": auth,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            'date': date
        },

        //"rejectUnauthorized": false,
    };
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    request(options, function (err, response, body) {
        if (err) {
            console(err);
        } else {
            //console.log("getAvailabilities[request]:"+body);
            onSuccess(body, date, intentRequest, callback);
        }
    });


}

var returnCallback = function (body, date, intentRequest, callback) {
    const cal_appoints = [];
    const availabilities = [];
    const results = JSON.parse(body);
    //console.log("Result=" + results.length);
    if (!results)
        return null;
    for (var i = 0; i < results.length; i++) {
        if (!results[i]['start_datetime'])
            continue;
        var start_date = results[i]['start_datetime'].substr(0, 10);
        var start_time = results[i]['start_datetime'].substr(11, 5);
        if (start_date != date)
            continue;
        cal_appoints.push(buildTimeOutputString(start_time));
    }

    var begin_time = "08:30";
    while(begin_time != "16:30"){
        begin_time = incrementTimeByThirtyMins(begin_time);
        if((begin_time=="12:00")||(begin_time=="12:30")){
            continue;
        }
        var schedule_obj = {};
        schedule_obj.start_time = buildTimeOutputString(begin_time);
        schedule_obj.end_time = buildTimeOutputString(incrementTimeByThirtyMins(begin_time));
        if(cal_appoints.indexOf(schedule_obj.start_time)!=-1){
            continue;
        }
        availabilities.push(schedule_obj);
    }


    var bookingMap = {};
    bookingMap[`${date}`] = availabilities;
    intentRequest.sessionAttributes.bookingMap = JSON.stringify(bookingMap);
    makeAppointment_afterDay(intentRequest, callback);

};
// Helper function to check if the given time and duration fits within a known set of availability windows.
// Duration is assumed to be one of 30, 60 (meaning minutes).  Availabilities is expected to contain entries of the format HH:MM.
function isAvailable(time, duration, availabilities) {
    if (duration === 30) {
        return (availabilities.indexOf(time) !== -1);
    } else if (duration === 60) {
        const secondHalfHourTime = incrementTimeByThirtyMins(time);
        return (availabilities.indexOf(time) !== -1 && availabilities.indexOf(secondHalfHourTime) !== -1);
    }
    // Invalid duration ; throw error.  We should not have reached this branch due to earlier validation.
    throw new Error(`Was not able to understand duration ${duration}`);
}

function getDuration(appointmentType) {
    const appointmentDurationMap = {
        cleaning: 30,
        'root canal': 60,
        whitening: 30
    };
    return appointmentDurationMap[appointmentType.toLowerCase()];
}

// Helper function to return the windows of availability of the given duration, when provided a set of 30 minute windows.
function getAvailabilitiesForDuration(duration, availabilities) {
    const durationAvailabilities = [];
    let startTime = '10:00';
    while (startTime !== '17:00') {
        if (availabilities.indexOf(startTime) !== -1) {
            if (duration === 30) {
                durationAvailabilities.push(startTime);
            } else if (availabilities.indexOf(incrementTimeByThirtyMins(startTime)) !== -1) {
                durationAvailabilities.push(startTime);
            }
        }
        startTime = incrementTimeByThirtyMins(startTime);
    }
    return durationAvailabilities;
}

function buildValidationResult(isValid, violatedSlot, messageContent) {
    return {
        isValid,
        violatedSlot,
        message: {
            contentType: 'PlainText',
            content: messageContent
        },
    };
}

function validateBookAppointment(date, aptime, nSelect) {
    if (date) {
        if (!isValidDate(date)) {
            return buildValidationResult(false, 'Date', 'I did not understand that, what date works best for you?');
        }
        if (!isValidInDate(date)) {
            return buildValidationResult(false, 'Date', 'I am sorry, we are busy during that time frame. Please choose another day.');
        }
        /*if (parseLocalDate(date) <= new Date()) {
            return buildValidationResult(false, 'Date', 'Appointments must be scheduled a day in advance.  Can you try a different date?');
        } else*/
        if (parseLocalDate(date).getDay() === 0 || parseLocalDate(date).getDay() === 6) {
            return buildValidationResult(false, 'Date', 'Our office is not open on the weekends, can you provide a work day?');
        }
    }
    if (aptime) {
        if ((aptime.toLowerCase() != "morning") && (aptime.toLowerCase() != "evening")) {
            return buildValidationResult(false, 'APTime', 'Sorry, morning or evening?');
        }
    }
    if (nSelect) {
        var selection = analNSelect(nSelect);
        if(selection == -1){
            return buildValidationResult(false, 'Choose', 'Would you like to repeat them or choose another day?');
        }
    }
    return buildValidationResult(true, "Date", null);
}

//check if the schedule is valid in this date.
function isValidInDate(date) {
    return true;
}

function buildTimeOutputString(time) {
    var arr = time.split(":").map(val => Number(val));
    const hour = arr[0];
    let minute = arr[1];
    if(minute < 10)
        minute = "00";
    if (hour > 12) {
        return `${hour - 12}:${minute} PM`;
    } else if (hour === 12) {
        return `12:${minute} PM`;
    } else if (hour === 0) {
        return `12:${minute} AM`;
    }
    return `${hour}:${minute} AM`;
}

function buildDateOutputString(date) {
    const year = date.substring(0, 4);
    const month = date.substring(5, 7);
    const day = date.substring(8, 10);
    return month + "." + day + "." + year;
}

function buildUTCDateOutputString(date) {
    const mL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const year = date.substring(0, 4);
    const month = date.substring(5, 7);
    const day = date.substring(8, 10);
    return mL[month-1] + " " + parseInt(day);
}

// Build a string eliciting for a possible time slot among at least two availabilities.
function buildAvailableTimeString(availabilities) {
    let prefix = 'We have availabilities at ';
    if (availabilities.length > 3) {
        prefix = 'We have plenty of availability, including ';
    }
    prefix += buildTimeOutputString(availabilities[0]);
    if (availabilities.length === 2) {
        return `${prefix} and ${buildTimeOutputString(availabilities[1])}`;
    }
    return `${prefix}, ${buildTimeOutputString(availabilities[1])} and ${buildTimeOutputString(availabilities[2])}`;
}

// Build a list of potential options for a given slot, to be used in responseCard generation.
function buildOptions(slot, date, bookingMap) {
    const dayStrings = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (slot === 'Date') {
        // Return the next five weekdays.
        const options = [];
        const potentialDate = new Date();
        while (options.length < 5) {
            potentialDate.setDate(potentialDate.getDate() + 1);
            if (potentialDate.getDay() > 0 && potentialDate.getDay() < 6) {
                options.push({
                    text: `${potentialDate.getMonth() + 1}-${potentialDate.getDate()} (${dayStrings[potentialDate.getDay()]})`,
                    value: potentialDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                });
            }
        }
        return options;
    } else if (slot === 'Time') {
        // Return the availabilities on the given date.
        if (!date) {
            return null;
        }
        let availabilities = bookingMap[`${date}`];
        if (!availabilities) {
            return null;
        }
        const options = [];
        for (let i = 0; i < Math.min(availabilities.length, 5); i++) {
            options.push({
                text: buildTimeOutputString(availabilities[i]),
                value: buildTimeOutputString(availabilities[i])
            });
        }
        return options;
    } else if (slot === 'APTime') {
        const options = [];
        options.push({
            text: `Morning`,
            value: `Morning`
        });
        options.push({
            text: `Evening`,
            value: `Evening`
        });
    }
}

function saveAppointment(date, schedule_obj, first_name, phone, outputSessionAttributes, callback) {

    var request = require('request'); //Import the NPM package
    var schedule_date = buildDateOutputString(date);
    var utc_date = buildUTCDateOutputString(date);
    first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
    var options = {
        "method": "post",
        url: "https://secure.bookedfusion.com/api/v1/calendar/save_calendar_appointment/?format=json",
        headers: {
            "Authorization": "Basic cm9vdEBnbWFpbC5jb206QkIyOTBBQTQ1MENJ",
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            'provider_id': 14,
            'service_id': 2,
            'start_date': schedule_date,
            'start_time': schedule_obj.start_time,
            'end_time': schedule_obj.end_time,
            'end_date': schedule_date,
            'first_name': first_name,
            'phone': phone,
        },

        //"rejectUnauthorized": false,
    };
    console.log('SaveOption=' + JSON.stringify(options.form));
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    request(options, function (err, response, body) {
        if (err) {
            console.log(err);
        } else {
            console.log(body);
            const appointmentId = outputSessionAttributes.appointmentId;
            if((appointmentId != "0") || (appointmentId != 0)){
                var options1 = {
                    "method": "delete",
                    url: "https://secure.bookedfusion.com/api/v1/calendar/" + appointmentId + "/",
                    headers: {
                        "Authorization": "Basic cm9vdEBnbWFpbC5jb206QkIyOTBBQTQ1MENJ",
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                };
                request(options1, function (err, response, body) {
                    if(err){
                        console.log(err);
                    } else {
                        callback(close(outputSessionAttributes, 'Fulfilled', {
                            contentType: 'PlainText',
                            content: `Thanks! Your appointment is scheduled for ${ schedule_obj.start_time } at ${ utc_date }. Have a wonderful day.`
                        }));
                    }
                })
                return;
            }
            callback(close(outputSessionAttributes, 'Fulfilled', {
                contentType: 'PlainText',
                content: `Thanks! Your appointment is scheduled for ${ schedule_obj.start_time } at ${ utc_date }. Have a wonderful day.`
            }));
        }
    });
}

function convertDate(date){
    if(!date)
        return null;
    var currentDate = new Date();
    return currentDate.getFullYear() + date.substr(4, date.length-4);
}

function makeAppointment_afterDay(intentRequest, callback) {
    const date = convertDate(intentRequest.currentIntent.slots.Date);
    let aptime = intentRequest.currentIntent.slots.APTime;
    let confirmation = intentRequest.currentIntent.confirmationStatus;
    const firstName = intentRequest.currentIntent.slots.FirstName;
    const phoneNumber = intentRequest.currentIntent.slots.PhoneNumber;
    const source = intentRequest.invocationSource;
    const outputSessionAttributes = intentRequest.sessionAttributes || {};
    const time = outputSessionAttributes.Time;
    const bookingMap = JSON.parse(outputSessionAttributes.bookingMap || '{}');
    let slots = intentRequest.currentIntent.slots;

    let bookingAvailabilities = bookingMap[`${date}`];

    if (bookingAvailabilities == null || bookingAvailabilities.length === 0) {
        slots.Date = null;
        slots.APTime = null;
        outputSessionAttributes.bookingMap = "";
        callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name, slots, 'Date', {
                contentType: 'PlainText',
                content: 'I am sorry, we  are busy during that time frame. Please choose another day.'
            },
            buildResponseCard('Specify Date', 'I am sorry, we are busy during that time frame. Please choose another day.',
                buildOptions('Date', date, null))));
        return;
    }
    if (!aptime && (!isToday(date))) {
        callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name, slots, 'APTime', {
                contentType: 'PlainText',
                content: ' Will you like to come in morning or evening?'
            },
            buildResponseCard('Specify Date', 'Will you like to come in morning or evening?',
                buildOptions('APTime', date, null))));
        return;
    }
    if (!aptime && (isToday(date))) {
        aptime = "evening";
        slots.APTime = aptime;
    }
    if (aptime) {
        let apt = "AM";
        if (aptime == "evening")
            apt = "PM"; //AM or PM
        let length = bookingAvailabilities.length;
        let tmp_array = [];
        tmp_array = bookingAvailabilities.slice();
        for (let i = 0; i < length; i++) {
            let obj = tmp_array[i];
            let start_time_length = tmp_array[i].start_time.length;
            let tmp_time = tmp_array[i].start_time.substring(start_time_length-2, start_time_length);
            if (tmp_time != apt){
                bookingAvailabilities.splice(bookingAvailabilities.indexOf(obj), 1);
                //console.log("Time="+tmp_time+"///APT="+apt+"Result=" + JSON.stringify(bookingAvailabilities));
            }
        }
        if (bookingAvailabilities.length == 0) {
            slots.Date = null;
            outputSessionAttributes.Time = null;
            slots.APTime = null;
            outputSessionAttributes.bookingMap = "";
            callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name, slots, 'Date', {
                    contentType: 'PlainText',
                    content: 'I am sorry, we are busy during that time frame. Please choose another day.'
                },
                buildResponseCard('Specify Date', 'I am sorry, we are busy during that time frame. Please choose another day.',
                    buildOptions('Date', date, null))));
            return;
        }
    }
    //const appointmentTypeAvailabilities = getAvailabilitiesForDuration(getDuration(appointmentType), bookingAvailabilities);
    
    if (!time) {
        const time = bookingAvailabilities[0].start_time;
        outputSessionAttributes.Time = time;
        callback(confirmIntent(outputSessionAttributes, intentRequest.currentIntent.name, slots, {
                contentType: 'PlainText',
                content: `${time} is available now. Does that work for you?`
            }));
        return;
    }
    if (confirmation != "None") {
        
        if (confirmation == "Confirmed") {
            callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name, slots, 'FirstName', {
                    contentType: 'PlainText',
                    content: 'Ok great, What is your FirstName?'
                },
                buildResponseCard('Specify FirstName', 'What is your FirstName?')));

            return;
        } else {
            
            let bookingAvailabilities = bookingMap[`${date}`];
            bookingAvailabilities.splice(0, 1);

            bookingMap[`${date}`] = bookingAvailabilities;
            outputSessionAttributes.bookingMap = JSON.stringify(bookingMap);

            if (bookingAvailabilities.length == 0) {
                //slots.Date = null;
                outputSessionAttributes.Time = null;
                //slots.APTime = null;
                outputSessionAttributes.bookingMap = "";
                callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name, slots, 'Choose', {
                    contentType: 'PlainText',
                    content: `I am sorry. Those are the only times we have available. Would you like to repeat them or choose another day?`
                }));
                return;
            }
            
            const time = bookingAvailabilities[0].start_time;
            outputSessionAttributes.Time = time; 
            callback(confirmIntent(outputSessionAttributes, intentRequest.currentIntent.name, slots, {
                    contentType: 'PlainText',
                    content: `${time} is available now. Does that work for you?`
                }));

            return;
        }
    }
    if (firstName && !phoneNumber) {
        callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name, slots, 'PhoneNumber', {
                contentType: 'PlainText',
                content: 'What is your PhoneNumber?'
            },
            buildResponseCard('Specify PhoneNumber', 'What is your PhoneNumber?')));
        return;
    }
    if (firstName && phoneNumber) {
        //callback(close(outputSessionAttributes, 'Fulfilled', { contentType: 'PlainText',
        //content: `Thanks! Your appointment is scheduled for ${buildTimeOutputString(time)} at ${date} Have a wonderful day.` }));
        saveAppointment(date, bookingAvailabilities[0], firstName, phoneNumber, outputSessionAttributes, callback);
        return;
    }
}

function deleteAppointment(outputSessionAttributes, appointmentId){
    var request = require('request'); //Import the NPM package
    const date = DateToString(new Date());
    const username = "root@gmail.com";
    const password = "BB290AA450CI";
    let auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
    var options = {
        "method": "delete",
        url: "https://secure.bookedfusion.com/api/v1/calendar/" + appointmentId + "/",
        headers: {
            "Authorization": auth,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
    };
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    request(options, function (err, response, body) {
        if (err) {
            console(err);
        } else {
            callback(close(outputSessionAttributes, 'Fulfilled', {
                contentType: 'PlainText',
                content: `Ok. your appointment is canceled. Have a wonderfull day.`
            }));
            return;
        }
    });
}

function cancelAvailable(date, time){
    const today = new Date();
    const aDate = new Date(date + " " + time);
    return ((today.getTime() - aDate.getTime()) / 1000) > 24*60*60;
}

// --------------- Functions that control the skill's behavior -----------------------

/**
 * Performs dialog management and fulfillment for booking a dentists appointment.
 *
 * Beyond fulfillment, the implementation for this intent demonstrates the following:
 *   1) Use of elicitSlot in slot validation and re-prompting
 *   2) Use of confirmIntent to support the confirmation of inferred slot values, when confirmation is required
 *      on the bot model and the inferred slot values fully specify the intent.
 */
function makeAppointment(intentRequest, callback) {

    let date = convertDate(intentRequest.currentIntent.slots.Date);
    let aptime = intentRequest.currentIntent.slots.APTime;
    const nSelect = intentRequest.currentIntent.slots.Choose;
    const confirmation = intentRequest.currentIntent.confirmationStatus;
    const firstName = intentRequest.currentIntent.slots.FirstName;
    const phoneNumber = intentRequest.currentIntent.slots.PhoneNumber;
    const source = intentRequest.invocationSource;
    const outputSessionAttributes = intentRequest.sessionAttributes || {};
    const time = outputSessionAttributes.Time;
    let bookingMap = JSON.parse(outputSessionAttributes.bookingMap || '{}');
    const appointmentId = outputSessionAttributes.appointmentId;
    const keyboard = outputSessionAttributes.keyboard;
    const appointmentDate = outputSessionAttributes.appointmentDate;
    const appointmentTime = outputSessionAttributes.appointmentTime;
    const customer_name   = outputSessionAttributes.customer_name;

    if (source === 'DialogCodeHook') {

        if((keyboard == 3) && (confirmation != "None")){
            if(confirmation == "Confirmed") {
                deleteAppointment(outputSessionAttributes, appointmentId);
                return;
            }
            return;
        }
        // Perform basic validation on the supplied input slots.
        let slots = intentRequest.currentIntent.slots;
        const validationResult = validateBookAppointment(date, aptime, nSelect);
        if (!validationResult.isValid) {
            slots[`${validationResult.violatedSlot}`] = null;
            callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name,
                slots, validationResult.violatedSlot, validationResult.message,
                buildResponseCard(`Specify ${validationResult.violatedSlot}`, validationResult.message.content,
                    buildOptions(validationResult.violatedSlot, date, bookingMap))));
            return;
        }
        if(nSelect){  //nSelect=1 -> Repeat them  nSelect=2 -> Choose another day.
            const selection = analNSelect(nSelect);
            if(selection == 1) { // Repeat them
                intentRequest.currentIntent.slots.Choose = null;
                //slots.Choose = null;
                bookingMap = {};
                if(intentRequest.sessionAttributes){
                    intentRequest.sessionAttributes.Time = null;
                    intentRequest.sessionAttributes.bookingMap = "";
                }
            }
            else if(selection == 2) { // Choose another day
                date = slots.Date = null;
                outputSessionAttributes.Time = null;
                slots.APTime = null;
                slots.Choose = null;
                //intentRequest.currentIntent.slots.Choose = null;
                outputSessionAttributes.bookingMap = "";
            }
            
        }
        if (!date) {
            if ( keyboard == 1 ) {
                callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name,
                    slots, 'Date', {
                        contentType: 'PlainText',
                        content: `What day would you like to come in?`
                    }));
            }
            else if( keyboard == 2 ) {
                outputSessionAttributes.keyboard = 1;
                var pAppointment = `I see you have an appointment on ${buildUTCDateOutputString(appointmentDate)}  at ${buildTimeOutputString(appointmentTime)}`;

                callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name, 
                    slots, 'Date', {
                    contentType: 'PlainText',
                    content: `${pAppointment}. What day would you like to reschedule too? Just say day or date.`
                }));

            }
            else if( keyboard == 3 ) {
                if (!cancelAvailable(appointmentDate, appointmentTime)) {
                    callback(close(outputSessionAttributes, 'Fulfilled', {
                            contentType: 'PlainText',
                            content: `I am sorry. We have a 24 hour calcellation policy. Have a wonderful day.`
                        }));
                    return;
                }
                var pAppointment = `I see you have an appointment on ${buildUTCDateOutputString(appointmentDate)}  at ${buildTimeOutputString(appointmentTime)}`;
                callback(confirmIntent(outputSessionAttributes, intentRequest.currentIntent.name, slots, {
                    contentType: 'PlainText',
                    content: `${pAppointment}. Do you want to cancel?`
                }));              
            }
            return;
        }

        if (date) {
            // Fetch or generate the availabilities for the given date.

            let bookingAvailabilities = bookingMap[`${date}`];
            if (bookingAvailabilities == null) {
                getAvailabilities(returnCallback, date, intentRequest, callback);
                //bookingAvailabilities = getAvailabilities(returnCallback, date);
                //bookingMap[`${date}`] = bookingAvailabilities;
                //outputSessionAttributes.bookingMap = JSON.stringify(bookingMap);
                return;
            } else {
                makeAppointment_afterDay(intentRequest, callback);
                return;////***********???????
            }



        }
        callback(delegate(outputSessionAttributes, slots));
        return;
    }
    //let bookingAvailabilities = bookingMap[`${date}`];
    //saveAppointment(date, bookingAvailabilities[0], firstName, phoneNumber, outputSessionAttributes, callback);
    return;
    /*callback(close(outputSessionAttributes, 'Fulfilled', {
        contentType: 'PlainText',
        content: `Okay, I have booked your appointment.  We will see you at ${time} on ${date}`
    }));*/
}

// --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    // console.log(JSON.stringify(intentRequest, null, 2));
    console.log(`dispatch userId=${intentRequest.userId}, intent=${intentRequest.currentIntent.name},
    inputTranscript=${intentRequest.inputTranscript}`);

    const name = intentRequest.currentIntent.name;
    const outputSessionAttributes = intentRequest.sessionAttributes || {};

    // Dispatch to your skill's intent handlers
    if (name === 'BrentwoodAppointment') {
        return makeAppointment(intentRequest, callback);
    }

    throw new Error(`Intent with name ${name} not supported`);
}

// --------------- Main handler -----------------------

function loggingCallback(response, originalCallback) {
    console.log("loggingCallback:"+JSON.stringify(response, null, 2));
    originalCallback(null, response);
}

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        // By default, treat the user request as coming from the America/New_York time zone.
        process.env.TZ = 'America/New_York';
        //console.log(`event.bot.name=${event.bot.name}`);
        console.log(`event=`+JSON.stringify(event));
        dispatch(event, (response) => loggingCallback(response, callback));
    } catch (err) {
        callback(err);
    }
};