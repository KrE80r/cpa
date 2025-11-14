// In-Store Shopping Mode Implementation
class InStoreMode {
    constructor() {
        this.isActive = false;
        this.currentStore = null;
        this.completedItems = new Set();
        this.currentTotal = 0;
        this.totalItems = 0;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkUrlParams();
    }

    bindEvents() {
        // Toggle in-store mode
        const toggleBtn = document.querySelector('[x-id="inStoreModeToggle"]');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleInStoreMode());
        }

        // Store selection buttons
        const storeButtons = document.querySelectorAll('.store-btn');
        storeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const storeId = e.target.getAttribute('x-id')?.replace('select', '').toLowerCase() || 
                               e.target.textContent.toLowerCase();
                this.selectStore(storeId);
            });
        });
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('mode') === 'instore') {
            this.activateInStoreMode();
        }
    }

    toggleInStoreMode() {
        if (this.isActive) {
            this.deactivateInStoreMode();
        } else {
            this.activateInStoreMode();
        }
    }

    activateInStoreMode() {
        this.isActive = true;
        
        // Update UI elements
        const toggleBtn = document.querySelector('[x-id="inStoreModeToggle"]');
        const toggleText = document.querySelector('[x-id="inStoreModeText"]');
        const storeSelector = document.querySelector('[x-id="storeSelector"]');
        
        if (toggleBtn) {
            toggleBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
            toggleBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        }
        
        if (toggleText) {
            toggleText.textContent = 'Exit In-Store Mode';
        }
        
        if (storeSelector) {
            storeSelector.classList.remove('hidden');
        }

        // Hide non-essential elements for focused shopping
        this.hideNonEssentialElements();
        
        // Apply in-store specific styles
        document.body.classList.add('in-store-mode');
        
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('mode', 'instore');
        window.history.pushState({}, '', url);
    }

    deactivateInStoreMode() {
        this.isActive = false;
        this.currentStore = null;
        
        // Update UI elements
        const toggleBtn = document.querySelector('[x-id="inStoreModeToggle"]');
        const toggleText = document.querySelector('[x-id="inStoreModeText"]');
        const storeSelector = document.querySelector('[x-id="storeSelector"]');
        const storeProgress = document.querySelector('[x-id="storeProgress"]');
        
        if (toggleBtn) {
            toggleBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
            toggleBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        }
        
        if (toggleText) {
            toggleText.textContent = 'Enter In-Store Mode';
        }
        
        if (storeSelector) {
            storeSelector.classList.add('hidden');
        }
        
        if (storeProgress) {
            storeProgress.classList.add('hidden');
        }

        // Show all elements again
        this.showAllElements();
        
        // Remove in-store specific styles
        document.body.classList.remove('in-store-mode');
        
        // Clear URL params
        const url = new URL(window.location);
        url.searchParams.delete('mode');
        window.history.pushState({}, '', url);
    }

    selectStore(storeId) {
        this.currentStore = storeId;
        
        // Update store selection UI
        const storeButtons = document.querySelectorAll('.store-btn');
        storeButtons.forEach(btn => {
            btn.classList.remove('ring-4', 'ring-yellow-400');
            if (btn.textContent.toLowerCase() === storeId || 
                btn.getAttribute('x-id') === `select${storeId}`) {
                btn.classList.add('ring-4', 'ring-yellow-400');
            }
        });
        
        // Show progress bar
        const storeProgress = document.querySelector('[x-id="storeProgress"]');
        if (storeProgress) {
            storeProgress.classList.remove('hidden');
        }
        
        this.filterItemsForCurrentStore();
        this.updateProgress();
    }

    filterItemsForCurrentStore() {
        // to show only items available at the current store
        const event = new CustomEvent('filterByStore', {
            detail: { store: this.currentStore }
        });
        document.dispatchEvent(event);
    }

    hideNonEssentialElements() {
        // Hide import/export buttons
        const importBtn = document.querySelector('[x-id="mainImportBtn"]');
        const exportBtn = document.querySelector('[x-id="mainExportBtn"]');
        
        if (importBtn) importBtn.style.display = 'none';
        if (exportBtn) exportBtn.style.display = 'none';
        
        // Hide shopping strategy component
        const strategy = document.querySelector('[x-id="shoppingStrategyComponent"]');
        if (strategy) strategy.style.display = 'none';
        
        // Hide product search for focused shopping
        const productSearch = document.querySelector('[x-id="productsFilter"]');
        if (productSearch?.parentElement) {
            productSearch.parentElement.style.display = 'none';
        }
    }

    showAllElements() {
        // Show import/export buttons
        const importBtn = document.querySelector('[x-id="mainImportBtn"]');
        const exportBtn = document.querySelector('[x-id="mainExportBtn"]');
        
        if (importBtn) importBtn.style.display = '';
        if (exportBtn) exportBtn.style.display = '';
        
        // Show shopping strategy component
        const strategy = document.querySelector('[x-id="shoppingStrategyComponent"]');
        if (strategy) strategy.style.display = '';
        
        // Show product search
        const productSearch = document.querySelector('[x-id="productsFilter"]');
        if (productSearch?.parentElement) {
            productSearch.parentElement.style.display = '';
        }
    }

    markItemCompleted(itemId) {
        this.completedItems.add(itemId);
        this.updateProgress();
        
        // Visual feedback
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemElement) {
            itemElement.classList.add('completed-item');
            
            // Add checkmark animation
            const checkmark = document.createElement('div');
            checkmark.className = 'checkmark-animation';
            checkmark.innerHTML = '✅';
            itemElement.appendChild(checkmark);
            
            // Move to completed section after animation
            setTimeout(() => {
                this.moveToCompleted(itemElement);
            }, 500);
        }
    }

    markItemIncomplete(itemId) {
        this.completedItems.delete(itemId);
        this.updateProgress();
        
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemElement) {
            itemElement.classList.remove('completed-item');
            this.moveToActive(itemElement);
        }
    }

    updateProgress() {
        if (!this.currentStore) return;
        
        const storeItems = this.getStoreItems();
        this.totalItems = storeItems.length;
        const completed = this.completedItems.size;
        const remaining = this.totalItems - completed;
        const percentage = this.totalItems > 0 ? (completed / this.totalItems) * 100 : 0;
        
        // Update progress text
        const progressText = document.querySelector('[x-id="progressText"]');
        if (progressText) {
            progressText.textContent = `${remaining} of ${this.totalItems} items remaining`;
        }
        
        // Update progress bar
        const progressBar = document.querySelector('[x-id="progressBar"]');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        
        // Update total
        this.currentTotal = this.calculateCurrentTotal(storeItems);
        const totalText = document.querySelector('[x-id="totalText"]');
        if (totalText) {
            totalText.textContent = `Current total: $${this.currentTotal.toFixed(2)}`;
        }
        
        // Check if shopping is complete
        if (remaining === 0 && this.totalItems > 0) {
            this.showCompletionCelebration();
        }
    }

    getStoreItems() {
        // For now, return mock data
        return [];
    }

    calculateCurrentTotal(items) {
        return items.reduce((total, item) => {
            if (this.completedItems.has(item.id)) {
                return total + (item.price || 0);
            }
            return total;
        }, 0);
    }

    moveToCompleted(itemElement) {
        // Move item to completed section at bottom
        itemElement.style.opacity = '0.6';
        itemElement.style.order = '999';
    }

    moveToActive(itemElement) {
        // Move item back to active section
        itemElement.style.opacity = '';
        itemElement.style.order = '';
    }

    showCompletionCelebration() {
        const celebration = document.createElement('div');
        celebration.className = 'fixed inset-0 bg-green-600 bg-opacity-90 flex items-center justify-center z-50';
        celebration.innerHTML = `
            <div class="text-center text-white p-8">
                <div class="text-6xl mb-4">🎉</div>
                <h2 class="text-2xl font-bold mb-2">${this.currentStore} Complete!</h2>
                <p class="text-lg mb-4">Total spent: $${this.currentTotal.toFixed(2)}</p>
                <button class="px-6 py-3 bg-white text-green-600 rounded-lg font-bold" onclick="this.parentElement.parentElement.remove()">
                    Continue Shopping
                </button>
            </div>
        `;
        
        document.body.appendChild(celebration);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            celebration.remove();
        }, 5000);
    }
}

