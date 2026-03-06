// Function to update budget with a "CapCut" style smooth counter
function updateBudget(val, elementId) {
    const element = document.getElementById(elementId);
    const v = parseInt(val);
    const formatted = 'UGX ' + (v >= 1000000 ? (v/1000000).toFixed(1)+'M' : (v/1000).toFixed(0)+'k');
    
    // Add a quick "pop" animation when the value changes
    element.textContent = formatted;
    element.style.transform = "scale(1.1)";
    setTimeout(() => element.style.transform = "scale(1)", 100);
}

// Global state for accessibility
let accessibilitySettings = {
    highContrast: false,
    largeText: false
};

function toggleAccessibility(type) {
    accessibilitySettings[type] = !accessibilitySettings[type];
    document.documentElement.classList.toggle(`access-${type}`);
    // Save to DB via AJAX later
}