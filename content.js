// content.js
const blockedWords = [
    "hate", "abuse", "stupid", "idiot", "dumb"
    // Add more words as needed
];

function replaceBlockedWords(text) {
    if (!text || typeof text !== 'string') return text;
    let modifiedText = text;
    blockedWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        modifiedText = modifiedText.replace(regex, '*'.repeat(word.length));
    });
    return modifiedText;
}

// Monitor and modify input fields in real-time
function monitorInputFields() {
    // Handle regular input fields and textareas
    document.querySelectorAll('input[type="text"], textarea').forEach(input => {
        input.addEventListener('input', function(e) {
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = replaceBlockedWords(this.value);
            // Maintain cursor position
            this.setSelectionRange(start, end);
        });
    });

    // Handle contenteditable elements (like message boxes in chat applications)
    document.querySelectorAll('[contenteditable="true"]').forEach(element => {
        element.addEventListener('input', function(e) {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const start = range.startOffset;
            
            this.textContent = replaceBlockedWords(this.textContent);
            
            // Restore cursor position
            try {
                range.setStart(this.firstChild || this, start);
                range.setEnd(this.firstChild || this, start);
                selection.removeAllRanges();
                selection.addRange(range);
            } catch(e) {
                // Handle edge cases silently
            }
        });
    });
}

// Intercept form submissions
function interceptForms() {
    document.addEventListener('submit', function(e) {
        const form = e.target;
        // Modify all text inputs and textareas in the form
        form.querySelectorAll('input[type="text"], textarea').forEach(input => {
            input.value = replaceBlockedWords(input.value);
        });
        // Handle contenteditable elements in the form
        form.querySelectorAll('[contenteditable="true"]').forEach(element => {
            element.textContent = replaceBlockedWords(element.textContent);
        });
    }, true);
}

// Intercept network requests to modify outgoing messages
function interceptNetworkRequests() {
    // Intercept Fetch API
    const originalFetch = window.fetch;
    window.fetch = async function(url, options = {}) {
        if (options?.body) {
            try {
                if (typeof options.body === 'string') {
                    // Handle JSON data
                    try {
                        let json = JSON.parse(options.body);
                        // Recursively process all string values in the object
                        function processObject(obj) {
                            for (let key in obj) {
                                if (typeof obj[key] === 'string') {
                                    obj[key] = replaceBlockedWords(obj[key]);
                                } else if (obj[key] && typeof obj[key] === 'object') {
                                    processObject(obj[key]);
                                }
                            }
                        }
                        processObject(json);
                        options.body = JSON.stringify(json);
                    } catch {
                        // If not JSON, process as plain text
                        options.body = replaceBlockedWords(options.body);
                    }
                } else if (options.body instanceof FormData) {
                    const newFormData = new FormData();
                    for (let pair of options.body.entries()) {
                        if (typeof pair[1] === 'string') {
                            newFormData.append(pair[0], replaceBlockedWords(pair[1]));
                        } else {
                            newFormData.append(pair[0], pair[1]);
                        }
                    }
                    options.body = newFormData;
                }
            } catch (e) {
                console.error('Error processing request:', e);
            }
        }
        return originalFetch.call(this, url, options);
    };

    // Intercept XMLHttpRequest
    const originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(data) {
        if (data) {
            try {
                if (typeof data === 'string') {
                    // Try parsing as JSON first
                    try {
                        let json = JSON.parse(data);
                        function processObject(obj) {
                            for (let key in obj) {
                                if (typeof obj[key] === 'string') {
                                    obj[key] = replaceBlockedWords(obj[key]);
                                } else if (obj[key] && typeof obj[key] === 'object') {
                                    processObject(obj[key]);
                                }
                            }
                        }
                        processObject(json);
                        data = JSON.stringify(json);
                    } catch {
                        // If not JSON, process as plain text
                        data = replaceBlockedWords(data);
                    }
                } else if (data instanceof FormData) {
                    const newFormData = new FormData();
                    for (let pair of data.entries()) {
                        if (typeof pair[1] === 'string') {
                            newFormData.append(pair[0], replaceBlockedWords(pair[1]));
                        } else {
                            newFormData.append(pair[0], pair[1]);
                        }
                    }
                    data = newFormData;
                }
            } catch (e) {
                console.error('Error processing XHR data:', e);
            }
        }
        originalXHRSend.call(this, data);
    };
}

// Monitor DOM changes for new input fields
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
                if (node.querySelectorAll) {
                    // Monitor any new input fields
                    node.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]')
                        .forEach(input => {
                            input.addEventListener('input', function(e) {
                                const start = this.selectionStart;
                                const end = this.selectionEnd;
                                this.value = replaceBlockedWords(this.value);
                                if (this.setSelectionRange) {
                                    this.setSelectionRange(start, end);
                                }
                            });
                        });
                }
            }
        });
    });
});

// Initialize everything when the extension is enabled
chrome.storage.local.get("isBlocked", function(data) {
    if (data.isBlocked) {
        // Start monitoring
        monitorInputFields();
        interceptForms();
        interceptNetworkRequests();
        
        // Observe DOM for new elements
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
});