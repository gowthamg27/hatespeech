
// content.js
const blockedWords = [
    "hate", "abuse", "stupid", "idiot", "dumb"
    // Add more words as needed
];

// Function to replace blocked words with asterisks
function replaceBlockedWords(text) {
    if (!text) return text;
    let modifiedText = text;
    blockedWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        modifiedText = modifiedText.replace(regex, '*'.repeat(word.length));
    });
    return modifiedText;
}

// Monitor and replace text in existing content
function replaceTextContent(node) {
    if (node.nodeType === 3) { // Text node
        let text = node.nodeValue;
        let modifiedText = replaceBlockedWords(text);
        if (text !== modifiedText) {
            node.nodeValue = modifiedText;
        }
    } else {
        Array.from(node.childNodes).forEach(replaceTextContent);
    }
}

// Handle form submissions
function handleFormSubmission(form) {
    // Process all input fields, textareas, and contenteditable elements in the form
    form.querySelectorAll('input[type="text"], input[type="search"], textarea, [contenteditable="true"]').forEach(element => {
        if (element.isContentEditable) {
            element.textContent = replaceBlockedWords(element.textContent);
        } else {
            element.value = replaceBlockedWords(element.value);
        }
    });
}

// Monitor input fields and textareas
function monitorInputs() {
    // Monitor all forms for submission
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            handleFormSubmission(this);
        });
    });

    // Monitor all input fields and textareas
    document.querySelectorAll('input[type="text"], input[type="search"], textarea').forEach(input => {
        let lastCursorPosition = 0;
        let lastLength = 0;

        // Monitor input events
        input.addEventListener('input', function(e) {
            lastCursorPosition = this.selectionStart;
            lastLength = this.value.length;
            
            const newValue = replaceBlockedWords(this.value);
            
            if (newValue !== this.value) {
                this.value = newValue;
                const lengthDiff = newValue.length - lastLength;
                const newPosition = lastCursorPosition + lengthDiff;
                
                setTimeout(() => {
                    this.setSelectionRange(newPosition, newPosition);
                }, 0);
            }
        });

        // Monitor blur event (when input loses focus / message might be sent)
        input.addEventListener('blur', function() {
            this.value = replaceBlockedWords(this.value);
        });
    });

    // Monitor contenteditable elements
    document.querySelectorAll('[contenteditable="true"]').forEach(element => {
        element.addEventListener('input', function(e) {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const cursorPosition = range.startOffset;
            
            const originalContent = this.textContent;
            const newContent = replaceBlockedWords(originalContent);
            
            if (originalContent !== newContent) {
                this.textContent = newContent;
                
                try {
                    const textNode = this.firstChild || this;
                    const newRange = document.createRange();
                    newRange.setStart(textNode, cursorPosition);
                    newRange.setEnd(textNode, cursorPosition);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                } catch (error) {
                    console.log("Cursor position restoration failed");
                }
            }
        });

        // Monitor blur event for contenteditable
        element.addEventListener('blur', function() {
            this.textContent = replaceBlockedWords(this.textContent);
        });
    });

    // Monitor click events on send buttons
    document.querySelectorAll('button[type="submit"], input[type="submit"], button:contains("Send"), button:contains("Post"), button:contains("Comment")').forEach(button => {
        button.addEventListener('click', function(e) {
            const form = this.closest('form');
            if (form) {
                handleFormSubmission(form);
            }
            
            // Also check nearby input fields
            const container = this.closest('div, form, section');
            if (container) {
                container.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]').forEach(input => {
                    if (input.isContentEditable) {
                        input.textContent = replaceBlockedWords(input.textContent);
                    } else {
                        input.value = replaceBlockedWords(input.value);
                    }
                });
            }
        });
    });
}

// Create observer for dynamic content
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(node => {
            replaceTextContent(node);
            
            if (node.querySelectorAll) {
                node.querySelectorAll('input[type="text"], input[type="search"], textarea, [contenteditable="true"], form').forEach(input => {
                    monitorInputs();
                });
            }
        });
    });
});

// Intercept XHR and Fetch requests
function interceptNetworkRequests() {
    // Intercept XHR
    const XHR = XMLHttpRequest.prototype;
    const originalSend = XHR.send;
    XHR.send = function(data) {
        if (typeof data === 'string') {
            data = replaceBlockedWords(data);
        }
        return originalSend.call(this, data);
    };

    // Intercept Fetch
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (options && options.body && typeof options.body === 'string') {
            options.body = replaceBlockedWords(options.body);
        }
        return originalFetch.call(this, url, options);
    };
}

// Start monitoring when blocking is enabled
chrome.storage.local.get("isBlocked", function(data) {
    if (data.isBlocked) {
        // Replace existing content
        replaceTextContent(document.body);
        
        // Monitor new content
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        // Start monitoring inputs
        monitorInputs();
        
        // Intercept network requests
        interceptNetworkRequests();
        
        // Monitor iframes
        document.querySelectorAll('iframe').forEach(iframe => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                replaceTextContent(iframeDoc.body);
                observer.observe(iframeDoc.body, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
                monitorInputs();
            } catch (e) {
                // Handle cross-origin iframe errors silently
            }
        });
    }
});