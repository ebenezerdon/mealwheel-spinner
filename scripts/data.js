window.App = window.App || {};

(function() {
    const STORAGE_KEY = 'mealwheel_data_v1';

    // Default seed data
    const DEFAULTS = {
        categories: {
            'Dinner': [
                { id: '1', name: 'Pizza', weight: 2 },
                { id: '2', name: 'Sushi', weight: 1 },
                { id: '3', name: 'Burgers', weight: 1 },
                { id: '4', name: 'Salad', weight: 1 },
                { id: '5', name: 'Pasta', weight: 2 }
            ],
            'Takeout': [
                { id: '6', name: 'Thai', weight: 1 },
                { id: '7', name: 'Indian', weight: 1 },
                { id: '8', name: 'Chinese', weight: 1 },
                { id: '9', name: 'Mexican', weight: 1 }
            ]
        },
        currentCategory: 'Dinner',
        history: []
    };

    App.data = {
        state: null,

        init: function() {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                this.state = JSON.parse(raw);
                // Merge with defaults structure in case of schema updates (simple check)
                if (!this.state.categories) this.state = DEFAULTS;
            } else {
                this.state = JSON.parse(JSON.stringify(DEFAULTS));
                this.save();
            }
        },

        save: function() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        },

        // Get items for current category
        getItems: function() {
            return this.state.categories[this.state.currentCategory] || [];
        },

        setItems: function(items) {
            this.state.categories[this.state.currentCategory] = items;
            this.save();
        },

        addItem: function(name, weight) {
            const items = this.getItems();
            items.push({
                id: Date.now().toString(),
                name: name,
                weight: parseInt(weight) || 1
            });
            this.setItems(items);
        },

        removeItem: function(id) {
            let items = this.getItems();
            items = items.filter(i => i.id !== id);
            this.setItems(items);
        },

        updateItemWeight: function(id, newWeight) {
            const items = this.getItems();
            const item = items.find(i => i.id === id);
            if (item) {
                item.weight = parseInt(newWeight);
                this.setItems(items);
            }
        },

        addHistory: function(itemName) {
            this.state.history.unshift({
                id: Date.now(),
                name: itemName,
                timestamp: Date.now()
            });
            // Keep only last 50
            if (this.state.history.length > 50) this.state.history.pop();
            this.save();
        },

        clearHistory: function() {
            this.state.history = [];
            this.save();
        },

        getHistory: function() {
            return this.state.history;
        },

        // Category Management
        getCategoryNames: function() {
            return Object.keys(this.state.categories);
        },

        switchCategory: function(name) {
            if (this.state.categories[name]) {
                this.state.currentCategory = name;
                this.save();
            }
        },

        addCategory: function(name) {
            if (!this.state.categories[name]) {
                this.state.categories[name] = [];
                this.switchCategory(name);
            }
        },

        deleteCategory: function(name) {
            const names = this.getCategoryNames();
            if (names.length <= 1) return false; // Can't delete last one
            
            delete this.state.categories[name];
            if (this.state.currentCategory === name) {
                this.state.currentCategory = Object.keys(this.state.categories)[0];
            }
            this.save();
            return true;
        }
    };
})();