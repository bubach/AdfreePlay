/**
 *  extension on/off flag
 **/
var isActive = true;

/**
 *  avoid recursive XHR listening
 **/
var requestActive = false;

/**
 *  extension on/off button support
 **/
chrome.browserAction.onClicked.addListener(function() {
    chrome.browserAction.getTitle({}, function(result) {
        if (result == "Turn AdfreePlay Off") {
            chrome.browserAction.setTitle({title:'Turn AdfreePlay On'});
            chrome.browserAction.setIcon({path: 'iconinactive128.png'});
            isActive = false;
        } else {
            chrome.browserAction.setTitle({title:'Turn AdfreePlay Off'});
            chrome.browserAction.setIcon({path: 'iconactive128.png'});
            isActive = true;
        }
        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.executeScript(tab.id, {code: 'window.location.reload();'});
        });
    });
});

/**
 *  listen for content script messages
 **/
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (typeof request.isActive !== 'undefined') {
            sendResponse({isActive: isActive});
        }
        if (typeof request.requestBlock !== 'undefined') {
            requestActive = request.requestBlock;
        }
    }
);

/**
 * detect certain XHR calls that we are interested in
 **/
chrome.webRequest.onCompleted.addListener(
    function(response) {
        if (response.url.match(/\/secure\/api\/v2\/user\/authorization/)) {
            if (isActive === true && requestActive === false) {
                requestActive = true;
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {dplay: response}, function(response) {});
                });
            }
        }
        if (isActive === true && response.url.match(/MTG_Brightcove_HTML5\/AdManager.js/)) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {viafree: response}, function(response) {});
            });
        }
        return;
    },
    { urls: ["<all_urls>"] }, ["responseHeaders"]
);