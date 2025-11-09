from datetime import datetime

class Resource:
    def __init__(self, resource_id, resource_type, name):
        self.resource_id = resource_id
        self.resource_type = resource_type
        self.name = name
        self.allocated_to = None
        self.allocation_time = None
        self.remaining_time = None
        self.status = "available"
        
    def allocate(self, student, required_time):
        self.allocated_to = student
        self.allocation_time = datetime.now()
        self.remaining_time = required_time
        self.status = "allocated"
        student.status = "allocated"
        
    def deallocate(self):
        if self.allocated_to:
            self.allocated_to.status = "completed"
        self.allocated_to = None
        self.allocation_time = None
        self.remaining_time = None
        self.status = "available"
        
    def to_dict(self):
        return {
            'resource_id': self.resource_id,
            'resource_type': self.resource_type,
            'name': self.name,
            'allocated_to': self.allocated_to.to_dict() if self.allocated_to else None,
            'status': self.status
        }