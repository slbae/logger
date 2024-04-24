var highText = '';

var textArr = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (textArr.length > 0 && textArr) {
        textArr.push({ text: request.message, Time: Date() })
    } else {
        textArr = [{ text: request.message, Time: Date() }]
    }

    chrome.storage.local.get(function(items) {
        if (Object.keys(items).length > 0 && items.copyText) {
            items.copyText.push({ Text: request.message, Time: Date() });
        } else {
            items.copyText = [{ Text: request.message, Time: Date() }];
        }

        chrome.storage.local.set(items, function() {
            return true;
        });
    });
    return true;
});

//when extension is installed
chrome.runtime.onInstalled.addListener(async() => {
    await chrome.storage.local.clear(function() {
        var error = chrome.runtime.lastError;
        if (error) {
            console.error(error);
        }
    });

    await chrome.storage.local.set({ enabled: true })
    await chrome.storage.local.set({ "sessionCounter": 1 })
    await chrome.storage.local.set({ "path_urls": [] })
    await chrome.storage.local.set({ "searchQueries": [] })
    await chrome.storage.local.set({ "copiedText": [] })
    await chrome.storage.local.set({ "pastedText": [] })
    await chrome.storage.local.set({ "keydownEvents": [] })
    await chrome.storage.local.set({ "clickEvents": [] })
    await chrome.storage.local.set({ "scrollEvents": [] })
    await chrome.storage.local.set({ "googleLinks": [] })

    // Enable logging
    enable();

    // Call initialization functions
    crLog();
    savePath();
    setData();

    // Automatically set badge text to "ON" when the extension is installed
    await chrome.action.setBadgeText({ text: "ON" });

    // // Automatically enable logging when the extension is installed
    // await chrome.storage.local.set({ enabled: true })
    // await chrome.storage.local.set({ "sessionCounter": 1 })
    // await chrome.storage.local.set({ "path_urls": [] })
    // await chrome.storage.local.set({ "searchQueries": [] })
    // await chrome.storage.local.set({ "copiedText": [] })
    // await chrome.storage.local.set({ "pastedText": [] })
    // await chrome.storage.local.set({ "keydownEvents": [] })
    // await chrome.storage.local.set({ "clickEvents": [] })
    // await chrome.storage.local.set({ "scrollEvents": [] })
    // await chrome.storage.local.set({ "googleLinks": [] })
    // await chrome.action.setBadgeText({
    //     text: 'OFF'
    // });
})

//when browser is opened
chrome.runtime.onStartup.addListener(async function() {
    let enabled = await chrome.storage.local.get("enabled");
    if (enabled) {
        await chrome.action.setBadgeText({ text: "ON" });
    } else {
        await chrome.action.setBadgeText({ text: "OFF" });
    }
})

var enabled = false;
var path_urls = [];
var session = [];
var sessionCounter = 1;
var sNumber = 0;

