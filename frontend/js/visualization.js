class LibraryVisualization {
    constructor() {
        this.currentView = 'overview';
        this.resourceData = {
            pcs: [],
            seats: [],
            books: []
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.startRealTimeUpdates();
    }

    setupEventListeners() {
        // View controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.closest('.view-btn').dataset.view);
            });
        });

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadInitialData();
        });

        // Modal close
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on outside click
        document.getElementById('resource-modal').addEventListener('click', (e) => {
            if (e.target.id === 'resource-modal') {
                this.closeModal();
            }
        });
    }

    switchView(view) {
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Update view content
        document.querySelectorAll('.view-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${view}-view`).classList.add('active');

        this.currentView = view;
        
        // Load view-specific data if needed
        if (view !== 'overview') {
            this.loadDetailedView(view);
        }
    }

    async loadInitialData() {
        try {
            const [dashboardResponse, allocationsResponse] = await Promise.all([
                API.getDashboard(),
                API.getAllocations()
            ]);

            if (dashboardResponse.success && allocationsResponse.success) {
                this.updateStats(dashboardResponse.data);
                this.updateVisualizations(allocationsResponse.data);
                // Note: updateActivityFeed is now called within updateVisualizations
            }
        } catch (error) {
            console.error('Error loading library data:', error);
        }
    }

    // --- UPDATED updateStats FUNCTION ---
    updateStats(data) {
        const totalPCs = 10; // CHANGED TO 10
        
        // Update real-time statistics
        document.getElementById('pc-allocated-count').textContent = data.allocated_resources?.pc || 0;
        document.getElementById('seat-allocated-count').textContent = data.allocated_resources?.seat || 0;
        document.getElementById('book-allocated-count').textContent = data.allocated_resources?.book || 0;
        document.getElementById('total-students-count').textContent = data.total_students || 0;

        // Update progress bars - CHANGED TO 10
        // Assuming max capacity: PC=10, Seat=50, Book=100
        const pcUsage = ((data.allocated_resources?.pc || 0) / totalPCs) * 100;
        const seatUsage = ((data.allocated_resources?.seat || 0) / 50) * 100;
        const bookUsage = ((data.allocated_resources?.book || 0) / 100) * 100;

        document.querySelector('.pc-fill').style.width = `${pcUsage}%`;
        document.querySelector('.seat-fill').style.width = `${seatUsage}%`;
        document.querySelector('.book-fill').style.width = `${bookUsage}%`;

        // Update usage text - CHANGED TO 10
        document.getElementById('pc-usage').textContent = `${data.allocated_resources?.pc || 0}/${totalPCs}`;
        document.getElementById('seat-usage').textContent = `${data.allocated_resources?.seat || 0}/50`;
        document.getElementById('book-usage').textContent = `${data.allocated_resources?.book || 0}/100`;
    }

    // --- UPDATED updateVisualizations FUNCTION (No functional changes) ---
    updateVisualizations(allocations) {
        console.log("🖥️ Allocations received:", allocations);
        
        // Log specific allocations for debugging
        const pcAllocs = allocations.filter(a => a.resource_type === 'pc');
        const seatAllocs = allocations.filter(a => a.resource_type === 'seat');
        const bookAllocs = allocations.filter(a => a.resource_type === 'book');
        
        console.log("💻 PC Allocations:", pcAllocs);
        console.log("🪑 Seat Allocations:", seatAllocs);
        console.log("📚 Book Allocations:", bookAllocs);
        
        this.generatePCGrid(pcAllocs);
        this.generateSeatingGrid(seatAllocs);
        this.generateBooksGrid(bookAllocs);
        this.updateActivityFeed(allocations);
    }

    // --- UPDATED generatePCGrid FUNCTION ---
    generatePCGrid(pcAllocations) {
        const grid = document.getElementById('pc-grid');
        const detailedGrid = document.getElementById('detailed-pc-grid');
        
        const pcElements = [];
        const totalPCs = 10; // CHANGED TO 10
        
        console.log("🖥️ Generating PC Grid for", totalPCs, "PCs");
        
        // Generate PCs that match your allocation data ("PC-01" to "PC-10")
        for (let i = 1; i <= totalPCs; i++) {
            const pcId = `PC-${i.toString().padStart(2, '0')}`; // PC-01, PC-02, ..., PC-10
            
            // Find allocation for this specific PC
            const allocation = pcAllocations.find(a => a.resource_id === pcId);
            
            const pcElement = this.createPCElement(pcId, allocation);
            pcElements.push(pcElement);
        }
        
        grid.innerHTML = pcElements.join('');
        if (detailedGrid) {
            detailedGrid.innerHTML = pcElements.join('');
        }
        
        console.log(`🎯 PC Grid Complete: ${pcAllocations.length} allocated, ${totalPCs - pcAllocations.length} available`);
    }

    createPCElement(pcId, allocation) {
        const isAllocated = !!allocation;
        const statusClass = isAllocated ? 'allocated' : 'available';
        const statusText = isAllocated ? 'In Use' : 'Available';
        
        return `
            <div class="resource-item ${statusClass}" data-resource-id="${pcId}" data-type="pc">
                <div class="resource-id">${pcId}</div>
                <div class="resource-status">${statusText}</div>
                ${isAllocated ? `
                    <div class="student-info">
                        <strong>${allocation.student_name}</strong>
                        <div>ID: ${allocation.student_id}</div>
                        <div>${allocation.remaining_time || allocation.time_required}m left</div>
                    </div>
                ` : '<div class="student-info">Click to allocate</div>'}
            </div>
        `;
    }

    // --- ORIGINAL FUNCTION (Seat Generation Match) ---
    generateSeatingGrid(seatAllocations) {
        const grid = document.getElementById('seating-grid');
        const detailedGrid = document.getElementById('detailed-seating-grid');
        
        const seatElements = [];
        
        // Generate seats that match your allocation data ("Seat-001" to "Seat-050")
        for (let i = 1; i <= 50; i++) {
            const seatId = `Seat-${i.toString().padStart(3, '0')}`;
            const allocation = seatAllocations.find(a => a.resource_id === seatId);
            
            const seatElement = this.createSeatElement(seatId, allocation);
            seatElements.push(seatElement);
        }
        
        grid.innerHTML = seatElements.join('');
        if (detailedGrid) {
            detailedGrid.innerHTML = seatElements.join('');
        }
    }

    createSeatElement(seatId, allocation) {
    const isAllocated = !!allocation;
    const statusClass = isAllocated ? 'allocated' : 'available';
    const statusText = isAllocated ? 'Occupied' : 'Available';
    
    return `
        <div class="seat-item ${statusClass}" data-resource-id="${seatId}" data-type="seat">
            <div class="resource-id">${seatId}</div>
            <div class="resource-status">${statusText}</div>
            ${isAllocated ? `
                <div class="student-info-compact">
                    <strong title="${allocation.student_name}">${allocation.student_name}</strong>
                </div>
            ` : ''}
        </div>
    `;
}

    // --- ORIGINAL FUNCTION (Book Generation Match) ---
    generateBooksGrid(bookAllocations) {
        const grid = document.getElementById('book-shelves');
        const detailedGrid = document.getElementById('detailed-books-grid');
        
        const bookElements = [];
        
        // Generate 20 books that match your allocation data ("Book-001" to "Book-020")
        const bookTitles = [
            "Operating Systems", "Computer Networks", "Data Structures", 
            "Algorithms", "Database Systems", "Software Engineering",
            "Computer Architecture", "Artificial Intelligence", "Machine Learning",
            "Web Development", "Mobile Apps", "Cloud Computing",
            "Cyber Security", "Data Science", "Python Programming",
            "Java Programming", "C++ Programming", "Network Security",
            "Database Design", "System Analysis"
        ];

        for (let i = 1; i <= 20; i++) {
            const bookId = `Book-${i.toString().padStart(3, '0')}`; 
            const allocation = bookAllocations.find(a => a.resource_id === bookId);
            
            const bookData = {
                id: bookId,
                title: bookTitles[i-1] || `Book ${i}`,
                author: "Various Authors"
            };
            
            const bookElement = this.createBookElement(bookData, allocation);
            bookElements.push(bookElement);
        }
        
        grid.innerHTML = bookElements.join('');
        if (detailedGrid) {
            detailedGrid.innerHTML = bookElements.join('');
        }
    }

    createBookElement(book, allocation) {
        const isAllocated = !!allocation;
        const statusClass = isAllocated ? 'allocated' : 'available';
        const statusText = isAllocated ? 'Issued' : 'Available';
        
        return `
            <div class="book-item ${statusClass}" data-resource-id="${book.id}" data-type="book">
                <div class="resource-id">${book.id}</div>
                <div class="book-title">${book.title}</div>
                <div class="book-author">${book.author}</div>
                <div class="resource-status">${statusText}</div>
                ${isAllocated ? `
                    <div class="student-info">
                        Issued to: <strong>${allocation.student_name}</strong>
                        <div>Due: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    updateActivityFeed(allocations) {
        const feed = document.getElementById('activity-feed');
        const activities = [];
        
        // Generate recent activities
        allocations.forEach(allocation => {
            const activity = this.createActivityItem(allocation);
            activities.push(activity);
        });
        
        // Add some sample activities if none exist
        if (activities.length === 0) {
            activities.push(`
                <div class="activity-item pc">
                    <div class="activity-time">Just now</div>
                    <div class="activity-text">System initialized. No active allocations.</div>
                </div>
            `);
        }
        
        feed.innerHTML = activities.join('');
    }

    createActivityItem(allocation) {
        const resourceTypes = {
            'pc': 'PC',
            'seat': 'Seat',
            'book': 'Book'
        };
        
        const timeAgo = this.getTimeAgo(new Date());
        
        return `
            <div class="activity-item ${allocation.resource_type}">
                <div class="activity-time">${timeAgo}</div>
                <div class="activity-text">
                    <strong>${allocation.student_name}</strong> allocated 
                    ${resourceTypes[allocation.resource_type]} ${allocation.resource_id}
                </div>
            </div>
        `;
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    }

    loadDetailedView(view) {
        // This would load more detailed information for the specific view
        console.log(`Loading detailed view for: ${view}`);
    }

    showResourceDetails(resourceId, resourceType) {
        const modal = document.getElementById('resource-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        // In a real implementation, you would fetch detailed resource info
        modalTitle.textContent = `${resourceId} Details`;
        modalBody.innerHTML = `
            <div class="resource-details">
                <h4>Resource Information</h4>
                <p><strong>Type:</strong> ${resourceType.toUpperCase()}</p>
                <p><strong>Status:</strong> Active</p>
                <p><strong>Location:</strong> ${this.getResourceLocation(resourceType)}</p>
                
                <div class="action-buttons">
                    <button class="action-btn deallocate" onclick="libraryViz.deallocateResource('${resourceId}')">
                        <i class="fas fa-stop"></i>
                        Deallocate
                    </button>
                    <button class="action-btn info" onclick="libraryViz.showMoreInfo('${resourceId}')">
                        <i class="fas fa-info-circle"></i>
                        More Info
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }

    getResourceLocation(type) {
        const locations = {
            'pc': 'PC Zone - Row A',
            'seat': 'Study Area - Section B',
            'book': 'Books Section - Shelf 3'
        };
        return locations[type] || 'Main Library';
    }

    closeModal() {
        document.getElementById('resource-modal').classList.remove('active');
    }

    deallocateResource(resourceId) {
        // This would call your API to deallocate the resource
        console.log(`Deallocating resource: ${resourceId}`);
        this.showNotification(`Resource ${resourceId} deallocated successfully!`, 'success');
        this.closeModal();
        this.loadInitialData(); // Refresh data
    }

    showMoreInfo(resourceId) {
        // Show extended information about the resource
        this.showNotification(`More info for ${resourceId} would be shown here`, 'info');
    }

    showNotification(message, type = 'info') {
        // You can reuse the notification system from your dashboard
        if (window.dashboard && window.dashboard.showNotification) {
            window.dashboard.showNotification(message, type);
        } else {
            alert(message); // Fallback
        }
    }

    startRealTimeUpdates() {
        // Update data every 10 seconds
        setInterval(() => {
            this.loadInitialData();
        }, 10000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.libraryViz = new LibraryVisualization();
    
    // Add click handlers for resource items
    document.addEventListener('click', (e) => {
        const resourceItem = e.target.closest('.resource-item, .seat-item, .book-item');
        if (resourceItem) {
            const resourceId = resourceItem.dataset.resourceId;
            const resourceType = resourceItem.dataset.type;
            window.libraryViz.showResourceDetails(resourceId, resourceType);
        }
    });
});