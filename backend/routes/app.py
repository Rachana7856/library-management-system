from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import os

# Add the parent directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from models.student import Student
from models.resource import Resource
from models.queue import Queue
from models.allocations import Allocation

app = Flask(__name__)
CORS(app)

# Initialize resource management
process_manager = None

class ProcessManager:
    def __init__(self):
        self.queues = {
            'pc': Queue('pc'),
            'book': Queue('book'),
            'seat': Queue('seat')
        }
        self.resources = self.initialize_resources()
        self.allocations = Allocation()
        self.preemption_count = 0
        
    def initialize_resources(self):
        resources = []
        # Initialize PC resources - ONLY 10 PCs total
        for i in range(1, 11):
            resources.append(Resource(f"PC-{i:02d}", "pc", f"PC-{i:02d}"))
        
        # Initialize Book resources - ONLY 50 Books total
        for i in range(1, 51):
            resources.append(Resource(f"Book-{i:03d}", "book", f"Book-{i:03d}"))
            
        # Initialize Seat resources - ONLY 30 Seats total
        for i in range(1, 31):
            resources.append(Resource(f"Seat-{i:03d}", "seat", f"Seat-{i:03d}"))
            
        return resources
        
    def add_student_request(self, name, student_id, resource_type, priority=2, required_time=30):
        student = Student(name, student_id, priority, required_time)
        
        # Check if resource is available
        available_resource = self.find_available_resource(resource_type)
        
        if available_resource:
            # Allocate directly if resource available
            available_resource.allocate(student, required_time)
            self.allocations.add_allocation(student, available_resource)
            return {"status": "allocated", "resource": available_resource, "student": student}
        else:
            # No resources available - check for preemption
            preempted = self.check_and_preempt(student, resource_type)
            if preempted:
                # Preemption happened, now allocate to the freed resource
                available_resource = self.find_available_resource(resource_type)
                if available_resource:
                    available_resource.allocate(student, required_time)
                    self.allocations.add_allocation(student, available_resource)
                    return {"status": "allocated", "resource": available_resource, "student": student}
            
            # If no preemption or still no resources, add to queue
            self.queues[resource_type].add_student(student)
            return {"status": "queued", "queue_type": resource_type, "student": student}
            
    def check_and_preempt(self, new_student, resource_type):
        # Find the lowest priority allocated resource that can be preempted
        lowest_priority_resource = None
        lowest_priority = 6  # Start with highest number (lowest priority)
        
        for resource in self.resources:
            if (resource.resource_type == resource_type and 
                resource.status == "allocated" and 
                resource.allocated_to and 
                resource.allocated_to.priority < lowest_priority and
                resource.allocated_to.priority < new_student.priority):  # Only preempt if new student has higher priority
                
                lowest_priority = resource.allocated_to.priority
                lowest_priority_resource = resource
        
        # Preempt the lowest priority resource
        if lowest_priority_resource:
            preempted_student = lowest_priority_resource.allocated_to
            lowest_priority_resource.deallocate()
            self.allocations.remove_allocation(preempted_student, lowest_priority_resource)
            self.queues[resource_type].add_student(preempted_student)
            self.preemption_count += 1
            print(f"🚨 PREEMPTION: {new_student.name} (P{new_student.priority}) preempted {preempted_student.name} (P{preempted_student.priority})")
            return True
        return False
                
    def find_available_resource(self, resource_type):
        for resource in self.resources:
            if resource.resource_type == resource_type and resource.status == "available":
                return resource
        return None
        
    def deallocate_resource(self, resource_id):
        for resource in self.resources:
            if resource.resource_id == resource_id and resource.status == "allocated":
                student = resource.allocated_to
                resource.deallocate()
                self.allocations.remove_allocation(student, resource)
                self.allocate_from_queue(resource.resource_type)
                return True
        return False
        
    def allocate_from_queue(self, resource_type):
        queue = self.queues[resource_type]
        available_resource = self.find_available_resource(resource_type)
        
        # Allocate to next student in queue if resource available
        if available_resource and queue.get_queue_length() > 0:
            next_student = queue.get_next_student()
            if next_student:
                queue.remove_student(next_student)
                available_resource.allocate(next_student, next_student.required_time)
                self.allocations.add_allocation(next_student, available_resource)
                print(f"✅ AUTO-ALLOCATED from queue: {next_student.name} to {available_resource.name}")
                
    def get_dashboard_data(self):
        # Count allocated resources by type
        allocated_pc = len([r for r in self.resources if r.resource_type == 'pc' and r.status == 'allocated'])
        allocated_book = len([r for r in self.resources if r.resource_type == 'book' and r.status == 'allocated'])
        allocated_seat = len([r for r in self.resources if r.resource_type == 'seat' and r.status == 'allocated'])
        
        # Count available resources by type
        available_pc = len([r for r in self.resources if r.resource_type == 'pc' and r.status == 'available'])
        available_book = len([r for r in self.resources if r.resource_type == 'book' and r.status == 'available'])
        available_seat = len([r for r in self.resources if r.resource_type == 'seat' and r.status == 'available'])
        
        # Verify totals (should match our initialization)
        total_pc = allocated_pc + available_pc  # Should be 10
        total_book = allocated_book + available_book  # Should be 50  
        total_seat = allocated_seat + available_seat  # Should be 30
        
        print(f"🔍 RESOURCE CHECK: PC={allocated_pc} allocated + {available_pc} available = {total_pc} total")
        print(f"🔍 RESOURCE CHECK: Book={allocated_book} allocated + {available_book} available = {total_book} total")
        print(f"🔍 RESOURCE CHECK: Seat={allocated_seat} allocated + {available_seat} available = {total_seat} total")
        
        queue_counts = {q_type: queue.get_queue_length() for q_type, queue in self.queues.items()}
        total_allocated = allocated_pc + allocated_book + allocated_seat
        
        return {
            'total_allocated': total_allocated,
            'available_resources': {
                'pc': available_pc,
                'book': available_book,
                'seat': available_seat
            },
            'allocated_resources': {
                'pc': allocated_pc,
                'book': allocated_book,
                'seat': allocated_seat
            },
            'queue_counts': queue_counts,
            'preemption_count': self.preemption_count,
            'total_students': total_allocated + sum(queue_counts.values())
        }
        
    def get_resource_allocation_data(self):
        allocated_resources = []
        for resource in self.resources:
            if resource.status == "allocated" and resource.allocated_to:
                allocated_resources.append({
                    'resource_id': resource.resource_id,
                    'resource_type': resource.resource_type,
                    'resource_name': resource.name,
                    'student_name': resource.allocated_to.name,
                    'student_id': resource.allocated_to.student_id,
                    'priority': resource.allocated_to.priority,
                    'time_required': resource.allocated_to.required_time,
                    'remaining_time': resource.remaining_time,
                    'status': 'ALLOCATED'
                })
        return allocated_resources
        
    def get_queue_data(self):
        queue_data = {}
        for q_type, queue in self.queues.items():
            queue_data[q_type] = {
                'queue_type': q_type,
                'students': [],
                'length': queue.get_queue_length()
            }
            for i, student in enumerate(queue.students):
                from datetime import datetime
                wait_time = (datetime.now() - student.arrival_time).seconds // 60
                queue_data[q_type]['students'].append({
                    'position': i + 1,
                    'student_name': student.name,
                    'student_id': student.student_id,
                    'resource_type': q_type,
                    'priority': student.priority,
                    'arrival_time': student.arrival_time.strftime("%H:%M:%S"),
                    'wait_time': f"{wait_time}m"
                })
        return queue_data

