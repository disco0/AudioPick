/*
 * $Id: background.js 57 2016-05-21 19:35:55Z  $
 */

 'use strict';

 var stored_name = "System Default Device";
 var stored_no = 0;
 var extension_id = chrome.runtime.id;
 
 // Haha, it seems we no longer need getUserMedia() ...
chrome.contentSettings['microphone'].set({'primaryPattern':'*://' + extension_id + '/*','setting':'allow'});

chrome.runtime.onMessage.addListener(
	function (message, sender, sendResponse) {
		if (message.method == "AP_get_default_no") {
			log('Received message: ' + message.method + ' from frame ' + sender.frameId + ' on tab ' + sender.tab.id);
			if (sender.frameId != 0 ) {
				log('Asking top frame: report_sink_no');
				chrome.tabs.sendMessage(sender.tab.id,
					{"message": "report_sink_no"},
					{'frameId': 0},  // request from top frame
					function(response) {
						if (response) {
							var default_no = document.getElementById("default_no");
							var default_name = document.getElementById("default_name");
							log("Received Response from top frame: " + response.sink_no + ", " + response.sink_name);
							if (response.sink_no != 0) {
								log('Reply to sub frame ' + sender.frameId + ' with: top sink_no: ' + response.sink_no + ' sink_name: ' + response.sink_name);
								sendResponse({'default_no': response.sink_no, 'default_name': response.sink_name});
							} else {
								log('Reply to sub frame ' + sender.frameId + ' with: default_no: ' + default_no.value);
								sendResponse({'default_no': default_no.value, 'default_name': default_name.value});
							}
						}
					}
				);
			} else {
				var default_no = document.getElementById("default_no");
				var default_name = document.getElementById("default_name");
				log('Reply with: default_no: ' + default_no.value + ' default_name: ' + default_name.value);
				sendResponse({'default_no': default_no.value, 'default_name': default_name.value});
			}
		} else if (message.method == "AP_help_with_GUM") {
			log('Received message: ' + message.method + ', primaryPattern: ' + message.primaryPattern);
			chrome.contentSettings['microphone'].set({'primaryPattern': message.primaryPattern,'setting':'allow'});
			log('Reply with: result: ' + 'Have fun!');
			sendResponse({'result': 'Have fun!'});
		}
		return true;
    }
 )
 
// -- Initialize device_cache (list of available devices)
function init() {
	var default_no = document.getElementById("default_no");
	default_no.value = stored_no;
	var default_name = document.getElementById("default_name");
	default_name.value = stored_name;
	navigator.mediaDevices.enumerateDevices()
		.then(update_device_cache)
		.catch(errorCallback);
}

function errorCallback(error) {
	log('error: '+ error);
}

function log(message) {
	console.log('background: ' +  message);
}
                                                                                                                                                                                                                                                                                                           
function update_device_cache(deviceInfos) {
	var default_no = document.getElementById("default_no");
	var default_name = document.getElementById("default_name");
	var select = document.getElementById('device_cache');
	log('update_device_cache: ' + deviceInfos.length + ' device(s) total (audio/video input/output)');
	for (var i = 0; i !== deviceInfos.length; ++i) {
		var kind = deviceInfos[i].kind;
		var id = deviceInfos[i].deviceId;
		var text = deviceInfos[i].label;
		//log('device: ' + id + ' - ' + text);
		if (kind === 'audiooutput') {
			if (id == "default") {
				text = "System Default Device";
				if (!stored_name) {
					stored_name = text;
				}
			} else if (id == "communications") {
				text = "System Default Communications Device";
			}
			if (stored_name) {
				if (stored_name == text) {
					stored_no = i;
					default_no.value = stored_no;
					default_name.value = stored_name;
				}
			} else if (stored_no) {
				if (stored_no == i || stored_no == 0) {
					stored_name = text;
					default_no.value = stored_no;
					default_name.value = stored_name;
				}
			}
			//log('audiooutput: ' + id + ' - ' + text);
			if (text) { // only update/write cache, when we have a device label
				var option = document.getElementById(id)
				if (option) {
					option.id = id;
					option.value = text;
				} else {
					option = document.createElement("option");
					option.id = id;
					option.value = text;
					select.appendChild(option);
				}
			}
		}
	}
}

// -- main ---------------------------------------------------------------
chrome.storage.local.get("AP_default_name",
	function(result) {
		stored_name = result["AP_default_name"];
		if (!stored_name) {
			log('Name not stored, getting stored_no');
			chrome.storage.local.get("AP_default_no",
				function(result) {
					stored_no = result["AP_default_no"];
					if (!stored_no) { stored_no = 0;}
					log('stored_no: '+ stored_no);
					init();
				}
			);
		} else {
			log('stored_name: ' + stored_name);
			init();
		}
	}
);
