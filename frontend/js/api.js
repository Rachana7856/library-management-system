const API_BASE_URL = 'http://localhost:5000/api';

class API {
    static async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Dashboard Data
    static async getDashboard() {
        return await this.request('/dashboard');
    }

    // Student Management
    static async addStudent(studentData) {
        return await this.request('/add-student', {
            method: 'POST',
            body: JSON.stringify(studentData)
        });
    }

    // Resource Allocation
    static async getAllocations() {
        return await this.request('/allocations');
    }

    static async deallocateResource(resourceId) {
        return await this.request(`/deallocate/${resourceId}`, {
            method: 'POST'
        });
    }

    // Queue Management
    static async getQueues() {
        return await this.request('/queues');
    }

    // Get all resources
    static async getAllResources() {
        return await this.request('/resources');
    }

    // Allocate next in queue
    static async allocateNext(resourceType) {
        return await this.request('/allocate-next', {
            method: 'POST',
            body: JSON.stringify({ resource_type: resourceType })
        });
    }
}

// Utility function to update time
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString() + ' | ' + now.toLocaleDateString();
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// Update time every second
setInterval(updateCurrentTime, 1000);
updateCurrentTime();