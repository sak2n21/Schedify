import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import Sidebar from "../components/Sidebar";

const ManageSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    priority: "",
    reminder: false,
    date: "",
  });

  const schedulesRef = collection(db, "schedules");

  // 📌 Fetch schedules in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(schedulesRef, (snapshot) => {
      setSchedules(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  const handleDateClick = (arg) => {
    setFormData({
      title: "",
      category: "",
      priority: "",
      reminder: false,
      date: arg.dateStr,
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleReminderChange = (e) => {
    setFormData({ ...formData, reminder: e.target.value === "true" });
  };

  // 📌 Add a new schedule with confirmation
  const addSchedule = async () => {
    if (!formData.title || !formData.category || !formData.priority || !formData.date) {
      alert("Please fill in all fields");
      return;
    }
    if (window.confirm("Are you sure you want to add this schedule?")) {
      try {
        const newSchedule = { ...formData, reminder: formData.reminder === true };
        const docRef = await addDoc(schedulesRef, newSchedule);
        setSchedules([...schedules, { id: docRef.id, ...newSchedule }]);
        setModalOpen(false);
        alert("Schedule added successfully!");
      } catch (error) {
        console.error("Error adding schedule:", error);
      }
    }
  };

  // 📌 Delete a schedule with confirmation
  const deleteSchedule = async (id) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      try {
        await deleteDoc(doc(db, "schedules", id));
        setSchedules(schedules.filter((schedule) => schedule.id !== id));
        alert("Schedule deleted successfully!");
      } catch (error) {
        console.error("Error deleting schedule:", error);
      }
    }
  };

  return (
    <div>
      <Sidebar />
      <div style={styles.container}>
        <h2>View & Add Schedule</h2>
        <button onClick={() => setModalOpen(true)} style={styles.addButton}>
          + Add Schedule
        </button>

        {/* Wrapper div for the calendar */}
        <div style={styles.calendarContainer}>
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            dateClick={handleDateClick}
            events={schedules.map((s) => ({
              title: s.title,
              date: s.date,
              id: s.id,
            }))}
            contentHeight="auto" // Adjust height
            aspectRatio={1.5} // Adjust aspect ratio (width/height)
          />
        </div>

        {modalOpen && (
          <>
            <div style={styles.overlay} onClick={() => setModalOpen(false)}></div>
            <div style={styles.modal}>
              <h3>Add Schedule</h3>
              <input
                type="text"
                name="title"
                placeholder="Enter Title"
                value={formData.title || ""}
                onChange={handleChange}
                style={{ ...styles.input, width: "85%" }}
              />
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
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
                value={formData.priority}
                onChange={handleChange}
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
                value={formData.reminder.toString()}
                onChange={handleReminderChange}
                style={styles.input}
              >
                <option value="false">Reminder Off</option>
                <option value="true">Reminder On</option>
              </select>
              <input
                type="date"
                name="date"
                value={formData.date || ""}
                onChange={handleChange}
                style={{ ...styles.input, width: "85%" }}
              />
              <div style={styles.buttonContainer}>
                <button onClick={addSchedule} style={styles.button}>
                  Save
                </button>
                <button onClick={() => setModalOpen(false)} style={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// 📌 Styles
const styles = {
  container: {
    marginLeft: "250px",
    padding: "20px",
    maxWidth: "1200px", // Limit container width
    margin: "0 auto", // Center the container
  },
  calendarContainer: {
    // width: "100%", // Adjust calendar width
    // margin: "0 auto", // Center the calendar
  },
  addButton: {
    padding: "10px",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginBottom: "10px",
  },
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

export default ManageSchedule;