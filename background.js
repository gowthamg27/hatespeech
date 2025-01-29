chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "enableBlocking") {
        chrome.storage.local.set({ "isBlocked": true });
    } else if (message.action === "disableBlocking") {
        chrome.storage.local.set({ "isBlocked": false });
    }
});