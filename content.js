// const blockedWords = [
//     // Add your blocked words here
//     "hate", "abuse", "stupid", "idiot", "dumb"
// ];

// function replaceTextContent(node) {
//     if (node.nodeType === 3) { // Text node
//         let text = node.nodeValue;
//         let changed = false;
        
//         blockedWords.forEach(word => {
//             const regex = new RegExp(word, 'gi');
//             if (regex.test(text)) {
//                 text = text.replace(regex, '*'.repeat(word.length));
//                 changed = true;
//             }
//         });
        
//         if (changed) {
//             node.nodeValue = text;
//         }
//     } else {
//         Array.from(node.childNodes).forEach(replaceTextContent);
//     }
// }

// const observer = new MutationObserver((mutations) => {
//     mutations.forEach((mutation) => {
//         mutation.addedNodes.forEach(replaceTextContent);
//     });
// });

// chrome.storage.local.get("isBlocked", function(data) {
//     if (data.isBlocked) {
//         replaceTextContent(document.body);
//         observer.observe(document.body, {
//             childList: true,
//             subtree: true,
//             characterData: true
//         });
//     }
// });




// above code was hide the hate text






//below code works like only hide the text  and sreplace word likr *****
// content.js
// const blockedWords = [
//     "hate", "abuse", "stupid", "idiot", "dumb"
//     // Add more words as needed
// ];

// // Function to replace blocked words with asterisks
// function replaceBlockedWords(text) {
//     let modifiedText = text;
//     blockedWords.forEach(word => {
//         const regex = new RegExp(word, 'gi');
//         modifiedText = modifiedText.replace(regex, '*'.repeat(word.length));
//     });
//     return modifiedText;
// }

// // Monitor and replace text in existing content
// function replaceTextContent(node) {
//     if (node.nodeType === 3) { // Text node
//         let text = node.nodeValue;
//         let modifiedText = replaceBlockedWords(text);
//         if (text !== modifiedText) {
//             node.nodeValue = modifiedText;
//         }
//     } else {
//         Array.from(node.childNodes).forEach(replaceTextContent);
//     }
// }

// // Monitor input fields and textareas
// function monitorInputs() {
//     // Monitor all input fields and textareas
//     document.querySelectorAll('input[type="text"], input[type="search"], textarea').forEach(input => {
//         // Monitor input events
//         input.addEventListener('input', function(e) {
//             const cursorPosition = this.selectionStart;
//             this.value = replaceBlockedWords(this.value);
//             this.setSelectionRange(cursorPosition, cursorPosition);
//         });

//         // Monitor before form submission
//         if (input.form) {
//             input.form.addEventListener('submit', function(e) {
//                 input.value = replaceBlockedWords(input.value);
//             });
//         }
//     });

//     // Monitor contenteditable elements (like chat boxes)
//     document.querySelectorAll('[contenteditable="true"]').forEach(element => {
//         element.addEventListener('input', function(e) {
//             const selection = window.getSelection();
//             const range = selection.getRangeAt(0);
//             const cursorPosition = range.startOffset;
            
//             this.textContent = replaceBlockedWords(this.textContent);
            
//             // Restore cursor position
//             range.setStart(this.firstChild || this, cursorPosition);
//             range.setEnd(this.firstChild || this, cursorPosition);
//             selection.removeAllRanges();
//             selection.addRange(range);
//         });
//     });
// }

// // Create observer for dynamic content
// const observer = new MutationObserver((mutations) => {
//     mutations.forEach((mutation) => {
//         // Check for new content
//         mutation.addedNodes.forEach(node => {
//             replaceTextContent(node);
            
//             // If new input fields are added, monitor them
//             if (node.querySelectorAll) {
//                 node.querySelectorAll('input[type="text"], input[type="search"], textarea, [contenteditable="true"]').forEach(input => {
//                     monitorInputs();
//                 });
//             }
//         });
//     });
// });

// // Start monitoring when blocking is enabled
// chrome.storage.local.get("isBlocked", function(data) {
//     if (data.isBlocked) {
//         // Replace existing content
//         replaceTextContent(document.body);
        
