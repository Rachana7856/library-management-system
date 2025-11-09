from datetime import datetime, timedelta
from ..models.student import Student
from ..models.resource import Resource
from ..models.queue import Queue
from ..models.allocation import Allocation

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
        # Initialize PC resources
        for i in range(1, 11):
            resources.append(Resource(f"PC-{i:02d}", "pc", f"PC-{i:02d}"))
        
        # Initialize Book resources
        for i in range(1, 51):
            resources.append(Resource(f"Book-{i:03d}", "book", f"Book-{i:03d}"))
            
        # Initialize Seat resources
        for i in range(1, 31):
            resources.append(Resource(f"Seat-{i:03d}", "seat", f"Seat-{i:03d}"))
            
        return resources
        
    def add_student_request(self, name, student_id, resource_type, priority=2, required_time=30):
        student = Student(name, student_id, priority, required_time)
        
        # Check if resource is available
        available_resource = self.find_available_resource(resource_type)
        
        if available_resource:
            # Check for preemption (if higher priority student)
            self.check_and_preempt(student, resource_type, available_resource)
            available_resource.allocate(student, required_time)
            self.allocations.add_allocation(student, available_resource)
            return {"status": "allocated", "resource": available_resource, "student": student}
        else:
            # Add to appropriate queue
            self.queues[resource_type].add_student(student)
            return {"status": "queued", "queue_type": resource_type, "student": student}
            
    def check_and_preempt(self, new_student, resource_type, available_resource):
        # Check if any allocated resource has lower priority student
        for resource in self.resources:
            if (resource.resource_type == resource_type and 
                resource.status == "allocated" and 
                resource.allocated_to and 
                resource.allocated_to.priority > new_student.priority):
                
                # Preempt the lower priority student
                preempted_student = resource.allocated_to
                resource.deallocate()
                self.allocations.remove_allocation(preempted_student, resource)
                
                # Add preempted student back to queue
                self.queues[resource_type].add_student(preempted_student)
                self.preemption_count += 1
                break
                
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
                
                # Allocate to next student in queue
                self.allocate_from_queue(resource.resource_type)
                return True
        return False
        
    def allocate_from_queue(self, resource_type):
        queue = self.queues[resource_type]
        available_resource = self.find_available_resource(resource_type)
        
        if available_resource and queue.get_queue_length() > 0:
            next_student = queue.get_next_student()
            if next_student:
                queue.remove_student(next_student)
                available_resource.allocate(next_student, next_student.required_time)
                self.allocations.add_allocation(next_student, available_resource)
                
    def get_dashboard_data(self):
        allocated_count = len(self.allocations.get_allocations())
        queue_counts = {q_type: queue.get_queue_length() for q_type, queue in self.queues.items()}
        
        available_counts = {
            'pc': len([r for r in self.resources if r.resource_type == 'pc' and r.status == 'available']),
            'book': len([r for r in self.resources if r.resource_type == 'book' and r.status == 'available']),
            'seat': len([r for r in self.resources if r.resource_type == 'seat' and r.status == 'available'])
        }
        
        return {
            'total_allocated': allocated_count,
            'available_resources': available_counts,
            'queue_counts': queue_counts,
            'preemption_count': self.preemption_count,
            'total_students': allocated_count + sum(queue_counts.values())
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
                    'allocation_time': resource.allocation_time.isoformat() if resource.allocation_time else None
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
                wait_time = (datetime.now() - student.arrival_time).seconds // 60
                queue_data[q_type]['students'].append({
                    'position': i + 1,
                    'student_name': student.name,
                    'student_id': student.student_id,
                    'resource_type': q_type,
                    'priority': student.priority,
                    'arrival_time': student.arrival_time.isoformat(),
                    'wait_time': wait_time
                })
        return queue_data

