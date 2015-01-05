/**
 *  extension on/off check
 **/
var isActive;
chrome.runtime.sendMessage({isActive: ""}, function(response) {
	isActive = response.isActive;
});

/**
 *  adds the custom player to newly formed h4xx0r element in DOM 
 **/
function addCustomPlayer(baseUrl, videoUrl, type) {
	if (type == "rtmp") {
	    $f("h4xx0r", "http://releases.flowplayer.org/swf/flowplayer-3.2.18.swf", {
	        clip: { url: videoUrl, scaling: 'fit', provider: 'hddn' },
	        plugins: { hddn: { url: "http://releases.flowplayer.org/swf/flowplayer.rtmp-3.2.13.swf", netConnectionUrl: baseUrl } },
	        canvas: {backgroundGradient: 'none'}
	    });
	}
	if (type == "hls") {
		$f("h4xx0r", "http://releases.flowplayer.org/swf/flowplayer-3.2.18.swf", {
		    plugins: { httpstreaming: { url: "http://flash.flowplayer.org/media/swf/flashlsFlowPlayer-0.3.4.swf", hls_startfromlevel: 1}},
			clip: { url: videoUrl, scaling: 'fit', urlResolvers: ["httpstreaming","brselect"], provider: "httpstreaming"},
			canvas: {backgroundGradient: 'none'}
		});
	}
}

// main code
$(document).ready(function() {
	console.info("AdfreePlay plugin loaded!");

	if (isActive) {

		/**
		 *  handle any tv4play requests
		 **/
		if ($("#video-player-wrapper #player #player-container").length != 0) {
			var dataId = $("#video-player-wrapper #player #player-container").attr("data-vid");
			$.get("http://prima.tv4play.se/api/web/asset/"+dataId+"/play?protocol=hls", function(xml) {
				var hlsUrl = $("item", xml).first().find("url").text();
	            if (hlsUrl != "") {
                    $("#video-player-wrapper #player #player-container").remove();
                    $("div.video-size-buttons").remove();
                    $("#video-player-wrapper #player").html("").attr("id","h4xx0r").width("100%");
	                addCustomPlayer("", hlsUrl, "hls");
	            }
			});
		}

		/**
		 *  handle any tv3play/tv6play/tv8play/tv10play requests
		 **/
		if ($("section.video-player-container").length != 0) {
	        var dataId = $("section.video-player-container").attr("data-id");
	        $.getJSON("http://playapi.mtgx.tv/v3/videos/stream/"+dataId, function(data) {
	            var hlsUrl = "";
	            if (typeof data.streams != 'undefined') {
	                if (typeof data.streams.hls != 'undefined' && data.streams.hls != null) {
	                    hlsUrl  = data.streams.hls;
	                }
	            }
	            if (hlsUrl != "") {
	            	var height = $("div.video-player-content").height();
                    $("div.video-player-content").html("").attr("id","h4xx0r").height(height+"px");
	                addCustomPlayer("", hlsUrl, "hls");
	            }
	        });
	    }

	}
});

/**
 *  handle any kanal5play/kanal9play/kanal11play requests
 **/
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
    	if (isActive) {
	    	if (typeof request.kanal5 !== 'undefined') {
	        	$.getJSON(request.kanal5.url, function(json) {
					chrome.runtime.sendMessage({requestBlock: false}, function(response) {});
			        var baseUrl  = "";
			        var videoUrl = "";

			        $(".sbs-notification-bar-fixed").hide();
					// kill old JS not relevant to our needs.
					for (var i = 1; i < 99999; i++) {
						window.clearInterval(i);
					};

			        if (typeof json.streamBaseUrl != 'undefined') {
			            baseUrl = json.streamBaseUrl;
			        }
			        if (typeof json.streams != 'undefined') {
			            var tmpBitrate = 0;
			            for (var index = 0; index < json.streams.length; ++index) {
			                if (json.streams[index].bitrate > tmpBitrate) {
			                    tmpBitrate = json.streams[index].bitrate;
			                    videoUrl   = json.streams[index].source;
			                }
			            }
			        }
			        if (baseUrl != "" && videoUrl != "") {
			        	$("a").removeClass("ajax");
			            $(".sbs-player-home").html('').attr("id","h4xx0r");
			            addCustomPlayer(baseUrl, videoUrl, "rtmp");
			        }
				});
	        }
    	}
    }
);