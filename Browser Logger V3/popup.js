$(function () {

    function clearData() {
        chrome.storage.local.get(null, function (items) {
            for (var key in items) {
                if (key.startsWith('State')) { // or key.includes or whatever
                    chrome.storage.local.remove(key)
                }
                if (key.startsWith('paths')) { // or key.includes or whatever
                    chrome.storage.local.remove(key)
                }
                if (key.startsWith('sCounter')) { // or key.includes or whatever
                    chrome.storage.local.remove(key)
                }
                if (key.startsWith('path_urls')) { // or key.includes or whatever
                    chrome.storage.local.remove(key)
                }
            }
        })
    }

    $("#download").on("click", function () {
        chrome.storage.local.get(null, function (items) {
            // Convert object to a string.
            var result = encodeURIComponent(JSON.stringify(items));
            console.log(items);

            // Save as file
            var url = 'data:application/json;base64,' + btoa(result);
            chrome.downloads.download({
                url: url,
                filename: 'Tulsa/log.json'
            });
        });

        clearData();
    });

});
