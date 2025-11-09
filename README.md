# 📚 Library Management System: Resource Allocation using OS Concepts

This project simulates a **Library Management System** where resource allocation (PCs, Seats, Books) is governed by **Operating System CPU Scheduling principles**.  
It demonstrates how OS-level scheduling algorithms can be applied to real-world systems like libraries for efficient and fair resource management.

---

## 🧠 Concept Overview

The system is modeled around **Process Scheduling**, where:
- Each **Student** acts as a process requesting resources.
- Each **Resource** (PC, Book, Seat) represents a critical shared entity.
- The system schedules and allocates these resources based on OS principles.

---

## 🚀 Key OS Concepts Demonstrated

| Concept | Implementation |
|----------|----------------|
| 🧍‍♀️ **Process** | A student requesting a resource (`Student` object) |
| 📘 **Critical Resource** | The PCs, Books, and Seats (`Resource` object) |
| ⏱️ **Scheduling Policy** | **Preemptive Priority Scheduling** with **FCFS** as a tie-breaker |
| 🔁 **Preemption** | A higher-priority student can interrupt and acquire a resource |
| 🧾 **Ready Queue** | Students wait in a prioritized queue for resource availability |

---

## ⚙️ Technologies Used
- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Python (Flask Framework)  
- **Core Logic:** Process & Resource Management Algorithms (OS Concepts)


