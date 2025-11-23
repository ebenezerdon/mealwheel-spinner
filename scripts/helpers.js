window.App = window.App || {};

(function() {
    // Standard high-contrast palette for slices
    const COLORS = [
        '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C',
        '#2EC4B6', '#E71D36', '#011627', '#B8C2CC', '#F72585',
        '#4361EE', '#3A0CA3', '#7209B7'
    ];

    App.helpers = {
        // Generate a consistent color from an index
        getColor: function(index) {
            return COLORS[index % COLORS.length];
        },

        // Easing function for wheel spin: easeOutQuart
        easeOutQuart: function(x) {
            return 1 - Math.pow(1 - x, 4);
        },

        // Random integer in range [min, max]
        randomInt: function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        // Convert degrees to radians
        degToRad: function(deg) {
            return deg * (Math.PI / 180);
        },

        // Calculate brightness of hex color to determine text color (black/white)
        getContrastColor: function(hexColor) {
            // Convert hex to RGB
            const r = parseInt(hexColor.substr(1, 2), 16);
            const g = parseInt(hexColor.substr(3, 2), 16);
            const b = parseInt(hexColor.substr(5, 2), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq >= 128) ? '#1e293b' : '#ffffff'; // Slate-800 or White
        },

        // Format date for history
        formatDate: function(timestamp) {
            return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };
})();