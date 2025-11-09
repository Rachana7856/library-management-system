class Queue:
    def __init__(self, queue_type):
        self.queue_type = queue_type
        self.students = []
        
    def add_student(self, student):
        self.students.append(student)
        # Sorting by priority (highest first), then by arrival time (FCFS)
        self.students.sort(key=lambda x: (x.priority, x.arrival_time))
        
    def remove_student(self, student):
        if student in self.students:
            self.students.remove(student)
            
    def get_next_student(self):
        if self.students:
            # Returns the highest priority, then FCFS (due to initial sort)
            return self.students[0]
        return None
        
    def get_queue_length(self):
        return len(self.students)