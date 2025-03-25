import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import Sidebar from "../components/Sidebar";

const ViewSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "schedules"));
        if (!querySnapshot.empty) {
          const fetchedSchedules = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setSchedules(fetchedSchedules);
        } else {
          console.log("No schedules found.");
        }
      } catch (error) {
        console.error("Error fetching schedules:", error);
      }
    };

    fetchSchedules();
  }, []);

  const filteredSchedules = schedules.filter(schedule => {
    return (
      (!categoryFilter || schedule.category === categoryFilter) &&
      (!priorityFilter || schedule.priority === priorityFilter)
    );
  });

  const handleEdit = (schedule) => {
    setEditFormData(schedule);
    setEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const saveEdit = async () => {
    if (!editFormData.id) {
      console.error("Invalid schedule ID");
      return;
    }
  
    try {
      const docRef = doc(db, "schedules", editFormData.id);
      await updateDoc(docRef, {
        title: editFormData.title,
        category: editFormData.category,
        priority: editFormData.priority,
        date: editFormData.date,
        reminder: editFormData.reminder,
      });
  
      // Update state immediately
      setSchedules(schedules.map(s => (s.id === editFormData.id ? { ...s, ...editFormData } : s)));
  
      setEditModalOpen(false);
      alert("Schedule updated successfully!");
    } catch (error) {
      console.error("Error updating schedule:", error);
    }
  };
  

  const deleteSchedule = async (id) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      try {
        await deleteDoc(doc(db, "schedules", id));
        setSchedules(schedules.filter(schedule => schedule.id !== id));
        alert("Schedule deleted successfully!");
      } catch (error) {
        console.error("Error deleting schedule:", error);
      }
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <h2>Manage Schedule</h2>
      
      <div style={styles.filterContainer}>
        <select onChange={(e) => setCategoryFilter(e.target.value)} value={categoryFilter} style={styles.select}>
          <option value="">All Categories</option>
          <option value="deadlines">Deadlines</option>
          <option value="appointments">Appointments</option>
          <option value="events">Events</option>
        </select>
        
        <select onChange={(e) => setPriorityFilter(e.target.value)} value={priorityFilter} style={styles.select}>
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Title</th>
            <th style={styles.th}>Category</th>
            <th style={styles.th}>Priority</th>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Reminder</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSchedules.map(schedule => (
            <tr key={schedule.id}>
              <td style={styles.td}>{schedule.title}</td>
              <td style={styles.td}>{schedule.category}</td>
              <td style={styles.td}>{schedule.priority}</td>
              <td style={styles.td}>{schedule.date}</td>
              <td style={styles.td}>{schedule.reminder ? "Yes" : "No"}</td>
              <td style={styles.td}>
                <button style={styles.editButton} onClick={() => handleEdit(schedule)}>Edit</button>
                <button style={styles.deleteButton} onClick={() => deleteSchedule(schedule.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editModalOpen && (
          <>
            <div style={styles.overlay} onClick={() => setEditModalOpen(false)}></div>
            <div style={styles.modal}>
              <h3>Edit Schedule</h3>
              <input
                type="text"
                name="title"
                placeholder="Enter Title"
                value={editFormData.title || ""}
                onChange={handleEditChange}
                style={{ ...styles.input, width: "85%" }}
              />
              <select
                name="category"
                value={editFormData.category}
                onChange={handleEditChange}
                style={styles.input}
              >
                <option value="" disabled>
                  Select Category
                </option>
                <option value="deadlines">Deadlines</option>
                <option value="appointments">Appointments</option>
                <option value="events">Events</option>
              </select>
              <select
                name="priority"
                value={editFormData.priority}
                onChange={handleEditChange}
                style={styles.input}
              >
                <option value="" disabled>
                  Select Priority
                </option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                name="reminder"
                value={editFormData.reminder.toString()}
                onChange={handleEditChange}
                style={styles.input}
              >
                <option value="false">Reminder Off</option>
                <option value="true">Reminder On</option>
              </select>
              <input
                type="date"
                name="date"
                value={editFormData.date || ""}
                onChange={handleEditChange}
                style={{ ...styles.input, width: "85%" }}
              />
              <div style={styles.buttonContainer}>
                <button onClick={saveEdit} style={styles.button}>
                  Save
                </button>
                <button onClick={() => setEditModalOpen(false)} style={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
    </div>
  );
};

const styles = {
  container: { padding: "20px", marginLeft: "250px" },
  filterContainer: { marginBottom: "15px" },
  select: { marginRight: "10px", padding: "5px", fontSize: "16px" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "10px" },
  th: { border: "1px solid #ddd", padding: "8px", background: "#f4f4f4" },
  td: { border: "1px solid #ddd", padding: "8px", textAlign: "center" },
  editButton: { background: "#28a745", color: "white", padding: "5px 10px", border: "none", borderRadius: "5px", marginRight: "5px", cursor: "pointer" },
  deleteButton: { background: "#dc3545", color: "white", padding: "5px 10px", border: "none", borderRadius: "5px", cursor: "pointer" },
  saveButton: { background: "#007bff", color: "white" },
  input: {
    padding: "10px",
    margin: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    width: "90%",
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "row",
    gap: "10px",
    padding: "10px",
    width: "90%",
  },
  button: {
    padding: "10px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    flex: 1,
  },
  cancelButton: {
    padding: "10px",
    background: "#FF5733",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    flex: 1,
  },
  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "white",
    padding: "25px",
    borderRadius: "10px",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    width: "30%",
    alignItems: "center",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },
};

export default ViewSchedule;
