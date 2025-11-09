import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_add_student():
    data = {
        "name": "Test Student",
        "student_id": "12345",
        "resource_type": "pc",
        "priority": 2,
        "required_time": 30
    }
    
    response = requests.post(f"{BASE_URL}/add-student", json=data)
    print("Add Student Response:", response.json())

def test_get_dashboard():
    response = requests.get(f"{BASE_URL}/dashboard")
    print("Dashboard Response:", response.json())

def test_get_allocations():
    response = requests.get(f"{BASE_URL}/allocations")
    print("Allocations Response:", response.json())

def test_get_queues():
    response = requests.get(f"{BASE_URL}/queues")
    print("Queues Response:", response.json())

if __name__ == "__main__":
    print("Testing Library Management System API...")
    
    test_add_student()
    test_get_dashboard()
    test_get_allocations()
    test_get_queues()