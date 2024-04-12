// content.js has access to the DOM of the web pages they are injected into and can manipulate
// the page's content, listen for events, and interact with the webpage's JavaScript. It extends
// the functionality of web pages by injecting custom JavaScript code into them.

// Gets the domain name from a given url (ex: google.com, stackoverflow.com, etc.)
function extractDomain(url) {
    // Remove protocol (http:// or https://) and www subdomain if present
    var domain = url.replace(/(https?:\/\/)?(www\.)?/, '');
    // Extract domain name (everything before the first slash)
    domain = domain.split('/')[0];
    return domain;
}

// Fix this to only track content when extension is enabled.
// Currently tracking clicks, key presses, copy/pasted text, input searches, and scrolling behavior.
chrome.storage.local.get("enabled", function (result) {
    let enabled = result.enabled;
    if (enabled) {
        // Google web scraping 
        window.addEventListener('load', google);

        // Add event listeners to track desired events
        document.addEventListener('click', trackClick);
        document.addEventListener('keydown', trackKeydown);
        document.addEventListener('copy', trackCopy);
        document.addEventListener('paste', trackPaste);
        window.addEventListener('load', trackSearch);
        //window.addEventListener('load', printLists); // for testing
        window.addEventListener('scroll', trackScroll);
        window.addEventListener('beforeunload', saveScrollInfo); // Listen for tab close event to save the max scroll depth and avg speed
    }
});

// Web scrape google page
function google() {
    if (extractDomain(window.location.href) === "google.com") {
        // Get the element with id "rso"
        let rsoElement = document.getElementById("rso");
        const url = window.location.href;
        let links = []; // All links and their titles from google search
        
        if (rsoElement) {
            // Get all div children of the rso div
            let divChildren = rsoElement.querySelectorAll('div');
            // Convert NodeList to array
            let divList = Array.from(divChildren);
            // Find title and url link for each google link and add to links list
            divList.forEach(div => {
                let aTag = div.querySelector('a');
                let h3 = div.querySelector('h3');
                if (aTag && aTag.getAttribute('href') && h3 && h3.textContent) {
                    const link = {
                        title: h3.textContent,
                        urlLink: aTag.getAttribute('href')
                    }
                    // Check if a link with the same title and urlLink already exists in links array
                    if (!links.some(existingLink => existingLink.title === link.title && existingLink.urlLink === link.urlLink)) {
                        links.push(link);
                    }
                }
            });

            const googleSearch = {
                timestamp: Date(),
                URL: url,
                links: links
            };            

            chrome.storage.local.get({ googleLinks: [] }, function (result) {
                let googleLinks = result.googleLinks;
                googleLinks.push(googleSearch);
                // Update googleLinks in chrome.storage.local
                chrome.storage.local.set({ googleLinks: googleLinks });
            });
        }
        else {
            console.log("Element with id 'rso' not found.");
        }
    }
}

// Tracks all pasted text and adds them to the pastedText list in local storage.
function trackPaste(event) {
    // Track the content being pasted
    let text = event.clipboardData.getData('text');

    // Retrieve existing pastedText from local storage
    chrome.storage.local.get({ pastedText: [] }, function (result) {
        let pastedText = result.pastedText;
        if (text) {
            const pasteEvent = {
                timestamp: Date(),
                pastedText: text
            };
            pastedText.push(pasteEvent);
            // Update pastedText in chrome.storage.local
            chrome.storage.local.set({ pastedText: pastedText });
        }
    });
}

// Tracks all copied text and adds them to the copiedText in local storage.
function trackCopy() {
    // Retrieve existing copiedText from local storage
    chrome.storage.local.get({ copiedText: [] }, function (result) {
        let copiedText = result.copiedText;
        // Track the content being copied
        let text = window.getSelection().toString();

        if (text) {
            const copyEvent = {
                timestamp: Date(),
                URL: window.location.href,
                copiedText: text
            };
            copiedText.push(copyEvent);
            // Update copiedText in chrome.storage.local
            chrome.storage.local.set({ copiedText: copiedText });
        }
    });
}

// Tracks all searches and adds them to the seachQueries in local storage.
function trackSearch() {
    // Find the search input element
    const searchInput = document.querySelector('input[name="q"]');
    // Check if the search input element exists
    if (searchInput) {
        // Get the value of the search input
        const searchQuery = searchInput.value;
        if (searchQuery) {
            const searchEvent = {
                timestamp: Date(),
                URL: window.location.href,
                searchQuery: searchQuery
            };

            // Retrieve existing searchQueries from local storage
            chrome.storage.local.get({ searchQueries: [] }, function (result) {
                let searchQueries = result.searchQueries;
                searchQueries.push(searchEvent);
                // Update searchQueries in chrome.storage.local
                chrome.storage.local.set({ searchQueries: searchQueries });
            });
        }
    }
}

