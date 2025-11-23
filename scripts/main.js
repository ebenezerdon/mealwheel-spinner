$(function() {
    // Contract check
    try {
        const hasApp = !!window.App;
        const hasInit = hasApp && typeof App.ui.init === 'function';
        if (!hasApp || !hasInit) {
            console.error('[Contract] Missing App.ui.init');
            return;
        }
    } catch (e) {
        console.error('Init check failed', e);
    }

    // Initialize Data & UI
    App.data.init();
    App.ui.init();
    App.ui.renderItemsList();
    App.ui.renderHistory();
    App.ui.populateCategories();

    // --- State ---
    let isSpinning = false;
    let currentRotation = 0; // Store cumulative rotation to prevent snapping back

    // --- Event Listeners ---

    // 1. Add Item
    $('#form-add-item').on('submit', function(e) {
        e.preventDefault();
        const name = $('#input-name').val().trim();
        const weight = $('#input-weight').val();
        
        if (name) {
            App.data.addItem(name, weight);
            $('#input-name').val('');
            $('#input-weight').val('1');
            App.ui.renderItemsList();
            App.ui.drawWheel(currentRotation);
        }
    });

    // 2. Delete Item (Event delegation)
    $(document).on('click', '.btn-delete-item', function() {
        const id = $(this).data('id').toString();
        App.data.removeItem(id);
        App.ui.renderItemsList();
        App.ui.drawWheel(currentRotation);
    });

    // 3. Update Weight
    $(document).on('change', '.item-weight-input', function() {
        const id = $(this).data('id').toString();
        const val = $(this).val();
        if (val > 0) {
            App.data.updateItemWeight(id, val);
            App.ui.drawWheel(currentRotation);
        }
    });

    // 4. Tabs
    $('button[data-tab]').on('click', function() {
        const tab = $(this).data('tab');
        
        // Update Tab Styles
        $('button[data-tab]').removeClass('active-tab text-orange-600 border-b-orange-600').addClass('text-slate-500 border-transparent');
        $(this).addClass('active-tab text-orange-600 border-b-orange-600').removeClass('text-slate-500 border-transparent');

        // Toggle Content
        $('.tab-content').addClass('hidden');
        $(`#tab-${tab}`).removeClass('hidden');
    });

    // 5. Category Management
    $('#category-select').on('change', function() {
        const cat = $(this).val();
        App.data.switchCategory(cat);
        App.ui.renderItemsList();
        App.ui.populateCategories(); // Updates delete buttons logic
        App.ui.drawWheel(currentRotation);
    });

    $('#btn-manage-categories').on('click', function() {
        $('#modal-category').removeClass('hidden').addClass('flex');
    });

    $('#btn-close-modal').on('click', function() {
        $('#modal-category').addClass('hidden').removeClass('flex');
    });

    $('#btn-add-category').on('click', function() {
        const name = $('#input-new-category').val().trim();
        if (name) {
            App.data.addCategory(name);
            $('#input-new-category').val('');
            App.ui.populateCategories();
            App.ui.renderItemsList();
            App.ui.drawWheel(currentRotation);
        }
    });

    $(document).on('click', '.btn-delete-category', function() {
        const name = $(this).data('name');
        if (confirm(`Delete category "${name}"?`)) {
            if (App.data.deleteCategory(name)) {
                App.ui.populateCategories();
                App.ui.renderItemsList();
                App.ui.drawWheel(currentRotation);
            }
        }
    });

    // 6. Clear History
    $('#btn-clear-history').on('click', function() {
        App.data.clearHistory();
        App.ui.renderHistory();
    });

    // 7. Modal Actions
    $('#btn-close-result, #result-overlay').on('click', function(e) {
        if (e.target === this) App.ui.hideResult();
    });
    
    $('#btn-spin-again').on('click', function() {
        App.ui.hideResult();
        // Optional: Auto trigger spin? Nah, let user click button.
    });

    // --- SPIN LOGIC ---
    $('#btn-spin').on('click', function() {
        if (isSpinning) return;
        
        const items = App.data.getItems();
        if (items.length < 2) {
            alert("Add at least 2 items to spin!");
            return;
        }

        isSpinning = true;
        $('#btn-spin').prop('disabled', true).addClass('opacity-50 cursor-not-allowed');

        // 1. Determine Winner based on weights
        const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
        let random = Math.random() * totalWeight;
        let winnerIndex = -1;
        
        for (let i = 0; i < items.length; i++) {
            random -= items[i].weight;
            if (random <= 0) {
                winnerIndex = i;
                break;
            }
        }

        // 2. Calculate Angles
        // Arc size for the winner
        const winnerItem = items[winnerIndex];
        const sliceAngleDeg = (winnerItem.weight / totalWeight) * 360;
        
        // Where does the winner START in a 0-360 circle?
        let currentAngleSum = 0;
        for (let i = 0; i < winnerIndex; i++) {
            currentAngleSum += (items[i].weight / totalWeight) * 360;
        }

        // The pointer is at the TOP (270 degrees or -90 degrees in standard circle math, but CSS/Canvas rotation adds up)
        // Let's simplify: We want the CENTER of the winner slice to align with the pointer.
        // Pointer is at Top (which is -90deg or 270deg relative to 0 at right).
        // Easier logic: Rotate the wheel so the winner hits the top.
        
        // Center of winner slice relative to 0 start:
        const winnerCenterDeg = currentAngleSum + (sliceAngleDeg / 2);
        
        // We want (FinalRotation + winnerCenterDeg) % 360 = 270 (Top)
        // So FinalRotation = 270 - winnerCenterDeg
        // Add extra spins (e.g. 5 full rotations = 1800 deg)
        
        const spins = 5;
        const extraRotations = 360 * spins;
        const targetRotation = (270 - winnerCenterDeg) + extraRotations;
        
        // Adjust target to be always increasing to handle currentRotation accumulating
        // We need to find the next multiple of rotation that lands us there.
        // Actually, simpler: just add relative rotation.
        
        // Calculate delta needed to reach target position from CURRENT position (mod 360)
        const currentMod = currentRotation % 360;
        let dist = (270 - winnerCenterDeg) - currentMod;
        if (dist < 0) dist += 360;
        
        const totalDist = dist + extraRotations;
        const finalRotation = currentRotation + totalDist;

        // 3. Animate
        const startTime = performance.now();
        const duration = 4000; // 4 seconds

        function animate(time) {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = App.helpers.easeOutQuart(progress);
            
            const newAngle = currentRotation + (totalDist * ease);
            
            App.ui.drawWheel(newAngle);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                isSpinning = false;
                currentRotation = finalRotation; // Save state
                $('#btn-spin').prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
                App.data.addHistory(winnerItem.name);
                App.ui.renderHistory();
                App.ui.showResult(winnerItem.name);
            }
        }

        requestAnimationFrame(animate);
    });
});