# Initialize the process manager
process_manager = ProcessManager()

@app.route('/')
def home():
    return jsonify({"message": "Library Management System API", "status": "running"})

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    try:
        data = process_manager.get_dashboard_data()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/add-student', methods=['POST'])
def add_student():
    try:
        data = request.get_json()
        name = data.get('name')
        student_id = data.get('student_id')
        resource_type = data.get('resource_type')
        priority = data.get('priority', 2)
        required_time = data.get('required_time', 30)
        
        if not all([name, student_id, resource_type]):
            return jsonify({"success": False, "error": "Missing required fields"})
            
        result = process_manager.add_student_request(
            name, student_id, resource_type, priority, required_time
        )
        
        # Convert Student and Resource objects to dictionaries for JSON serialization
        serialized_result = {
            "status": result["status"],
            "queue_type": result.get("queue_type")
        }
        
        # Convert Student object to dict if present
        if "student" in result:
            serialized_result["student"] = result["student"].to_dict()
            
        # Convert Resource object to dict if present  
        if "resource" in result:
            serialized_result["resource"] = result["resource"].to_dict()
        
        return jsonify({
            "success": True, 
            "message": f"Student {result['status']}",
            "data": serialized_result  # ← FIXED: Now using serialized data
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/allocations', methods=['GET'])
def get_allocations():
    try:
        data = process_manager.get_resource_allocation_data()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/queues', methods=['GET'])
def get_queues():
    try:
        data = process_manager.get_queue_data()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/deallocate/<resource_id>', methods=['POST'])
def deallocate_resource(resource_id):
    try:
        success = process_manager.deallocate_resource(resource_id)
        if success:
            return jsonify({"success": True, "message": "Resource deallocated successfully"})
        else:
            return jsonify({"success": False, "error": "Resource not found or not allocated"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/allocate-next', methods=['POST'])
def allocate_next():
    try:
        data = request.get_json()
        resource_type = data.get('resource_type')
        
        if not resource_type:
            return jsonify({"success": False, "error": "Resource type required"})
            
        # This will trigger allocation from queue
        process_manager.allocate_from_queue(resource_type)
        
        return jsonify({"success": True, "message": "Allocation process triggered"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

def initialize_sample_data():
    """Initialize sample students to demonstrate the queue system"""
    sample_students = [
        # First batch - should get allocated immediately to PCs
        {"name": "Alice Sharma", "student_id": "1001", "resource_type": "pc", "priority": 2, "required_time": 45},
        {"name": "Bob Singh", "student_id": "1002", "resource_type": "pc", "priority": 2, "required_time": 30},
        {"name": "Charlie Kumar", "student_id": "1003", "resource_type": "pc", "priority": 2, "required_time": 60},
        {"name": "Diana Patel", "student_id": "1004", "resource_type": "pc", "priority": 2, "required_time": 30},
        {"name": "Eva Verma", "student_id": "1005", "resource_type": "pc", "priority": 2, "required_time": 25},
        {"name": "Frank Joshi", "student_id": "1006", "resource_type": "pc", "priority": 2, "required_time": 90},
        {"name": "Grace Reddy", "student_id": "1007", "resource_type": "pc", "priority": 2, "required_time": 50},
        {"name": "Henry Malhotra", "student_id": "1008", "resource_type": "pc", "priority": 2, "required_time": 40},
        {"name": "Isha Gupta", "student_id": "1009", "resource_type": "pc", "priority": 2, "required_time": 35},
        
        # These should go to PC queue (only 10 PCs total, first 9 got allocated)
        {"name": "Jack Choudhary", "student_id": "1010", "resource_type": "pc", "priority": 2, "required_time": 20},
        {"name": "Kiran Mehta", "student_id": "1011", "resource_type": "pc", "priority": 2, "required_time": 75},
        
        # Book requests - should get allocated (50 books available)
        {"name": "Lina Nair", "student_id": "1012", "resource_type": "book", "priority": 2, "required_time": 55},
        {"name": "Mohan Das", "student_id": "1013", "resource_type": "book", "priority": 2, "required_time": 30},
        {"name": "Neha Kapoor", "student_id": "1014", "resource_type": "book", "priority": 3, "required_time": 25},
        
        # Seat requests - should get allocated (30 seats available)  
        {"name": "Om Prakash", "student_id": "1015", "resource_type": "seat", "priority": 2, "required_time": 60},
        {"name": "Priya Singh", "student_id": "1016", "resource_type": "seat", "priority": 1, "required_time": 90},
    ]
    
    print("🚀 Initializing sample data...")
    for student_data in sample_students:
        try:
            result = process_manager.add_student_request(
                student_data["name"],
                student_data["student_id"],
                student_data["resource_type"],
                student_data["priority"],
                student_data["required_time"]
            )
            status = result["status"]
            if status == "allocated":
                resource_info = f" to {result['resource'].name}"
            else:
                resource_info = f" (waiting for {student_data['resource_type']})"
            print(f"✅ Added {student_data['name']} - {status}{resource_info}")
        except Exception as e:
            print(f"❌ Error adding {student_data['name']}: {e}")

@app.route('/api/initialize-data', methods=['POST'])
def initialize_data():
    """Initialize sample data for demonstration"""
    try:
        initialize_sample_data()
        return jsonify({"success": True, "message": "Sample data initialized successfully"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/reset-data', methods=['POST'])
def reset_data():
    """Reset all data (deallocate everything)"""
    try:
        global process_manager
        process_manager = ProcessManager()  # Create new instance to reset everything
        initialize_sample_data()  # Add sample data again
        return jsonify({"success": True, "message": "Data reset successfully"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

# Initialize sample data when the server starts
print("🎯 Starting Library Management System...")
initialize_sample_data()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
