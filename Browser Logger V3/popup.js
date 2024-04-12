$(function() {

    updateLabel();

    function clearData() {
        chrome.storage.local.get(null, function(items) {
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

    //Update the Button Label
    function updateLabel() {
        chrome.storage.local.get(["enabled"]).then((result) => {
            enabled = result.enabled;
            document.getElementById('start').innerHTML = enabled ? "Working.." : "Start";
            document.getElementById("start").style.backgroundColor = enabled ? "#1aa6b7" : "#28df99";
            document.getElementById("start").style.border = enabled ? "#1aa6b7" : "#28df99";
        });
    }

    $("#start").on("click", function() {
        chrome.runtime.sendMessage({ message: "enable" }, (response) => {
            $("#start").html("Working..");
            $("#start").css({ "background-color": "#1aa6b7", "border": "#1aa6b7" })
        });
    });
    $("#stop").on("click", function() {
        chrome.runtime.sendMessage({ message: "disable" }, (response) => {
            $("#start").html("Start");
            $("#start").css({ "background-color": "#28df99", "border": "#28df99" })
        });
    });
    $("#download").on("click", function() {
        chrome.storage.local.get(null, function(items) {
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
