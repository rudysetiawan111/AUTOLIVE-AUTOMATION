// public/js/app.js

// Global utility functions
const AUTOLIVE = {
    // API Base URL
    apiBase: '', // Empty for relative URLs
    
    // Current user
    currentUser: null,
    
    // Initialize app
    init: function() {
        this.checkSession();
        this.setupEventListeners();
    },
    
    // Check user session
    checkSession: async function() {
        try {
            const response = await fetch('/api/login/session');
            const data = await response.json();
            
            if (data.authenticated) {
                this.currentUser = data.user;
                this.updateUIForAuth();
            }
        } catch (error) {
            console.error('Session check failed:', error);
        }
    },
    
    // Update UI based on auth status
    updateUIForAuth: function() {
        // Update user email in navbar if present
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl && this.currentUser) {
            userEmailEl.textContent = this.currentUser.email;
        }
    },
    
    // Setup global event listeners
    setupEventListeners: function() {
        // Handle logout buttons
        document.querySelectorAll('.btn-logout').forEach(btn => {
            btn.addEventListener('click', this.logout.bind(this));
        });
    },
    
    // Logout function
    logout: async function(e) {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/login/logout', {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.success) {
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Logout failed:', error);
            this.showNotification('Logout failed', 'error');
        }
    },
    
    // Show notification
    showNotification: function(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },
    
    // Format number with commas
    formatNumber: function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    // Format date
    formatDate: function(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    },
    
    // Make API request
    apiRequest: async function(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const fetchOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, fetchOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },
    
    // Get platform icon
    getPlatformIcon: function(platform) {
        const icons = {
            'youtube': '▶️',
            'tiktok': '🎵',
            'instagram': '📷',
            'facebook': '👍',
            'github': '🐙'
        };
        return icons[platform] || '📹';
    },
    
    // Get platform color
    getPlatformColor: function(platform) {
        const colors = {
            'youtube': '#FF0000',
            'tiktok': '#000000',
            'instagram': '#E4405F',
            'facebook': '#1877F2',
            'github': '#333333'
        };
        return colors[platform] || '#6366f1';
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AUTOLIVE.init();
});

// Export for use in other scripts
window.AUTOLIVE = AUTOLIVE;