// Initialize in-store mode when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.inStoreMode = new InStoreMode();
});

// Add in-store mode styles
const inStoreStyles = `
.in-store-mode {
    /* Larger touch targets for cart-friendly use */
}

.in-store-mode .shopping-item {
    padding: 1rem;
    margin-bottom: 0.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    min-height: 80px;
}

.in-store-mode .item-checkbox {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 3px solid #10b981;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
}

.in-store-mode .item-checkbox:hover {
    background: #f0fdf4;
    transform: scale(1.1);
}

.in-store-mode .product-image {
    width: 150px;
    height: 150px;
    object-fit: cover;
    border-radius: 0.5rem;
}

.in-store-mode .product-name {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.3;
}

.in-store-mode .product-price {
    font-size: 1.5rem;
    font-weight: bold;
    color: #059669;
}

.completed-item {
    opacity: 0.6;
    order: 999;
}

.checkmark-animation {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 3rem;
    animation: checkmark-bounce 0.5s ease-in-out;
}

@keyframes checkmark-bounce {
    0% { transform: translate(-50%, -50%) scale(0); }
    50% { transform: translate(-50%, -50%) scale(1.2); }
    100% { transform: translate(-50%, -50%) scale(1); }
}

.quick-action-btn {
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
    min-height: 44px;
    min-width: 120px;
    touch-action: manipulation;
}

@media (max-width: 640px) {
    .in-store-mode .shopping-item {
        padding: 1.5rem;
        min-height: 100px;
    }
    
    .in-store-mode .item-checkbox {
        width: 80px;
        height: 80px;
        font-size: 32px;
    }
}
`;

// Inject styles
const styleElement = document.createElement('style');
styleElement.textContent = inStoreStyles;
document.head.appendChild(styleElement);