//         // Monitor new content
//         observer.observe(document.body, {
//             childList: true,
//             subtree: true,
//             characterData: true
//         });
        
//         // Start monitoring inputs
//         monitorInputs();
        
//         // Monitor new frames/iframes
//         document.querySelectorAll('iframe').forEach(iframe => {
//             try {
//                 const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
//                 replaceTextContent(iframeDoc.body);
//                 observer.observe(iframeDoc.body, {
//                     childList: true,
//                     subtree: true,
//                     characterData: true
//                 });
//                 monitorInputs();
//             } catch (e) {
//                 // Handle cross-origin iframe errors silently
//             }
//         });
//     }
// });




// content.js
const blockedWords = [
    "hate", "abuse", "stupid", "idiot", "dumb"
    // Add more words as needed
];

// Function to replace blocked words with asterisks
function replaceBlockedWords(text) {
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

// Intercept form submissions
function interceptFormSubmission() {
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            // Don't intercept if blocking is disabled
            chrome.storage.local.get("isBlocked", function(data) {
                if (!data.isBlocked) return;
            });

            // Get all form inputs
            const inputs = form.querySelectorAll('input[type="text"], input[type="search"], textarea');
            inputs.forEach(input => {
                input.value = replaceBlockedWords(input.value);
            });
        });
    });
}

// Intercept XHR and Fetch requests
function interceptXHRRequests() {
    // Intercept XMLHttpRequest
    const originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(data) {
        chrome.storage.local.get("isBlocked", function(result) {
            if (result.isBlocked && data) {
                if (typeof data === 'string') {
                    data = replaceBlockedWords(data);
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
            }
        });
        originalXHRSend.call(this, data);
    };

    // Intercept Fetch requests
    const originalFetch = window.fetch;
    window.fetch = async function(url, options = {}) {
        const isBlocked = await new Promise(resolve => {
            chrome.storage.local.get("isBlocked", data => resolve(data.isBlocked));
        });

        if (isBlocked && options.body) {
            if (typeof options.body === 'string') {
                options.body = replaceBlockedWords(options.body);
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
        }
        return originalFetch.call(this, url, options);
    };
}

// Monitor input fields and textareas
function monitorInputs() {
    // Monitor all input fields and textareas
    document.querySelectorAll('input[type="text"], input[type="search"], textarea').forEach(input => {
        // Monitor input events
        input.addEventListener('input', function(e) {
            const cursorPosition = this.selectionStart;
            this.value = replaceBlockedWords(this.value);
            this.setSelectionRange(cursorPosition, cursorPosition);
        });
    });

    // Monitor contenteditable elements
    document.querySelectorAll('[contenteditable="true"]').forEach(element => {
        element.addEventListener('input', function(e) {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const cursorPosition = range.startOffset;
            
            this.textContent = replaceBlockedWords(this.textContent);
            
            // Restore cursor position
            range.setStart(this.firstChild || this, cursorPosition);
            range.setEnd(this.firstChild || this, cursorPosition);
            selection.removeAllRanges();
            selection.addRange(range);
        });

        // Monitor blur event to ensure content is censored when focus is lost
        element.addEventListener('blur', function(e) {
            this.textContent = replaceBlockedWords(this.textContent);
        });
    });
}

// Create observer for dynamic content
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(node => {
            replaceTextContent(node);
            if (node.querySelectorAll) {
                node.querySelectorAll('input[type="text"], input[type="search"], textarea, [contenteditable="true"]').forEach(input => {
                    monitorInputs();
                });
                // Monitor any new forms that are added
                node.querySelectorAll('form').forEach(() => {
                    interceptFormSubmission();
                });
            }
        });
    });
});

// Initialize when blocking is enabled
chrome.storage.local.get("isBlocked", function(data) {
    if (data.isBlocked) {
        // Replace existing content
        replaceTextContent(document.body);
        
        // Set up all monitors and interceptors
        monitorInputs();
        interceptFormSubmission();
        interceptXHRRequests();
        
        // Monitor new content
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
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
                interceptFormSubmission();
            } catch (e) {
                // Handle cross-origin iframe errors silently
            }
        });
    }
});