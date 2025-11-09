from .process_manager import ProcessManager

class ResourceAllocator:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ResourceAllocator, cls).__new__(cls)
            cls._instance.process_manager = ProcessManager()
        return cls._instance
    
    def add_student_request(self, name, student_id, resource_type, priority=2, required_time=30):
        return self.process_manager.add_student_request(name, student_id, resource_type, priority, required_time)
    
    def deallocate_resource(self, resource_id):
        return self.process_manager.deallocate_resource(resource_id)
    
    def get_dashboard_data(self):
        return self.process_manager.get_dashboard_data()
    
    def get_resource_allocation_data(self):
        return self.process_manager.get_resource_allocation_data()
    
    def get_queue_data(self):
        return self.process_manager.get_queue_data()
    
    def get_all_resources(self):
        return [resource.to_dict() for resource in self.process_manager.resources]