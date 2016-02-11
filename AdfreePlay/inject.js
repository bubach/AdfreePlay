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
function addCustomPlayer(baseUrl, videoUrl, type, isLive) {
    if (type == "rtmp") {
        $f("h4xx0r", "http://bubach.net/swf/flowplayer-3.2.18.swf", {
            clip: { url: videoUrl, scaling: 'fit', provider: 'hddn' },
            plugins: { hddn: { url: "http://bubach.net/swf/flowplayer.rtmp-3.2.13.swf", netConnectionUrl: baseUrl } },
            canvas: {backgroundGradient: 'none'}
        });
    }
    if (type == "hls") {
        videoUrl = (videoUrl.indexOf('https') > -1) ? videoUrl.replace('https','http') : videoUrl;
        $f("h4xx0r", "http://bubach.net/swf/flowplayer-3.2.18.swf", {
            plugins: { 
                httpstreaming: { url: "http://bubach.net/swf/flashlsFlowPlayer-0.4.0.7.swf", hls_startfromlevel: 1}
            },
            clip: { 
                url: videoUrl,
                live: isLive,
                scaling: 'fit', 
                urlResolvers: ["httpstreaming","brselect"], 
                provider: "httpstreaming"
            },
            canvas: {backgroundGradient: 'none'}
        });
    }
    if (type == "mp4") {
        $f("h4xx0r", "http://bubach.net/swf/flowplayer-3.2.18.swf", {
            clip: { url: videoUrl, scaling: 'fit', type: 'video/mp4' },
            canvas: {backgroundGradient: 'none'}
        });
    }
}

/**
 * Try and clean up the console from random errors
 */
function killRandomCrapJS() {
    for (var i = 1; i < 99999; i++) {
        window.clearInterval(i);
    };
}

// main code
$(document).ready(function() {
    console.info("AdfreePlay plugin loaded!");

    if (isActive) {

        /**
         *  handle any tv4play requests
         **/
        if ($("#video-player-wrapper #player #player-container").length != 0) {
            var dataId = JSON.parse($("#video-player-wrapper #player #player-container").attr("data-asset")).id;
            $.get("http://prima.tv4play.se/api/web/asset/"+dataId+"/play?protocol=hls", function(xml) {
                var hlsUrl = $("item", xml).first().find("url").text();
                var isLive = $("live", xml).text();
                if (hlsUrl != "") {
                    $("#video-player-wrapper #player #player-container").remove();
                    $("div.video-size-buttons").remove();
                    $("#video-player-wrapper #player").html("").attr("id","h4xx0r").width("877px");
                    addCustomPlayer("", hlsUrl, "hls", isLive);
                    $("#h4xx0r").height("495px");
                    setTimeout(function(){
                        killRandomCrapJS();
                    }, 1000);
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

        /**
         * Aftonblaskan pwnage
         */
        if ($("#main-container #abtv-ad-lager").length != 0) {
            $("#main-container #abtv-ad-lager").remove();
            $(".display-ad").remove();
            var videoId = JSON.parse($(".desktop-main-col .player").attr("data-player-config")).videoId;
            $.getJSON("http://aftonbladet-play-metadata.cdn.drvideo.aptoma.no/video/"+videoId+".json", function(data) {
                videoId         = data.videoId;
                var firstThree  = videoId.substr(0, 3);
                var secondThree = videoId.substr(3, 3);
                var thirdThree  = videoId.substr(6, 3);
                var completeUrl = "http://abvodps-akamai.aftonbladet.se/production/streaming/global/"+firstThree+"/"+secondThree+"/"+thirdThree+"/"+videoId+"/640_360_800.mp4";
                var height      = $(".desktop-main-col .player").height();
                $(".desktop-main-col .player").html("").attr("id", "h4xx0r").height(height+'px');
                addCustomPlayer("", completeUrl, "mp4");
            });
        }

    }
});

/**
 *  handle any kanal5play/kanal9play/kanal11play (dplay) requests
 **/
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (isActive) {
            if (typeof request.dplay !== 'undefined') {
                var url = decodeURI(request.dplay.url);
                url = url.replace("stream_type=hds","stream_type=hls");
                $.getJSON(url, function(json) {
                    chrome.runtime.sendMessage({requestBlock: false}, function(response) {});
                    var baseUrl  = "";
                    var videoUrl = "";
                    killRandomCrapJS();

                    if (typeof json.hls != 'undefined') {
                        videoUrl = decodeURI(json.hls);
                        $.get(videoUrl, function(response) {
                            var regex  = /\".*\"[\S\s](.*)/;
                            var result = regex.exec(response);
                            videoUrl   = result[1];
                            if (videoUrl !== null) {
                                videoUrl = videoUrl.replace("https","http");
                                var height = $("#video-player-bg").height();
                                $("#video-player-bg").html('').attr("id","h4xx0r").height(height+'px');
                                addCustomPlayer(baseUrl, videoUrl, "hls");
                            }
                        });
                    }
                });
            }
        }
    }
);