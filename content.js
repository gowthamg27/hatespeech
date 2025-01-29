// content.js
const blockedWords = [
    "hate", "abuse", "stupid", "idiot", "dumb"
    // Add more words as needed
];

function replaceBlockedWords(text) {
    if (!text || typeof text !== 'string') return text;
    
    // First, check for exact matches
    let modifiedText = text.split(' ').map(word => {
        if (blockedWords.includes(word.toLowerCase())) {
            return '*'.repeat(word.length);
        }
        return word;
    }).join(' ');
    
    // Then check for partial matches within words
    blockedWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        modifiedText = modifiedText.replace(regex, match => '*'.repeat(match.length));
    });
    
    return modifiedText;
}

// Process all text nodes in the document
function processTextNode(node) {
    if (node.nodeType === 3) { // Text node
        const originalText = node.nodeValue;
        const newText = replaceBlockedWords(originalText);
        if (originalText !== newText) {
            node.nodeValue = newText;
        }
    }
}

// Scan and replace text in the entire document
function scanAndReplaceAllText() {
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let node;
    while (node = walker.nextNode()) {
        processTextNode(node);
    }
}

// Monitor input fields for real-time replacement
function monitorInputFields() {
    // For regular input fields and textareas
    document.querySelectorAll('input[type="text"], input[type="search"], textarea').forEach(input => {
        input.addEventListener('input', function(e) {
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = replaceBlockedWords(this.value);
            if (this.setSelectionRange) {
                this.setSelectionRange(start, end);
            }
        });

        // Also check on blur (when losing focus)
        input.addEventListener('blur', function() {
            this.value = replaceBlockedWords(this.value);
        });
    });

    // For contenteditable elements
    document.querySelectorAll('[contenteditable="true"]').forEach(element => {
        element.addEventListener('input', function() {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const start = range.startOffset;
            
            this.textContent = replaceBlockedWords(this.textContent);
            
            try {
                range.setStart(this.firstChild || this, start);
                range.setEnd(this.firstChild || this, start);
                selection.removeAllRanges();
                selection.addRange(range);
            } catch(e) {}
        });

        element.addEventListener('blur', function() {
            this.textContent = replaceBlockedWords(this.textContent);
        });
    });
}

// Intercept all form submissions
function interceptForms() {
    document.addEventListener('submit', function(e) {
        const form = e.target;
        form.querySelectorAll('input[type="text"], input[type="search"], textarea, [contenteditable="true"]')
            .forEach(input => {
                if (input.value) {
                    input.value = replaceBlockedWords(input.value);
                } else if (input.textContent) {
                    input.textContent = replaceBlockedWords(input.textContent);
                }
            });
    }, true);
}

// Intercept network requests
function interceptNetwork() {
    // Intercept Fetch
    const originalFetch = window.fetch;
    window.fetch = async function(url, options = {}) {
        if (options?.body) {
            try {
                if (typeof options.body === 'string') {
                    try {
                        // Try parsing as JSON
                        let json = JSON.parse(options.body);
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
            } catch (e) {}
        }
        return originalFetch.call(this, url, options);
    };

    // Intercept XHR
    const originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(data) {
        if (data) {
            try {
                if (typeof data === 'string') {
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
            } catch (e) {}
        }
        originalXHRSend.call(this, data);
    };
}

// Monitor DOM changes
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        // Check added nodes
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
                // Process all text nodes within this element
                const walker = document.createTreeWalker(
                    node,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                let textNode;
                while (textNode = walker.nextNode()) {
                    processTextNode(textNode);
                }

                // Monitor any new input fields
                if (node.querySelectorAll) {
                    node.querySelectorAll('input[type="text"], input[type="search"], textarea, [contenteditable="true"]')
                        .forEach(input => {
                            if (input.value) {
                                input.value = replaceBlockedWords(input.value);
                            }
                            input.addEventListener('input', function() {
                                const start = this.selectionStart;
                                const end = this.selectionEnd;
                                this.value = replaceBlockedWords(this.value);
                                if (this.setSelectionRange) {
                                    this.setSelectionRange(start, end);
                                }
                            });
                        });
                }
            } else if (node.nodeType === 3) { // Text node
                processTextNode(node);
            }
        });

        // Check modified nodes
        if (mutation.type === 'characterData') {
            processTextNode(mutation.target);
        }
    });
});

// Initialize everything
function initialize() {
    // Initial scan
    scanAndReplaceAllText();
    
    // Set up all monitors
    monitorInputFields();
    interceptForms();
    interceptNetwork();
    
    // Monitor DOM changes
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Handle frames
    document.querySelectorAll('iframe').forEach(iframe => {
        try {
            iframe.addEventListener('load', () => {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                scanAndReplaceAllText.call(iframeDoc);
                monitorInputFields.call(iframeDoc);
            });
        } catch (e) {}
    });
}

// Start when extension is enabled
chrome.storage.local.get("isBlocked", function(data) {
    if (data.isBlocked) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initialize);
        } else {
            initialize();
        }
        
        // Also process new content as it loads
        document.addEventListener('load', function(event) {
            const target = event.target;
            if (target.tagName === 'IFRAME') {
                try {
                    const doc = target.contentDocument || target.contentWindow.document;
                    scanAndReplaceAllText.call(doc);
                    monitorInputFields.call(doc);
                } catch (e) {}
            }
        }, true);
    }
});