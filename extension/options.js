/*
 * $Id: options.js 36 2016-05-15 23:06:46Z  $
 */
 
var bg = chrome.extension.getBackgroundPage();
 
// -- Help the background page in retrieving devices and update the default device selection page 
 function init() {
 	// We could include the around 2500 lines of code from WebRTCs "adapter.js"
	// and then call "navigator.mediaDevices.getUserMedia()", but why should we?
	navigator.webkitGetUserMedia(
		{
			audio:true,
			video:false
		},
		function(stream) {
			log('getUserMedia: success (as it should be, when called from options full page)');
			navigator.mediaDevices.enumerateDevices()
				.then(update_device_options)
				.catch(errorCallback);
		},
		function(stream) {
			log('getUserMedia: error (as is expected, when run from options_ui)');
			navigator.mediaDevices.enumerateDevices()
				// Inspecting enumerated devices (that look fucky)
				.then((devices) => {
					devices.map(device => Object.fromEntries(Object.entries(device)))
						   .forEach(device => log('Enumerated device log:\n' + JSON.stringify(device, null, 4)) )
					update_device_options(devices)
				})
				.catch((e) => {
					log('init::getUserMedia error during enumerateDevices() after error in getUserMedia:\n\t"' + error + '"')
				})
				// .catch(errorCallback);
		}
	);
}

function errorCallback(error) {
	log('error: '+ error);
}

function log(message) {
	// logging to background console
	bg.console.log(
		'%coptions:%c ' +  message,
		'border-radius: 0.15em; background: #55FF2240; font-weight: 600;'
		+ 'padding: 0.15em 0.4em; ', ''
	)
}

function update_default_no(e) {
	log("update_default_no: " +  e.target.value);
	var default_no =  bg.document.getElementById("default_no");
	default_no.value = e.target.value;
	chrome.storage.local.set({"AP_default_no" : e.target.value});
}

/**
 * 
 * @param {MediaDeviceInfo[]} deviceInfos 
 */
function update_device_options(deviceInfos) {
	log('update_device_options: ' + deviceInfos.length + ' device(s) total (audio/video input/output)');
	var div = document.getElementById("device_options");
	var select = bg.document.getElementById("device_cache");

	log('update_device_options: ' + select.children.length + ' cached devices found before updating.')

	var default_no = bg.document.getElementById("default_no");
	while (div.firstChild) { div.removeChild(div.firstChild); }
	for (var i = 0; i !== deviceInfos.length; ++i) {
		var kind = deviceInfos[i].kind;
		var id = deviceInfos[i].deviceId;
		var text = deviceInfos[i].label;

		// Check if device has actual id and value before polluting DOM
		if(!(id && text))
		{
			log('update_device_options::add_device ABORTING ! Missing id or value (id: "' + (id || '') + '" value: "' + (value || '') + '")')
			continue
		}

		log('update_device_options::add_device Reviewing device:\n\t' + id || '[NO ID]' + ' - ' + text);
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
			input.onchange = function(e){update_default_no(e);};
			var textNode = document.createTextNode(text);
			var label = document.createElement("label");
			if (i == default_no.value) {
				log('update_device_options::current_default_no ' + i + ' - ' + id + ' - ' + text);
				input.checked = true;
			}			
			label.appendChild(input);
			label.appendChild(textNode);
			div.appendChild(label);
		}
	}
}

// -- main ---------------------------------------------------------------
init();
