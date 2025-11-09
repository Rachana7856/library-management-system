class Allocation:
    def __init__(self):
        self.allocations = []
        self.preemption_count = 0
        
    def add_allocation(self, student, resource):
        allocation = {
            'student': student,
            'resource': resource,
            'allocation_time': resource.allocation_time,
        }
        self.allocations.append(allocation)
        
    def remove_allocation(self, student, resource):
        for alloc in self.allocations:
            if alloc['student'].student_id == student.student_id and alloc['resource'].resource_id == resource.resource_id:
                self.allocations.remove(alloc)
                break
                
    def get_allocations(self):
        return [alloc for alloc in self.allocations]