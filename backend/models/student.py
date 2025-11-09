from datetime import datetime

class Student:
    def __init__(self, name, student_id, priority=2, required_time=30):
        self.name = name
        self.student_id = student_id
        self.priority = priority
        self.required_time = required_time
        self.arrival_time = datetime.now()
        self.status = "waiting"
        
    def to_dict(self):
        return {
            'name': self.name,
            'student_id': self.student_id,
            'priority': self.priority,
            'required_time': self.required_time,
            'arrival_time': self.arrival_time.isoformat(),
            'status': self.status
        }