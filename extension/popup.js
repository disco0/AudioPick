/*
 * $Id: popup.js 57 2016-05-21 19:35:55Z  $
 */
 
'use strict';
 
var bg = chrome.extension.getBackgroundPage();
var default_no = bg.document.getElementById("default_no");
var sink_no = default_no.value;

// -- Update the temporary device selection page 
 function init() {
	log('popup::init');
 	chrome.tabs.query({active: true, currentWindow: true},
		function(tabs) {
			var activeTab = tabs[0];
			log('popup::init Active tab: ' + activeTab.url || '[NO URL FOUND]')
			log('popup::init Sending message: report_sink_no');
			chrome.tabs.sendMessage(activeTab.id,
				{"message": "report_sink_no"},
				{'frameId': 0}, // only request from main frame
				function(response) {
					if (response) {
						log("popup::init::msg Received Response: " + response.sink_no);
						sink_no = response.sink_no;
					}
					navigator.mediaDevices.enumerateDevices()
						.then(update_device_popup)
						.catch(errorCallback);
				}
			);
		}
	)
}

function errorCallback(error) {
	log('error: ', error);
}

function log(message) {
	// logging to background console
	bg.console.log(
		'%cpopup:%c ' +  message,
		'border-radius: 0.15em; background: #FFCC4480; font-weight: 600;'
		+ 'padding: 0.15em 0.4em; ', ''
	)
}

function update_device_popup(deviceInfos) {
	log('update_device_popup: ' + deviceInfos.length + ' device(s) total (audio/video input/output)');
	var div = document.getElementById("device_options");
	var select = bg.document.getElementById("device_cache");
	while (div.firstChild) { div.removeChild(div.firstChild); }
	for (var i = 0; i !== deviceInfos.length; ++i) {
		var kind = deviceInfos[i].kind;
		var id = deviceInfos[i].deviceId;
		var text = deviceInfos[i].label;
		log('update_device_popup::device\n\t' + id + ' - ' + text);
		if (kind === 'audiooutput') {
			if (id == "default") {
				text = "System Default Device";
			} else if (id == "communications") {
				text = "System Default Communications Device";
			}
			var option = bg.document.getElementById(id);
			if (!text) {
				if (option && option.value) {
					text = option.value;
				} else {
					text = id;
				}
			}
			if (option) {
				option.value = text;
			} else {
				option = bg.document.createElement("option");
				option.id = id;
				option.value = text;
				select.appendChild(option);				
			}
			var input = document.createElement("input");
			input.type= "radio";
			input.name = "device";
			input.id = id;
			input.value = i;
			input.onchange = function(e){input_onchange(e);};
			var textNode = document.createTextNode(text);
			var label = document.createElement("label");
			if (i == sink_no) {
				log('update_device_popup::current_default_no: ' + i || '[NO SINK_NO]' + ' - ' + id || '[NO ID]' + ' - ' + text);
				input.checked = true;
			}			
			label.appendChild(textNode);
			label.appendChild(input);
			div.appendChild(label);
		}
	}
}

function update_default_no(e) {
	log("update_default_no: " +  e.target.value);
	var default_no =  bg.document.getElementById("default_no");
	default_no.value = e.target.value;
	chrome.storage.local.set({"AP_default_no" : e.target.value});
}

function input_onchange(e) {
	log('popup::input_onchange::browser_action Commit');
	var sink_no = e.target.value;	

	// Override per page logic for setting default
	log('popup::input_onchange::set_default OVERRIDE')
	log('popup::input_onchange::set_default Updating default:\n  Id: ' 
	    + e.target.id + '\nValue: ' + e.target.value)
	update_default_no(e)
	log('popup::closing')
	window.close();

	return 
	chrome.tabs.query({active: true, currentWindow: true},
		function(tabs) {
			var activeTab = tabs[0];
			log('popup::input_onchange Sending message: browser_action_commit, sink_no: ' + sink_no);
			chrome.tabs.sendMessage(activeTab.id, { // send to all frames without using options = {'frameId': N} 
				"message": "browser_action_commit",
				"sink_no":  sink_no
			});
			window.close();
		}
	);
};

// -- main ---------------------------------------------------------------
init();

