/**
 *  extension on/off check
 **/
var isActive;
chrome.runtime.sendMessage({isActive: ""}, function(response) {
    if (typeof response === 'undefined') {
        isActive = true;
    } else {
        isActive = response.isActive;
    }
});

/**
 *  adds the custom player to newly formed h4xx0r element in DOM
 **/
function addCustomPlayer(baseUrl, videoUrl, type, isLive) {
    if (type == "rtmp") {
        $f("h4xx0r", "https://bubach.net/swf/flowplayer-3.2.18.swf", {
            clip: { url: videoUrl, scaling: 'fit', provider: 'hddn' },
            plugins: { hddn: { url: "https://bubach.net/swf/flowplayer.rtmp-3.2.13.swf", netConnectionUrl: baseUrl } },
            canvas: {backgroundGradient: 'none'}
        });
    }
    if (type == "hls") {
        videoUrl = (videoUrl.indexOf('https') > -1) ? videoUrl.replace('https','http') : videoUrl;
        $f("h4xx0r", "https://bubach.net/swf/flowplayer-3.2.18.swf", {
            plugins: {
                httpstreaming: { url: "https://bubach.net/swf/flashlsFlowPlayer-0.4.0.7.swf", hls_startfromlevel: 1}
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
        $f("h4xx0r", "https://bubach.net/swf/flowplayer-3.2.18.swf", {
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


/**
 * So I guess document ready can't be trusted... Fun times.
 */
var triggerHandle = null;
function intervalTrigger() {
    var triggerCount = 0;
    triggerHandle = window.setInterval(function() {

        /**
         *  handle any tv4play requests
         **/
        if ($("#signUpDialog").length != 0) {
            $("#signUpDialog").hide();
        }
        if ($("#signup-overlay").length != 0) {
            $("#signup-overlay").hide();
        }
        if ($("#video-player-wrapper").length != 0) {
            if ($("#tv4video-id").length == 0) {
                var injectedCode = function() {
                    var dataId = JSON.parse(window.prefetched[0].data).data.videoAsset.id;
                    $("body").append('<div id="tv4video-id">'+dataId+'</div>');
                };

                var script = document.createElement('script');
                script.textContent = '(' + injectedCode + ')()';
                (document.head||document.documentElement).appendChild(script);
                script.parentNode.removeChild(script);
            } else {
                var dataId = $("#tv4video-id").text();

                $.get("https://prima.tv4play.se/api/web/asset/"+dataId+"/play?protocol=hls3", function(xml) {
                    var hlsUrl = $("item", xml).first().find("url").text();
                    var isLive = $("live", xml).text();
                    if (hlsUrl != "") {
                        var containerWidth  = $("#player-container").width();
                        var containerHeight = $("#player-container").height();
                        if (containerWidth < 500) {
                            containerWidth  = 877;
                            containerHeight = 495;
                        }
                        $('div.module-center-wrapper').prepend('<div id="h4xx0r"></div>');

                        addCustomPlayer("", hlsUrl, "hls", isLive);
                        $("#h4xx0r").height(containerHeight + "px");
                        window.clearInterval(triggerHandle);
                        setTimeout(function(){
                            killRandomCrapJS();
                            $("#signUpDialog").hide();
                        }, 1000);
                    }
                });
            }
        }

        /**
         * Aftonblaskan pwnage
         */
        if ($("#main-container #abtv-ad-lager").length != 0) {
            $("#main-container #abtv-ad-lager").remove();
            $(".display-ad").remove();
            var videoId = JSON.parse($(".desktop-main-col .player").attr("data-player-config")).videoId;
            $.getJSON("https://aftonbladet-play-metadata.cdn.drvideo.aptoma.no/video/"+videoId+".json", function(data) {
                videoId         = data.videoId;
                var firstThree  = videoId.substr(0, 3);
                var secondThree = videoId.substr(3, 3);
                var thirdThree  = videoId.substr(6, 3);
                var completeUrl = "https://abvodps-akamai.aftonbladet.se/production/streaming/global/"+firstThree+"/"+secondThree+"/"+thirdThree+"/"+videoId+"/640_360_800.mp4";
                var height      = $(".desktop-main-col .player").height();
                $(".desktop-main-col .player").html("").attr("id", "h4xx0r").height(height+'px');
                addCustomPlayer("", completeUrl, "mp4");
                window.clearInterval(triggerHandle);
            });
        }
        triggerCount++;
        if (triggerCount > 10) {
            window.clearInterval(triggerHandle);
        }
    }, 1000);
};

// main code
$(document).ready(function() {
    console.info("AdfreePlay plugin loaded!");

    if (isActive) {
        intervalTrigger();
    }
});

/**
 *  videojs freewheel code
 *     some next level BS needed right here, as with most things JavaScript.
 */
function killFreewheel()
{
    var injectedCode = function() {
        if (typeof window.videojs !== 'undefined') {
            for (var player in window.videojs.players) {
                window.videojs.players[player].freewheel.slots = [];
                window.setInterval(function() {
                    var freewheel = window.videojs.players[player].freewheel;
                    if (typeof freewheel._currentSlot !== 'undefined' && freewheel._currentSlot !== null) {
                        freewheel._currentSlot.skipCurrentAd();
                    }
                }, 200);
            }
        }
    };

    var script = document.createElement('script');
    script.textContent = '(' + injectedCode + ')()';
    (document.head||document.documentElement).appendChild(script);
    script.parentNode.removeChild(script);
}

/**
 *  handle any kanal5play/kanal9play/kanal11play (dplay) requests
 *  also listener for viafree AdManager event
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
            if (typeof request.viafree !== 'undefined') {
                killFreewheel();
            }
        }
    }
);
