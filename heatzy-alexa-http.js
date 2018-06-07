

var express = require("express");
var app = express();
var util = require("util");
var bodyParser = require('body-parser');

var request = require('request')






let sessionId = null
let endConv = false
let done = null

// Format reply for Alexa
let alexaReply = (text) => {
  done.send({
    response: {
      outputSpeech: {
        type: 'PlainText',
        text: text
      },
      shouldEndSession: endConv
    }
  })

  // Always set endConv back to false
  endConv = false
}
/*

app.post('/heatzyAlexa/mode',function(req,res){
   // var json = JSON.stringify(req);
   // console.log("req is: "+JSON.stringify(json));
    
    //console.log(req.headers);
    //console.log(event);

    if (req.session.user.accessToken == undefined) {
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
        //callback(null, buildResponse(sessionAttributes, speechletResponse));
        res.json(buildResponse(sessionAttributes, speechletResponse));
        return;
    }
    //console.log(util.inspect(req, false, null));
    //var token = req.session.context.System.user.accessToken;
    //var mode = 
   // res.send(JSON.parse({State: true}));

})
*/
//https://oauth.gizwits.com/oauth/authorize
//client_ID:151ffe143d6746c7b07b171ca06a02ba



function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    done.send( {
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
    })
    endConv = false;
}

function buildResponse(sessionAttributes, speechletResponse) {
    done.send( {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    })
    endConv = false;
}

function mode2int(mode){
	var result = -1;
	switch(mode){
		case "Confort":
		case "jour":
		case "soleil":
		result = 0;
		break;

		case "Eco":
		case "Economique":
		case "nuit":
		result = 1;
		break;

		case "HG":
		case "Hors gel":
		case "anti gel":
     	case "flocon":
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

function getDevicesList(token){
	return new Promise((resolve, reject) => {
		let path = "/app/bindings";
		console.log('API Request: ' + host + path);
		let options={  
		   hostname: host,  
		   path:path,  
		   method:'GET',  
		   headers:{  
		    'Content-Type':'application/x-www-form-urlencoded',  
		    'X-Gizwits-Application-Id':gizwitsAppId, 
		    'X-Gizwits-User-token':token  
		   }  
		};
		http.get(options, (res)=>{
			let body = ''; // var to store the response chunks
			res.setEncoding('utf-8');
  			res.on('data', (d) => { body += d; }); // store each response chunk
  			res.on('end', () => {
  				resolve(body);
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
	    	mode:new Number(mode)
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
	console.log('API POST: ' + host + path + contents);

	var req = http.request(options, function(res){
	    res.setEncoding('utf8');
	    let body = ''; 
	    res.on('data',function(data){
	       body += data;
	    });
	    res.on('end', ()=>{
	    	console.log(body);
	    });
	    res.on('error', (error)=>{
			console.error(err);
	    });
	});
	req.write(contents);
	req.end;
}

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
		    speechOutput = "Error happens, please try again";
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


function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if(intentName == 'ControlHeatzy'){
        controlHeatzyInSession(intent, session, callback);
    } else {
        throw new Error('Invalid intent');
    }
}
//app.listen(8080);
console.log("Le port is 8080");

exports.heatzy = (event, doneFct) => {
    console.log('Received event:', JSON.stringify(event, null, 2))

    console.log('the data is : '+ JSON.stringify(event));

    done = doneFct
    
      let helloReplies = [
        'Hello! How can I help you today?',
        'Welcome back. What do you need?'
      ]
    
      if (event.request) {
        console.log('Alexa message received')
        // Alexa Message
        if (event.request.type == 'LaunchRequest') {
          console.log('Trigger word received')
          // User says invovation word, reply hello
          alexaReply(helloReplies[Math.floor(Math.random() * helloReplies.length)])
        } else if (event.request.type === 'IntentRequest') {
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
                //callback(null, buildResponse(sessionAttributes, speechletResponse));
                buildResponse(sessionAttributes, speechletResponse);
                return;
            }
            else{
            var token = event.session.user.accessToken;
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                   // callback(null, buildResponse(sessionAttributes, speechletResponse));
                   buildResponse(sessionAttributes, speechletResponse);
                });
            }
        }
      }
  
   }