// Tracks all click events and adds them to the clickEvents in local storage.
function trackClick(event) {
    // Get the element that was clicked
    var clickedElement = event.target;
    // Get the name of the clicked element
    var elementName = clickedElement.textContent.trim();

    // Retrieve existing clickEvents from local storage
    chrome.storage.local.get({ clickEvents: [] }, function (result) {
        var clickEvents = result.clickEvents;
        if (elementName) {
            const clickEvent = {
                timestamp: Date(),
                element: elementName,
                tag: clickedElement.tagName.toLowerCase()
            };
            clickEvents.push(clickEvent);
            // Update clickEvents in chrome.storage.local
            chrome.storage.local.set({ clickEvents: clickEvents });
        }
    });
}


// Tracks all keydown events and adds them to the keydownEvents in local storage.
function trackKeydown(event) {
    // Get the key that the user presses
    var keyPressed = event.key;

    // Retrieve existing keydownEvents from local storage
    chrome.storage.local.get({ keydownEvents: [] }, function (result) {
        var keydownEvents = result.keydownEvents;
        if (keyPressed) {
            const keydown = {
                timestamp: Date(),
                URL: window.location.href,
                key: keyPressed
            };
            keydownEvents.push(keydown);
            // Update keydownEvents in chrome.storage.local
            chrome.storage.local.set({ keydownEvents: keydownEvents });
        }
    });
}

// Tracks scrolling behavior by depth and speed
function trackScroll() {
    trackScrollSpeed(); // measured in pixels per second
    trackScrollDepth(); // (1 = the whole page was scrolled to)
}

// Initialize variables to track last scroll time and scroll position
var lastScrollTop = 0;
var lastScrollTime = null;

// Initialize variables to track cumulative scroll distance and time spent scrolling
var totalScrollDistance = 0;
var totalTimeScrolled = 0;

// Tracks the user's scrolling speed (only Y position) measured in pixels per second
function trackScrollSpeed() {
    var currentScrollTop = window.scrollY;
    var currentTime = new Date().getTime();

    if (lastScrollTime !== null) {
        // Calculate scroll distance
        var deltaTime = (currentTime - lastScrollTime) / 1000; // Convert milliseconds to seconds
        var scrollDistance = Math.abs(currentScrollTop - lastScrollTop);

        // Update total scroll distance and time spent scrolling
        totalScrollDistance += scrollDistance;
        totalTimeScrolled += deltaTime;
    }

    lastScrollTop = currentScrollTop;
    lastScrollTime = currentTime;
}

// Max horizontal and vertical depth of the current tab user scrolled to during entire tab session
let maxHDepth = 0;
let maxVDepth = 0;

// Tracks scroll depth  (1 = the whole page was scrolled to)
function trackScrollDepth() {
    var docHeight = document.documentElement.scrollHeight;
    var docWidth = document.documentElement.scrollWidth;
    var windowHeight = window.innerHeight;
    var windowWidth = window.innerWidth;

    // Calculate scroll depth
    var vScrollDepth = (window.scrollY + windowHeight) / docHeight;
    var hScrollDepth = (window.scrollX + windowWidth) / docWidth;

    // Store max scroll depth
    if (vScrollDepth > maxVDepth) {
        maxVDepth = vScrollDepth;
    }

    if (hScrollDepth > maxHDepth) {
        maxHDepth = hScrollDepth;
    }

}

// Print scroll depth and average speed when tab closes
function saveScrollInfo() {
    // Calculate average scroll speed in pixels per second
    let avgScrollSpeed = 0;
    if (totalTimeScrolled > 0) {
        avgScrollSpeed = totalScrollDistance / totalTimeScrolled;
    }

    // Retrieve existing scrollEventsMap from local storage
    chrome.storage.local.get({ scrollEvents: [] }, function (result) {
        var scrollEvents = result.scrollEvents;
        const scroll = {
            URL: window.location.href,
            vScrollDepth: maxVDepth,
            hScrollDepth: maxHDepth,
            avgSpeed: avgScrollSpeed
        };

        scrollEvents.push(scroll);
        // Update scrollEvents in chrome.storage.local
        chrome.storage.local.set({ scrollEvents: scrollEvents });
    });
}

// For testing print the info logged so far
function printLists() {
    chrome.storage.local.get({ searchQueries: [] }, function (result) {
        console.log('Search Queries List: ', result.searchQueries);
    });

    chrome.storage.local.get({ copiedText: [] }, function (result) {
        console.log('Copied Text List: ', result.copiedText);
    });

    chrome.storage.local.get({ pastedText: [] }, function (result) {
        console.log('Pasted Text List: ', result.pastedText);
    });

    chrome.storage.local.get({ clickEvents: [] }, function (result) {
        console.log('Click Events List: ', result.clickEvents);
    });

    chrome.storage.local.get({ keydownEvents: [] }, function (result) {
        console.log('Keydown Events List: ', result.keydownEvents);
    });

    chrome.storage.local.get({ scrollEvents: [] }, function (result) {
        console.log('Scroll Events List: ', result.scrollEvents);
    });
}
