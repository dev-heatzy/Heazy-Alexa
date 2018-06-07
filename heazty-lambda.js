'use strict';
const http = require('http');
const host = 'http://euapi.gizwits.com';
const gizwitsAppId = "c70a66ff039d41b4a220e198b0fcc8b3";
let token = "";

/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Welcome to Heatzy. ' +
        'Please tell me which mode you want heatzy to work by saying, turn the heatzy to mode comfort';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Please tell me which mode you want heatzy to work by saying, turn the heatzy to mode comfort';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for trying Heatzy. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

/**
 * Sets the color in the session and prepares the speech to reply to the user.
 */

function controlHeatzyInSession(intent, session, callback) {
    const cardTitle = intent.name;
    const mode = intent.slots.mode;
    let repromptText = '';
    let sessionAttributes = {};
    const shouldEndSession = true;
    let speechOutput = '';
    let modeInt = mode2int(mode.value);
    if (modeInt > -1) {
        console.log("token:",token);
		let hasDevices = false;
		getDevicesList(modeInt, token).then((devices)=>{
			for(var device in devices){
				controlDevice(device.did, modeInt, token);
				hasDevices = true;
			}
			speechOutput = `Heatzy has turned mode to ${mode.value}` ;
            repromptText = "which mode you want heatzy to work?";
			if(!hasDevices){
				speechOutput = "You have no device" ;
                repromptText = "You have no device";
			}
		}).catch((error) => {
		    speechOutput = "Error happens, please try again" ;
            repromptText = "Error happens, please try again";
		});
        
    } else {
        speechOutput = "I'm not sure what the mode is. Please try again.";
        repromptText = "I'm not sure what the mode is. You can tell me " +
            'which mode you want heatzy to work?';
    }

    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


function mode2int(mode){
	var result = -1;
	switch(mode){
		case "Confort":
		case "jour":
		case "soleil":
	    case "comfort":
		result = 0;
		break;

		case "Eco":
		case "Economique":
		case "nuit":
	    case "economic":
		result = 1;
		break;

		case "HG":
		case "Hors-gel":
		case "anti-gel":
	    case "unfreeze":
		result = 2;
		break;

		case "Off":
		case "Eteint":
		case "Stop":
		result = 3;
		break;

		default:
		result = -1;
		break;
	}
	return result;

}

function getDevicesList(mode, token){
	return new Promise((resolve, reject) => {
		let path = "/app/bindings";
		console.log('API Request: ' + host + path);
		let options={  
		   hostname: host,  
		   port:80,  
		   path:path,  
		   method:'GET',  
		   headers:{  
		    //'Content-Type':'application/x-www-form-urlencoded',  
		    'X-Gizwits-Application-Id':gizwitsAppId, 
		    'X-Gizwits-User-token':token  
		   }  
		};
		http.request(options, (res)=>{
			let body = ''; // var to store the response chunks
  			res.on('data', (d) => { body += d; }); // store each response chunk
  			res.on('end', () => {
  				console.log('BODY: ' + body);  
  				let response = JSON.parse(body);
  				resolve(response.devices);
  			});
  			res.on('error', (error) => {
		        reject(error);
		    });
		});
	});
}

function controlDevice(did, mode, token){
	let contents = JSON.stringify({
	    attrs:{
	    	'mode':mode
	    }
	});
	let path = "/app/control/" + did;
	let options = {
	 	host:host,
	    path:path,
	    method:'POST',
	    headers:{
	        'X-Gizwits-Application-Id':gizwitsAppId, 
		    'X-Gizwits-User-token':token,  
		    'Content-Length':contents.length
	    }
	};

	let req = http.request(options, function(res){
	    res.setEncoding('utf8');
	    res.on('data',function(data){
	        console.log("data:",data);
	    });
	});
	req.write(contents);
	req.end;
}
// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'MyColorIsIntent') {
        setColorInSession(intent, session, callback);
    } else if (intentName === 'WhatsMyColorIntent') {
        getColorFromSession(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else if(intentName == 'ControlHeatzy'){
        controlHeatzyInSession(intent, session, callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
   
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */
        if (event.session.user.accessToken == undefined) {
            const sessionAttributes = {};
            const speechletResponse = {
                "outputSpeech": {
                 "type": "PlainText",
                 "text": "You must have a heatzy account to use this skill. Please use the Alexa app to link your Amazon account with your heatzy Account."
              },
               "card": {
                 "type": "LinkAccount"
               },
                "shouldEndSession": false
            };
            callback(null, buildResponse(sessionAttributes, speechletResponse));
            return;
        }
        token = event.session.user.accessToken;
        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
