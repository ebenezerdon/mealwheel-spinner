window.App = window.App || {};

(function() {
    const CANVAS_ID = 'wheel-canvas';
    let ctx = null;
    let canvas = null;
    let currentRotation = 0;

    App.ui = {
        init: function() {
            canvas = document.getElementById(CANVAS_ID);
            if (!canvas) return;
            
            // Handle High DPI screens
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            
            // Set actual size in memory (scaled to account for extra pixel density)
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            
            ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            
            // Initial draw
            this.drawWheel(0);
        },

        // Main draw function
        drawWheel: function(rotationAngle = 0) {
            if (!ctx) return;
            
            const items = App.data.getItems();
            const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
            
            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) / 2 - 10; // 10px padding

            ctx.clearRect(0, 0, width, height);
            
            if (items.length === 0) {
                // Empty State
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.fillStyle = '#e2e8f0';
                ctx.fill();
                ctx.fillStyle = '#64748b';
                ctx.font = 'bold 20px "Work Sans"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Add Items!', centerX, centerY);
                return;
            }

            let currentAngle = rotationAngle * (Math.PI / 180); // Convert incoming deg to rad start

            items.forEach((item, index) => {
                // Calculate slice size based on weight
                const sliceAngle = (item.weight / totalWeight) * (2 * Math.PI);
                
                // Draw Slice
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();
                
                const color = App.helpers.getColor(index);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#fff';
                ctx.stroke();

                // Draw Text
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(currentAngle + sliceAngle / 2);
                ctx.textAlign = 'right';
                ctx.fillStyle = App.helpers.getContrastColor(color);
                ctx.font = 'bold 14px "Open Sans"';
                ctx.fillText(item.name, radius - 20, 5); // 20px from edge
                ctx.restore();

                currentAngle += sliceAngle;
            });
        },

        // Update HTML list of items
        renderItemsList: function() {
            const items = App.data.getItems();
            const $container = $('#items-list');
            $container.empty();

            if (items.length === 0) {
                $container.html(`<div class="text-center p-4 text-slate-400 text-sm italic">No items yet. Add one above!</div>`);
                return;
            }

            items.forEach((item, index) => {
                const color = App.helpers.getColor(index);
                const html = `
                    <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition group">
                        <div class="w-3 h-full rounded-full" style="background-color: ${color}"></div>
                        <div class="flex-1 font-medium text-slate-700">${item.name}</div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-slate-400 uppercase font-bold">Wt</span>
                            <input type="number" min="1" max="10" class="w-12 p-1 text-center text-sm border rounded item-weight-input focus:ring-2 focus:ring-orange-200 outline-none" 
                                   value="${item.weight}" data-id="${item.id}">
                            <button class="btn-delete-item text-slate-300 hover:text-red-500 transition p-1" data-id="${item.id}">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </div>
                `;
                $container.append(html);
            });
        },

        // Update HTML history list
        renderHistory: function() {
            const history = App.data.getHistory();
            const $container = $('#history-list');
            $container.empty();

            if (history.length === 0) {
                $container.html(`<div class="text-center p-4 text-slate-400 text-sm italic">No spins yet.</div>`);
                return;
            }

            history.forEach(h => {
                $container.append(`
                    <li class="flex justify-between text-sm p-2 border-b border-slate-50 last:border-0">
                        <span class="font-medium text-slate-700">${h.name}</span>
                        <span class="text-slate-400 text-xs">${App.helpers.formatDate(h.timestamp)}</span>
                    </li>
                `);
            });
        },

        populateCategories: function() {
            const names = App.data.getCategoryNames();
            const current = App.data.state.currentCategory;
            const $select = $('#category-select');
            const $list = $('#category-list');
            
            // Populate Dropdown
            $select.empty();
            names.forEach(name => {
                $select.append(`<option value="${name}" ${name === current ? 'selected' : ''}>${name}</option>`);
            });

            // Populate Manager List
            $list.empty();
            names.forEach(name => {
                const isCurrent = name === current;
                const deleteBtn = names.length > 1 
                    ? `<button class="text-red-500 hover:text-red-700 btn-delete-category" data-name="${name}">Delete</button>`
                    : `<span class="text-slate-300 text-xs">Active</span>`;
                
                $list.append(`
                    <div class="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <span class="font-medium ${isCurrent ? 'text-orange-600' : 'text-slate-700'}">${name}</span>
                        ${deleteBtn}
                    </div>
                `);
            });
        },

        // Show Result Overlay
        showResult: function(winnerName) {
            const $overlay = $('#result-overlay');
            const $text = $('#result-text');
            
            $text.text(winnerName);
            $overlay.removeClass('hidden').addClass('flex');
            
            // Small timeout to trigger CSS transition opacity
            setTimeout(() => {
                $overlay.removeClass('opacity-0');
                $text.addClass('pop-in');
            }, 10);
        },

        hideResult: function() {
            const $overlay = $('#result-overlay');
            $overlay.addClass('opacity-0');
            setTimeout(() => {
                $overlay.addClass('hidden').removeClass('flex');
                $('#result-text').removeClass('pop-in');
            }, 300);
        }
    };
})();