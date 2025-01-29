document.addEventListener("DOMContentLoaded", function() {
    const setupSection = document.getElementById("setupSection");
    const controlSection = document.getElementById("controlSection");
    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmPassword");
    const savePassword = document.getElementById("savePassword");
    const toggleButton = document.getElementById("toggle");
    const passwordSection = document.getElementById("passwordSection");
    const passwordInput = document.getElementById("password");
    const submitPassword = document.getElementById("submitPassword");

    // Check if password is already set
    chrome.storage.local.get("password", function(data) {
        if (data.password) {
            setupSection.style.display = "none";
            controlSection.style.display = "block";
            updateToggleButton();
        }
    });

    // Save new password
    savePassword.addEventListener("click", function() {
        if (newPassword.value === confirmPassword.value && newPassword.value.length > 0) {
            chrome.storage.local.set({ 
                "password": newPassword.value,
                "isBlocked": true
            }, function() {
                setupSection.style.display = "none";
                controlSection.style.display = "block";
                updateToggleButton();
                chrome.tabs.reload();
            });
        } else {
            alert("Passwords don't match or are empty!");
        }
    });

    // Update toggle button state
    function updateToggleButton() {
        chrome.storage.local.get("isBlocked", function(data) {
            toggleButton.textContent = data.isBlocked ? "Turn Off" : "Turn On";
        });
    }

    toggleButton.addEventListener("click", function() {
        chrome.storage.local.get("isBlocked", function(data) {
            if (data.isBlocked) {
                passwordSection.style.display = "block";
            } else {
                chrome.storage.local.set({ "isBlocked": true });
                toggleButton.textContent = "Turn Off";
                chrome.runtime.sendMessage({ action: "enableBlocking" });
                chrome.tabs.reload();
            }
        });
    });

    submitPassword.addEventListener("click", function() {
        chrome.storage.local.get("password", function(data) {
            if (passwordInput.value === data.password) {
                chrome.storage.local.set({ "isBlocked": false });
                toggleButton.textContent = "Turn On";
                passwordSection.style.display = "none";
                passwordInput.value = "";
                chrome.runtime.sendMessage({ action: "disableBlocking" });
                chrome.tabs.reload();
            } else {
                alert("Incorrect password!");
            }
        });
    });
});