function crLog() {
    var id = '';
    var ran_alias = '';

    //Get Session Info
    chrome.identity.getProfileUserInfo(function(userinfo) {

        id = userinfo.id;
        alias = "user_" + id.substring(0, 7);
        ran_alias = Math.ceil(Math.random(0, 9999) * 10000);
        if (id == '') {
            alias = "user_" + ran_alias;
        }

        // Get all the items stored in the storage
        chrome.storage.local.get(function(items) {
            if (Object.keys(items).length > 0 && items.user) {
                // The data array already exists, add to it the array
            } else {
                // The data array doesn't exist yet, create it
                items.user = [{ id: alias, Time: Date() }];
            }

            // Now save the updated items using set
            chrome.storage.local.set(items, function() {
                return true;
            });
        });

        chrome.storage.local.get(function(items) {
            chrome.storage.local.get(["sessionCounter"]).then((result) => {
                sessionCounter = result.sessionCounter;
                if (Object.keys(items).length > 0 && items.sCounter) {
                    sessionCounter++;
                    chrome.storage.local.set({ "sessionCounter": sessionCounter })
                    items.sCounter.push({ counter: sessionCounter });
                } else {
                    items.sCounter = [{ counter: sessionCounter }];
                }
                chrome.storage.local.set(items, function() {
                    return true;
                });
            });
        });
    });

    //List all the tabs visited after start of a session
    chrome.tabs.onActivated.addListener(async () => {
        chrome.storage.local.get(["sessionCounter", "path_urls", "enabled"]).then(async (result) => {
            let sessionCounter = result.sessionCounter;
            let path_urls = result.path_urls || []; // Initialize path_urls as an empty array if not present
            let isEnabled = result.enabled;
            if (isEnabled) {
                let path = await getCurrentTab(sessionCounter);
                if (path_urls.length == 0) {
                    path_urls.push({ Session_Counter: sessionCounter, Session_Start: Date() }, path);
                } else {
                    path_urls.push(path);
                }
                chrome.storage.local.set({ "path_urls": path_urls });
            }
        });
    });    

    // Updates the tab URL
chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
    chrome.storage.local.get(["path_urls", "enabled"], async function(result) {
        let isEnabled = result.enabled;
        if (isEnabled) {
            let path_urls = result.path_urls || []; // Initialize path_urls as an empty array if not present
            if (changeInfo.status === 'complete' && tab.status === 'complete') {
                let path = await getCurrentTab(sessionCounter);
                path_urls.push(path);
            }
            chrome.storage.local.set({ "path_urls": path_urls });
        }
    });
});

    chrome.idle.onStateChanged.addListener(function(state) {
        chrome.storage.local.get(function(items) {
            console.log(items)
            if (Object.keys(items).length > 0 && items.State) {
                items.State.push({ status: state, Time: Date() });
            } else {
                items.State = [{ status: state, Time: Date() }];
            }
            chrome.storage.local.set(items, function() {
                return true;
            });
        });
    });
}


//To save the path info in local storage
function savePath() {
    chrome.storage.local.get(["path_urls"]).then((result) => {
        path_urls = result.path_urls;
        path_urls.push({ Session_End: Date() });

        chrome.storage.local.get(function(items) {
            if (Object.keys(items).length > 0 && items.paths) {
                items.paths.push({ tab_url: path_urls });
            } else {
                items.paths = [{ tab_url: path_urls }];
            }
            chrome.storage.local.set(items, function() {
                return true;
            });
        });
    });
}

function setData() {
    var sessionCounter = 1;
    chrome.storage.local.get(function(items) {
        if (Object.keys(items).length > 0 && items.sCounter) {
            items.sCounter.push({ counter: sessionCounter++ });
        } else {
            items.sCounter = [{ counter: sessionCounter }];
        }
        chrome.storage.local.set(items, function() {
            return true;
        });
    });
}

chrome.runtime.onMessage.addListener(async(message, sender, sendResponse) => {
    //Turn ON the session
    if (message.message == "enable") {
        await chrome.action.setBadgeText({ text: "ON" });
        chrome.storage.local.get("enabled", async function(result) {
            result.enabled = true;
            await chrome.storage.local.set({ "enabled": result.enabled });
            setData();
            crLog();
            sendResponse("enable");
        });
    }
})

//Turn ON the session
function enable() {
    chrome.storage.local.set({ "enabled": [] }, function() {
        console.log("Data saved successfully");
    });
    chrome.storage.local.set({ "searchQueries": [] }, function() {
        console.log("Set Search Queries");
    });
    chrome.storage.local.set({ "copiedText": [] }, function() {
        console.log("Set Copied Text");
    });
    chrome.storage.local.set({ "pastedText": [] }, function() {
        console.log("Set Pasted Text");
    });
    chrome.storage.local.set({ "keydownEvents": [] }, function() {
        console.log("Set Keydown Events");
    });
    chrome.storage.local.set({ "clickEvents": [] }, function() {
        console.log("Set Click Events");
    });
    chrome.storage.local.set({ "scrollEvents": [] }, function() {
        console.log("Set Scroll Events");
    });
    chrome.storage.local.set({ "googleLinks": [] }, function() {
        console.log("Set Google Links");
    });
}

async function getCurrentTab(sessionCounter) {
    let queryOptions = { active: true, currentWindow: true };
    let tabs = await chrome.tabs.query(queryOptions);
    let path = { Tab_ID: tabs[0].id, URL: tabs[0].url, Time: Date() }
    return path;
}