/*
* HTTP Cloud Function.
*
* @param {Object} req Cloud Function request context.
* @param {Object} res Cloud Function response context.
*/


'use strict';
const http = require('http');
var querystring = require('querystring');
const host = 'euapi.gizwits.com';
const gizwitsAppId = "cbc5a738fc9441859803e3a2f3dbce11";
const DialogflowApp = require('actions-on-google').DialogflowApp; // Google Assistant helper library

const strUnknowMode = "unknow mode";

exports.heatzy = function heatzy (req, res) {

	let mode = req.body.result.parameters['Modes'];
    let device = req.body.result.parameters['Devices'];
    let zone = req.body.result.parameters['Zones'];

	// let productName = req.body.result.parameters['nomProduit'];
	let productName = "";

	let modeInt = mode2int(mode);
	if(modeInt == -1){
		res.setHeader('Content-Type', 'application/json');
  		res.send(JSON.stringify({ "speech": strUnknowMode, "displayText": strUnknowMode}));
	}else{
		let app = new DialogflowApp({request: req, response: res});
		if(app.getUser() === null){
			app.askForSignIn();
		}else{
			let token = app.getUser().access_token;
			if(token === null || token === ""){
				app.askForSignIn();
			}else{
				console.log("token:",token);
				getDevicesList(token).then((body)=>{
					let response = JSON.parse(body);
					for(var d in response.devices){
                        var group = response.devices[d].remark.split('|');
                        if (zone){
                            if (group[2].split("=")[1]==zone){
                                 controlDevice(response.devices[d].did, modeInt, token);
                            }
                        }
                        else{
                        if(device){
						if (response.devices[d].dev_alias==device){
                            controlDevice(response.devices[d].did, modeInt, token);
                            break;
                        }
                    }
						else{
						console.log('did: ' + response.devices[d].did);
						controlDevice(response.devices[d].did, modeInt, token);
                    }
                }
					}
				}).catch((error) => {
					console.error(error);
				    res.setHeader('Content-Type', 'application/json');
				    res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
				});
			}
		}
	}
};

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