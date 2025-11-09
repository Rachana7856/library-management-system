class Dashboard {


    constructor() {
        this.currentTab = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initResourceChart(); // Add this line
        this.loadDashboardData();
        this.startRealTimeUpdates();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(item.dataset.tab);
            });
        });

        // Student form submission
        const studentForm = document.getElementById('studentForm');
        if (studentForm) {
            studentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addStudent();
            });
        }
    }

    switchTab(tabName) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;
        
        // Load tab-specific data
        if (tabName === 'dashboard') {
            this.loadDashboardData();
        } else if (tabName === 'student-management') {
            this.loadStudentManagementData();
        } else if (tabName === 'resource-allocation') {
            this.loadResourceAllocationData();
        } else if (tabName === 'queue-management') {
            this.loadQueueManagementData();
        }
    }

   // In loadDashboardData method - fix the typo:
async loadDashboardData() {
    try {
        const response = await API.getDashboard();
        if (response.success) {
            this.updateDashboardStats(response.data);  // Remove extra 's'
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

    // --- UPDATED METHOD START ---
    updateDashboardStats(data) {
    console.log("🎯 Dashboard data received:", data); 

    const totalPCs = 10; // Fixed total PC count

    const allocatedPCs = data.allocated_resources?.pc || 0;
    const allocatedBooks = data.allocated_resources?.book || 0;
    const allocatedSeats = data.allocated_resources?.seat || 0;

    const availablePCs = totalPCs - allocatedPCs;
    const availableBooks = data.available_resources?.book || 0;
    const availableSeats = data.available_resources?.seat || 0;
    
    // Update statistics cards
    if (document.getElementById('total-students')) {
        document.getElementById('total-students').textContent = data.total_students || 0;
        document.getElementById('available-pcs').textContent = availablePCs; // Calculate available
        document.getElementById('available-books').textContent = availableBooks;
        document.getElementById('available-seats').textContent = availableSeats;
    }
    
    // Update queue counts
    if (document.getElementById('pc-queue-count')) {
        document.getElementById('pc-queue-count').textContent = data.queue_counts?.pc || 0;
        document.getElementById('book-queue-count').textContent = data.queue_counts?.book || 0; 
        document.getElementById('seat-queue-count').textContent = data.queue_counts?.seat || 0;
    }

    // Update allocation status (Total allocated count should sum allocated across all types)
    const totalAllocated = allocatedPCs + allocatedBooks + allocatedSeats;
    if (document.getElementById('total-allocated')) {
        document.getElementById('total-allocated').textContent = totalAllocated;
    }

    // Update resource chart 
    if (this.resourceChart) {
        const totalAvailable = availablePCs + availableBooks + availableSeats;

        this.resourceChart.data.datasets[0].data = [
            allocatedPCs,
            allocatedBooks,
            allocatedSeats,
            totalAvailable
        ];
        this.resourceChart.update();
    }
}
// --- UPDATED METHOD END ---

    async addStudent() {
        const formData = {
            name: document.getElementById('studentName').value,
            student_id: document.getElementById('studentId').value,
            resource_type: document.getElementById('requestType').value,
            priority: parseInt(document.getElementById('priority').value),
            required_time: parseInt(document.getElementById('burstTime').value)
        };

        // Basic validation
        if (!formData.name || !formData.student_id || !formData.resource_type) {
            this.showNotification('Please fill all required fields', 'error');
            return;
        }

        try {
            const result = await API.addStudent(formData);
            
            if (result.success) {
                // *** FIX APPLIED HERE: Use student ID and name for clearer message ***
                // The previous code might have resulted in a generic, repeated string.
                this.showNotification(`Student ID ${formData.student_id} (${formData.name}) ${result.message}`, 'success');
                // If the issue persists, the server's 'result.message' might be the problem. 
                // A safer alternative is:
                // this.showNotification(`Student ID ${formData.student_id} added successfully. Check allocation status.`, 'success');

                document.getElementById('studentForm').reset();
                
                // Refresh data
                this.loadDashboardData();
                if (this.currentTab === 'student-management') {
                    this.loadStudentManagementData();
                }
            } else {
                this.showNotification('Error: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Error adding student: ' + error.message, 'error');
        }
    }

    async loadStudentManagementData() {
        try {
            const [allocationsResponse, queuesResponse] = await Promise.all([
                API.getAllocations(),
                API.getQueues()
            ]);

            if (allocationsResponse.success) {
                this.updateAllocatedTable(allocationsResponse.data);
            }

            if (queuesResponse.success) {
                this.updateReadyTable(queuesResponse.data);
                this.updateStudentManagementStatus(allocationsResponse.data, queuesResponse.data);
            }
            
        } catch (error) {
            console.error('Error loading student management data:', error);
        }
    }

    updateAllocatedTable(allocations) {
        const tbody = document.getElementById('allocatedTableBody');
        if (!tbody) return;
        
        if (!allocations || allocations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">No resources currently allocated</td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = allocations.map((item, index) => `
            <tr>
                <td>${item.student_name}</td>
                <td>${item.student_id}</td>
                <td>
                    <span class="resource-badge ${item.resource_type}">
                        ${item.resource_name}
                    </span>
                </td>
                <td>
                    <span class="priority-badge priority-${item.priority}">
                        ${item.priority}
                    </span>
                </td>
                <td>${item.time_required}m</td>
                <td>
                    <span class="status-badge allocated">ALLOCATED</span>
                </td>
                <td>
                    <button class="action-btn deallocate-btn" onclick="dashboard.deallocateResource('${item.resource_id}')">
                        <i class="fas fa-stop"></i>
                        Deallocate
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateReadyTable(queueData) {
        const tbody = document.getElementById('readyTableBody');
        if (!tbody) return;

        // Combine all queue students
        const allQueueStudents = [];
        Object.values(queueData).forEach(queue => {
            if (queue.students && queue.students.length > 0) {
                allQueueStudents.push(...queue.students);
            }
        });

        if (allQueueStudents.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">No students in ready queue</td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = allQueueStudents.map((student, index) => `
            <tr>
                <td>
                    <span class="queue-position">#${student.position}</span>
                </td>
                <td>${student.student_name}</td>
                <td>${student.student_id}</td>
                <td>
                    <span class="resource-badge ${student.resource_type}">
                        ${student.resource_type.toUpperCase()}
                    </span>
                </td>
                <td>
                    <span class="priority-badge priority-${student.priority}">
                        ${student.priority}
                    </span>
                </td>
                <td>${student.arrival_time}</td>
                <td>
                    <span class="wait-time">${student.wait_time}</span>
                </td>
            </tr>
        `).join('');
    }

    updateStudentManagementStatus(allocations, queueData) {
        if (document.getElementById('total-allocated')) {
            const totalAllocated = allocations ? allocations.length : 0;
            const totalInQueue = Object.values(queueData).reduce((total, queue) => total + (queue.length || 0), 0);
            
            document.getElementById('total-allocated').textContent = totalAllocated;
            document.getElementById('total-ready').textContent = totalInQueue;
        }
    }

    async loadResourceAllocationData() {
        try {
            const [allocationsResponse, dashboardResponse] = await Promise.all([
                API.getAllocations(),
                API.getDashboard()
            ]);

            if (allocationsResponse.success) {
                this.updateResourceTables(allocationsResponse.data);
            }

            if (dashboardResponse.success) {
                this.updateResourceCounts(dashboardResponse.data);
            }
            
        } catch (error) {
            console.error('Error loading resource allocation data:', error);
        }
    }

    updateResourceTables(allocations) {
        // Clear existing tables
        const pcTableBody = document.getElementById('pcTableBody');
        const bookTableBody = document.getElementById('bookTableBody');
        const seatTableBody = document.getElementById('seatTableBody');

        if (pcTableBody) pcTableBody.innerHTML = '';
        if (bookTableBody) bookTableBody.innerHTML = '';
        if (seatTableBody) seatTableBody.innerHTML = '';

        // Group allocations by resource type
        const pcAllocations = allocations.filter(a => a.resource_type === 'pc');
        const bookAllocations = allocations.filter(a => a.resource_type === 'book');
        const seatAllocations = allocations.filter(a => a.resource_type === 'seat');

        // Update PC Table
        if (pcTableBody) {
            if (pcAllocations.length === 0) {
                pcTableBody.innerHTML = '<tr><td colspan="6" class="no-data">No PCs allocated</td></tr>';
            } else {
                pcTableBody.innerHTML = pcAllocations.map(item => `
                    <tr>
                        <td>${item.resource_id}</td>
                        <td>
                            <span class="status-badge allocated">ALLOCATED</span>
                        </td>
                        <td>${item.student_name}</td>
                        <td>${item.student_id}</td>
                        <td>${item.remaining_time || item.time_required}m</td>
                        <td>
                            <button class="action-btn deallocate-btn" onclick="dashboard.deallocateResource('${item.resource_id}')">
                                <i class="fas fa-stop"></i>
                                Deallocate
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // Update Book Table
        if (bookTableBody) {
            if (bookAllocations.length === 0) {
                bookTableBody.innerHTML = '<tr><td colspan="7" class="no-data">No books allocated</td></tr>';
            } else {
                bookTableBody.innerHTML = bookAllocations.map(item => `
                    <tr>
                        <td>${item.resource_id}</td>
                        <td>${item.resource_name}</td>
                        <td>
                            <span class="status-badge allocated">ALLOCATED</span>
                        </td>
                        <td>${item.student_name}</td>
                        <td>${item.student_id}</td>
                        <td>${new Date(Date.now() + (item.remaining_time || item.time_required) * 60000).toLocaleDateString()}</td>
                        <td>
                            <button class="action-btn deallocate-btn" onclick="dashboard.deallocateResource('${item.resource_id}')">
                                <i class="fas fa-stop"></i>
                                Deallocate
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // Update Seat Table
        if (seatTableBody) {
            if (seatAllocations.length === 0) {
                seatTableBody.innerHTML = '<tr><td colspan="6" class="no-data">No seats allocated</td></tr>';
            } else {
                seatTableBody.innerHTML = seatAllocations.map(item => `
                    <tr>
                        <td>${item.resource_id}</td>
                        <td>
                            <span class="status-badge allocated">ALLOCATED</span>
                        </td>
                        <td>${item.student_name}</td>
                        <td>${item.student_id}</td>
                        <td>${item.remaining_time || item.time_required}m</td>
                        <td>
                            <button class="action-btn deallocate-btn" onclick="dashboard.deallocateResource('${item.resource_id}')">
                                <i class="fas fa-stop"></i>
                                Deallocate
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }
    }

    updateResourceCounts(dashboardData) {
        // Update resource card counts
        const allocatedPCs = dashboardData.allocated_resources?.pc || 0;
        const availablePCs = 10 - allocatedPCs; // Use fixed 10 again for consistency
        const allocatedBooks = dashboardData.allocated_resources?.book || 0;
        const allocatedSeats = dashboardData.allocated_resources?.seat || 0;
        const totalAllocated = allocatedPCs + allocatedBooks + allocatedSeats;
        
        if (document.getElementById('pc-available')) {
            document.getElementById('pc-available').textContent = availablePCs;
            document.getElementById('pc-allocated').textContent = allocatedPCs;
            document.getElementById('pc-queue').textContent = dashboardData.queue_counts.pc || 0;

            document.getElementById('book-available').textContent = dashboardData.available_resources.book || 0;
            document.getElementById('book-allocated').textContent = allocatedBooks;
            document.getElementById('book-queue').textContent = dashboardData.queue_counts.book || 0;

            document.getElementById('seat-available').textContent = dashboardData.available_resources.seat || 0;
            document.getElementById('seat-allocated').textContent = allocatedSeats;
            document.getElementById('seat-queue').textContent = dashboardData.queue_counts.seat || 0;
        }
    }

    async loadQueueManagementData() {
        try {
            const response = await API.getQueues();
            if (response.success) {
                this.updateQueueCards(response.data);
            }
        } catch (error) {
            console.error('Error loading queue management data:', error);
        }
    }

    updateQueueCards(queueData) {
        // Update PC Queue
        const pcQueueList = document.getElementById('pc-queue-list');
        if (pcQueueList) {
            const pcQueue = queueData.pc?.students || [];
            if (pcQueue.length === 0) {
                pcQueueList.innerHTML = '<div class="empty-queue">No students in PC queue</div>';
            } else {
                pcQueueList.innerHTML = pcQueue.map(student => `
                    <div class="queue-item">
                        <div class="student-info">
                            <h4>${student.student_name}</h4>
                            <p>ID: ${student.student_id}</p>
                        </div>
                        <div class="priority priority-${student.priority}">
                            P${student.priority}
                        </div>
                    </div>
                `).join('');
            }
            document.getElementById('pc-queue-count').textContent = pcQueue.length;
        }

        // Update Book Queue
        const bookQueueList = document.getElementById('book-queue-list');
        if (bookQueueList) {
            const bookQueue = queueData.book?.students || [];
            if (bookQueue.length === 0) {
                bookQueueList.innerHTML = '<div class="empty-queue">No students in Book queue</div>';
            } else {
                bookQueueList.innerHTML = bookQueue.map(student => `
                    <div class="queue-item book-queue">
                        <div class="student-info">
                            <h4>${student.student_name}</h4>
                            <p>ID: ${student.student_id}</p>
                        </div>
                        <div class="priority priority-${student.priority}">
                            P${student.priority}
                        </div>
                    </div>
                `).join('');
            }
            document.getElementById('book-queue-count').textContent = bookQueue.length;
        }

        // Update Seat Queue
        const seatQueueList = document.getElementById('seat-queue-list');
        if (seatQueueList) {
            const seatQueue = queueData.seat?.students || [];
            if (seatQueue.length === 0) {
                seatQueueList.innerHTML = '<div class="empty-queue">No students in Seat queue</div>';
            } else {
                seatQueueList.innerHTML = seatQueue.map(student => `
                    <div class="queue-item seat-queue">
                        <div class="student-info">
                            <h4>${student.student_name}</h4>
                            <p>ID: ${student.student_id}</p>
                        </div>
                        <div class="priority priority-${student.priority}">
                            P${student.priority}
                        </div>
                    </div>
                `).join('');
            }
            document.getElementById('seat-queue-count').textContent = seatQueue.length;
        }
    }

    async deallocateResource(resourceId) {
        try {
            const result = await API.deallocateResource(resourceId);
            
            if (result.success) {
                this.showNotification('Resource deallocated successfully!', 'success');
                
                // Refresh all data
                this.loadDashboardData();
                if (this.currentTab === 'student-management') {
                    this.loadStudentManagementData();
                }
                if (this.currentTab === 'resource-allocation') {
                    this.loadResourceAllocationData();
                }
                if (this.currentTab === 'queue-management') {
                    this.loadQueueManagementData();
                }
            } else {
                this.showNotification('Error: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Error deallocating: ' + error.message, 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    startRealTimeUpdates() {
        setInterval(() => {
            if (this.currentTab === 'dashboard') {
                this.loadDashboardData();
            } else if (this.currentTab === 'student-management') {
                this.loadStudentManagementData();
            } else if (this.currentTab === 'resource-allocation') {
                this.loadResourceAllocationData();
            } else if (this.currentTab === 'queue-management') {
                this.loadQueueManagementData();
            }
        }, 5000);
    }

    
    async deallocateRandomResource(resourceType) {
        try {
            // Get current allocations and deallocate one random resource of the specified type
            const allocationsResponse = await API.getAllocations();
            if (allocationsResponse.success) {
                const resourceAllocations = allocationsResponse.data.filter(a => a.resource_type === resourceType);
                if (resourceAllocations.length > 0) {
                    const randomAllocation = resourceAllocations[Math.floor(Math.random() * resourceAllocations.length)];
                    await this.deallocateResource(randomAllocation.resource_id);
                } else {
                    this.showNotification(`No allocated ${resourceType} resources to deallocate`, 'warning');
                }
            }
        } catch (error) {
            this.showNotification('Error deallocating random resource: ' + error.message, 'error');
        }
    }

    // UPDATED runScheduling method
    async runScheduling(algorithm) {
        try {
            this.showNotification(`${algorithm.toUpperCase()} scheduling simulation started`, 'info');
            
            // Get current queue data
            const queueResponse = await API.getQueues();
            if (!queueResponse.success) {
                this.showNotification('Error loading queue data', 'error');
                return;
            }

            const queueData = queueResponse.data;
            const timeline = document.getElementById('scheduling-timeline');
            
            if (!timeline) {
                console.error('Timeline element not found');
                return;
            }

            // Clear previous timeline
            timeline.innerHTML = '';

            // Process each queue based on the algorithm
            const queues = ['pc', 'book', 'seat'];
            let hasStudents = false;

            queues.forEach(queueType => {
                const students = queueData[queueType]?.students || [];
                
                if (students.length > 0) {
                    hasStudents = true;
                    
                    // Sort students based on algorithm
                    const sortedStudents = this.sortStudentsByAlgorithm(students, algorithm);
                    
                    // Create timeline entries
                    sortedStudents.forEach((student, index) => {
                        const timelineItem = this.createTimelineItem(student, queueType, algorithm, index);
                        timeline.appendChild(timelineItem);
                    });
                }
            });

            if (!hasStudents) {
                timeline.innerHTML = `
                    <div class="empty-timeline">
                        <i class="fas fa-info-circle"></i>
                        No students in any queue to schedule
                    </div>
                `;
            }

        } catch (error) {
            this.showNotification('Error running scheduling: ' + error.message, 'error');
            console.error('Scheduling error:', error);
        }
    }

    // NEW helper method - ROUND ROBIN CASE REMOVED
    sortStudentsByAlgorithm(students, algorithm) {
        switch (algorithm) {
            case 'priority':
                // Sort by priority (highest first), then by arrival time
                return [...students].sort((a, b) => {
                    if (b.priority !== a.priority) {
                        return b.priority - a.priority;
                    }
                    // FCFS tie-breaker (using arrival time string comparison)
                    return new Date(a.arrival_time) - new Date(b.arrival_time);
                });

            case 'fcfs':
                // Sort by arrival time (oldest first)
                return [...students].sort((a, b) => 
                    new Date(a.arrival_time) - new Date(b.arrival_time)
                );

            default:
                return students;
        }
    }

    // NEW helper method
    createTimelineItem(student, resourceType, algorithm, position) {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        const resourceIcons = {
            'pc': '💻',
            'book': '📚',
            'seat': '🪑'
        };

        const algorithmNames = {
            'priority': 'Priority',
            'fcfs': 'FCFS'
        };

        const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        item.innerHTML = `
            <div class="timeline-time">${currentTime}</div>
            <div class="timeline-content">
                <div class="timeline-student">
                    <strong>${student.student_name}</strong> (ID: ${student.student_id})
                </div>
                <div class="timeline-details">
                    <span class="resource-badge ${resourceType}">
                        ${resourceIcons[resourceType]} ${resourceType.toUpperCase()}
                    </span>
                    <span class="priority-badge priority-${student.priority}">
                        Priority ${student.priority}
                    </span>
                    <span class="algorithm-badge">
                        ${algorithmNames[algorithm]}
                    </span>
                </div>
                <div class="timeline-position">
                    Queue Position: ${position + 1}
                </div>
            </div>
        `;

        return item;
    }


    // Add these methods to your Dashboard class

async initializeSampleData() {
    try {
        const response = await fetch('http://localhost:5000/api/initialize-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            this.showNotification('Sample data initialized! Check queues and resource allocation.', 'success');
            
            // Refresh all data
            this.loadDashboardData();
            if (this.currentTab === 'student-management') {
                this.loadStudentManagementData();
            }
            if (this.currentTab === 'resource-allocation') {
                this.loadResourceAllocationData();
            }
            if (this.currentTab === 'queue-management') {
                this.loadQueueManagementData();
            }
        } else {
            this.showNotification('Error: ' + result.error, 'error');
        }
    } catch (error) {
        this.showNotification('Error initializing data: ' + error.message, 'error');
    }
}

async resetData() {
    try {
        const response = await fetch('http://localhost:5000/api/reset-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            this.showNotification('All data reset! System reinitialized with sample data.', 'success');
            
            // Refresh all data
            this.loadDashboardData();
            if (this.currentTab === 'student-management') {
                this.loadStudentManagementData();
            }
            if (this.currentTab === 'resource-allocation') {
                this.loadResourceAllocationData();
            }
            if (this.currentTab === 'queue-management') {
                this.loadQueueManagementData();
            }
        } else {
            this.showNotification('Error: ' + result.error, 'error');
        }
    } catch (error) {
        this.showNotification('Error resetting data: ' + error.message, 'error');
    }
}

async demoPreemption() {
    // Demonstrate priority preemption
    try {
        // First add a low priority student who gets allocated
        const lowPriorityStudent = {
            name: "Low Priority Student",
            student_id: "2001",
            resource_type: "pc",
            priority: 1,
            required_time: 60
        };
        
        const lowResult = await API.addStudent(lowPriorityStudent);
        
        if (lowResult.success) {
            this.showNotification('Low priority student added and allocated', 'info');
            
            // Wait a bit then add high priority student
            setTimeout(async () => {
                const highPriorityStudent = {
                    name: "HIGH PRIORITY Student",
                    student_id: "2002",
                    resource_type: "pc",
                    priority: 5,
                    required_time: 30
                };
                
                const highResult = await API.addStudent(highPriorityStudent);
                
                if (highResult.success) {
                    this.showNotification('🚨 HIGH PRIORITY student added! Should preempt low priority student', 'warning');
                    
                    // Refresh data to show preemption
                    setTimeout(() => {
                        this.loadDashboardData();
                        this.loadStudentManagementData();
                        this.loadResourceAllocationData();
                    }, 1000);
                }
            }, 2000);
        }
    } catch (error) {
        this.showNotification('Error in preemption demo: ' + error.message, 'error');
    }
}

async demoFCFS() {
    // Demonstrate FCFS within same priority
    try {
        const students = [
            {name: "First Student", student_id: "3001", resource_type: "seat", priority: 2, required_time: 30},
            {name: "Second Student", student_id: "3002", resource_type: "seat", priority: 2, required_time: 25},
            {name: "Third Student", student_id: "3003", resource_type: "seat", priority: 2, required_time: 35}
        ];
        
        this.showNotification('Adding 3 students with same priority to demonstrate FCFS...', 'info');
        
        for (let i = 0; i < students.length; i++) {
            setTimeout(async () => {
                const result = await API.addStudent(students[i]);
                if (result.success) {
                    this.showNotification(`Added ${students[i].name} to ${students[i].resource_type} queue`, 'info');
                }
                
                // Refresh data after last student
                if (i === students.length - 1) {
                    setTimeout(() => {
                        this.loadDashboardData();
                        this.loadStudentManagementData();
                        this.loadQueueManagementData();
                    }, 1000);
                }
            }, i * 1000); // Add students with 1 second delay
        }
    } catch (error) {
        this.showNotification('Error in FCFS demo: ' + error.message, 'error');
    }
}

// Add this method to your Dashboard class
initResourceChart() {
    const ctx = document.getElementById('resourceChart');
    if (!ctx) return;

    this.resourceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['PCs Allocated', 'Books Allocated', 'Seats Allocated', 'Available'],
            datasets: [{
                data: [0, 0, 0, 0], // Initial data
                backgroundColor: [
                    '#FF6384', // PC - Red
                    '#36A2EB', // Book - Blue
                    '#FFCE56', // Seat - Yellow
                    '#4BC0C0'  // Available - Teal
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}
} // End of Dashboard class

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUsername');
        window.location.href = 'index.html';
    }
}