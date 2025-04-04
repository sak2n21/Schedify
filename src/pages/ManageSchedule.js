import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import Sidebar from "../components/Sidebar";

const ManageSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [currentView, setCurrentView] = useState("calendar");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    priority: "",
    reminder: false,
    date: "",
    time: "",
  });

  const schedulesRef = collection(db, "schedules");

  useEffect(() => {
    const unsubscribe = onSnapshot(schedulesRef, (snapshot) => {
      setSchedules(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const filteredSchedules = schedules.filter((schedule) => {
    const categoryMatch =
      filterCategory === "all" || schedule.category === filterCategory;
    const priorityMatch =
      filterPriority === "all" || schedule.priority === filterPriority;
    return categoryMatch && priorityMatch;
  });

  const handleDateClick = (arg) => {
    resetForm();
    setFormData({
      ...formData,
      date: arg.dateStr,
    });
    setModalOpen(true);
  };

  const handleEventClick = (arg) => {
    const schedule = schedules.find((s) => s.id === arg.event.id);
    if (schedule) {
      setSelectedSchedule(schedule);
      setFormData({
        title: schedule.title || "",
        category: schedule.category || "",
        priority: schedule.priority || "",
        reminder: schedule.reminder || false,
        date: schedule.date || "",
        time: schedule.time || "",
      });
      setModalOpen(true);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      priority: "",
      reminder: false,
      date: "",
    });
    setSelectedSchedule(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleReminderChange = (e) => {
    setFormData({ ...formData, reminder: e.target.checked });
  };

  const addOrUpdateSchedule = async () => {
    if (
      !formData.title ||
      !formData.category ||
      !formData.priority ||
      !formData.date ||
      !formData.time
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const scheduleData = {
        title: formData.title,
        category: formData.category,
        priority: formData.priority,
        reminder: formData.reminder,
        date: formData.date,
        time: formData.time,
      };

      if (selectedSchedule) {
        // Update existing schedule
        await updateDoc(
          doc(db, "schedules", selectedSchedule.id),
          scheduleData
        );
        alert("Schedule updated successfully!");
      } else {
        // Add new schedule
        await addDoc(schedulesRef, scheduleData);
        alert("Schedule added successfully!");
      }

      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert("There was an error saving your schedule. Please try again.");
    }
  };

  const deleteSchedule = async () => {
    if (!selectedSchedule) return;

    if (window.confirm("Are you sure you want to delete this schedule?")) {
      try {
        await deleteDoc(doc(db, "schedules", selectedSchedule.id));
        alert("Schedule deleted successfully!");
        setModalOpen(false);
        resetForm();
      } catch (error) {
        console.error("Error deleting schedule:", error);
        alert("There was an error deleting your schedule. Please try again.");
      }
    }
  };

  const getEventColor = (priority) => {
    switch (priority) {
      case "high":
        return "#ef4455"; // Red-500
      case "medium":
        return "#f59e0b"; // Amber-500
      case "low":
        return "#10b981"; // Emerald-500
      default:
        return "#3b82f6"; // Blue-500
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Simplified layout view options (only calendar, board and all tasks)
  const viewOptions = [
    { name: "Calendar", value: "calendar", icon: "📅" },
    { name: "Board", value: "board", icon: "📋" },
    { name: "All Tasks", value: "allTasks", icon: "📝" },
  ];

  const themeClass = darkMode ? "dark-theme" : "light-theme";

  // Group schedules by priority for Board view
  const schedulesByPriority = {
    high: filteredSchedules.filter((s) => s.priority === "high"),
    medium: filteredSchedules.filter((s) => s.priority === "medium"),
    low: filteredSchedules.filter((s) => s.priority === "low"),
  };

  return (
    <div
      style={
        darkMode
          ? { ...styles.manageSchedule, ...styles.darkMode }
          : styles.manageSchedule
      }
      className={themeClass}
    >
      <Sidebar />
      <div style={styles.content}>
        <div style={styles.header}>
          <h2 style={styles.title}>Schedule Manager</h2>
          <div style={styles.controls}>
            <button onClick={toggleDarkMode} style={styles.iconButton}>
              {darkMode ? "🌞" : "🌙"}
            </button>
            <button onClick={() => setModalOpen(true)} style={styles.addButton}>
              + New
            </button>
          </div>
        </div>

        <div style={styles.toolbar}>
          <div style={styles.viewSelector}>
            {viewOptions.map((view) => (
              <button
                key={view.value}
                onClick={() => setCurrentView(view.value)}
                style={{
                  ...styles.viewButton,
                  ...(currentView === view.value
                    ? styles.activeViewButton
                    : {}),
                }}
              >
                <span style={styles.viewIcon}>{view.icon}</span>
                <span>{view.name}</span>
              </button>
            ))}
          </div>
          <div style={styles.filters}>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Categories</option>
              <option value="deadlines">Deadlines</option>
              <option value="appointments">Appointments</option>
              <option value="events">Events</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Calendar View with navigation buttons */}
        {currentView === "calendar" && (
          <div style={styles.calendarContainer}>
            <FullCalendar
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                listPlugin,
                interactionPlugin,
              ]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
              }}
              views={{
                dayGrid: {
                  dayMaxEventRows: 3,
                  displayEventTime: false, // Hide time in month view
                },
                timeGridWeek: {
                  eventTimeFormat: {
                    hour: "2-digit",
                    minute: "2-digit",
                    meridiem: "short",
                  },
                },
                timeGridDay: {
                  eventTimeFormat: {
                    hour: "2-digit",
                    minute: "2-digit",
                    meridiem: "short",
                  },
                },
              }}
              height="auto"
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              events={filteredSchedules.map((s) => ({
                title: s.title,
                date: s.date,
                id: s.id,
                start: `${s.date}T${s.time}`,
                backgroundColor: getEventColor(s.priority),
                borderColor: getEventColor(s.priority),
                textColor: "#ffffff",
                extendedProps: {
                  category: s.category,
                  priority: s.priority,
                  reminder: s.reminder,
                  time: s.time,
                },
              }))}
              eventContent={(arg) => (
                <div
                  style={{
                    width:"100%",
                    backgroundColor: arg.event.backgroundColor, // Ensure color is set
                    padding: "5px",
                    borderRadius: "4px",
                    color: "#ffffff",
                  }}
                >
                  <div style={styles.eventTitle}>{arg.event.title}</div>
                  <div style={styles.eventCategory}>
                    {arg.event.extendedProps.category}
                  </div>
                </div>
              )}
            />
          </div>
        )}

        {/* Board View */}
        {currentView === "board" && (
          <div style={styles.boardContainer}>
            <div style={styles.kanbanBoard}>
              {Object.keys(schedulesByPriority).map((priority) => (
                <div key={priority} style={styles.kanbanColumn}>
                  <div
                    style={{
                      ...styles.kanbanColumnHeader,
                      backgroundColor: `${getEventColor(priority)}22`,
                      borderBottom: `2px solid ${getEventColor(priority)}`,
                    }}
                  >
                    <h3 style={styles.kanbanColumnTitle}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}{" "}
                      Priority
                    </h3>
                    <span style={styles.kanbanColumnCount}>
                      {schedulesByPriority[priority].length}
                    </span>
                  </div>
                  <div style={styles.kanbanCards}>
                    {schedulesByPriority[priority].map((schedule) => (
                      <div
                        key={schedule.id}
                        style={styles.boardCard}
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setFormData({
                            title: schedule.title || "",
                            category: schedule.category || "",
                            priority: schedule.priority || "",
                            reminder: schedule.reminder || false,
                            date: schedule.date || "",
                          });
                          setModalOpen(true);
                        }}
                      >
                        <div style={styles.boardCardTitle}>
                          {schedule.title}
                        </div>
                        <div style={styles.boardCardCategory}>
                          {schedule.category}
                        </div>
                        <div style={styles.boardCardFooter}>
                          <div style={styles.boardCardDate}>
                            {new Date(schedule.date).toLocaleDateString()}
                          </div>
                          {schedule.reminder && (
                            <div style={styles.reminderBadgeSmall}>🔔</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Tasks View */}
        {currentView === "allTasks" && (
          <div style={styles.listView}>
            <h3 style={styles.listTitle}>All Schedules</h3>
            <div style={styles.listContainer}>
              {filteredSchedules
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((schedule) => (
                  <div
                    key={schedule.id}
                    style={{
                      ...styles.scheduleItem,
                      borderLeft: `4px solid ${getEventColor(
                        schedule.priority
                      )}`,
                    }}
                    onClick={() => {
                      setSelectedSchedule(schedule);
                      setFormData({
                        title: schedule.title || "",
                        category: schedule.category || "",
                        priority: schedule.priority || "",
                        reminder: schedule.reminder || false,
                        date: schedule.date || "",
                      });
                      setModalOpen(true);
                    }}
                  >
                    <div style={styles.scheduleItemHeader}>
                      <div style={styles.scheduleTitle}>{schedule.title}</div>
                      <div style={styles.scheduleDate}>
                        {new Date(schedule.date).toLocaleDateString()}
                        {schedule.time}
                      </div>
                    </div>
                    <div style={styles.scheduleItemDetail}>
                      <div style={styles.scheduleCategory}>
                        {schedule.category}
                      </div>
                      <div
                        style={{
                          ...styles.schedulePriority,
                          backgroundColor: getEventColor(schedule.priority),
                        }}
                      >
                        {schedule.priority}
                      </div>
                      {schedule.reminder && (
                        <div style={styles.reminderBadge}>🔔 Reminder</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Edit/Add Schedule Modal */}
        {modalOpen && (
          <>
            <div
              style={styles.overlay}
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            ></div>
            <div
              style={
                darkMode
                  ? { ...styles.modal, ...styles.darkModeModal }
                  : styles.modal
              }
            >
              <h3 style={styles.modalTitle}>
                {selectedSchedule ? "Edit Schedule" : "Add Schedule"}
              </h3>
              <div style={styles.modalContent}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Title*</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Enter Title"
                    value={formData.title}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Category*</label>
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
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Priority*</label>
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
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Date*</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <div style={styles.checkboxGroup}>
                      <input
                        type="checkbox"
                        name="reminder"
                        checked={formData.reminder}
                        onChange={handleReminderChange}
                        id="reminder-checkbox"
                        style={styles.checkboxInput}
                      />
                      <label
                        htmlFor="reminder-checkbox"
                        style={styles.checkboxLabel}
                      >
                        Set Reminder
                      </label>
                    </div>
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Time*</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.modalFooter}>
                  {selectedSchedule && (
                    <button
                      onClick={deleteSchedule}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  )}
                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => {
                        setModalOpen(false);
                        resetForm();
                      }}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addOrUpdateSchedule}
                      style={styles.saveButton}
                    >
                      {selectedSchedule ? "Update" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  manageSchedule: {
    display: "flex",
    height: "100vh",
    fontFamily:
      "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#333",
    backgroundColor: "#f9fafb",
    transition: "all 0.3s ease",
  },
  darkMode: {
    backgroundColor: "#111827",
    color: "#e5e7eb",
  },
  darkModeModal: {
    backgroundColor: "#1f2937",
    color: "#e5e7eb",
  },
  content: {
    marginLeft: "260px",
    padding: "20px 40px",
    flexGrow: 1,
    overflow: "auto",
    transition: "all 0.3s ease",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e2e8f0",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    margin: 0,
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  viewSelector: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  viewButton: {
    padding: "8px 12px",
    backgroundColor: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  viewIcon: {
    fontSize: "16px",
  },
  activeViewButton: {
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
    fontWeight: "500",
  },
  filters: {
    display: "flex",
    gap: "12px",
  },
  filterSelect: {
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "transparent",
  },
  controls: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  iconButton: {
    padding: "8px 12px",
    backgroundColor: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
  },
  addButton: {
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "background-color 0.2s ease",
  },
  calendarContainer: {
    marginTop: "20px",
    padding: "24px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  eventContent: {
    padding: "2px 4px",
  },
  eventTitle: {
    fontWeight: "500",
    fontSize: "14px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  eventCategory: {
    fontSize: "12px",
    opacity: 0.7,
  },
  listView: {
    marginTop: "30px",
  },
  listTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "16px",
  },
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  scheduleItem: {
    padding: "12px 16px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    borderLeft: "4px solid #3b82f6",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  scheduleItemHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  scheduleTitle: {
    fontWeight: "500",
    flexGrow: 1,
  },
  scheduleDate: {
    fontSize: "14px",
    color: "#64748b",
  },
  scheduleItemDetail: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  scheduleCategory: {
    fontSize: "14px",
    backgroundColor: "#f1f5f9",
    padding: "2px 8px",
    borderRadius: "4px",
  },
  schedulePriority: {
    fontSize: "12px",
    padding: "2px 8px",
    borderRadius: "4px",
    color: "white",
    textTransform: "capitalize",
  },
  reminderBadge: {
    fontSize: "12px",
    padding: "2px 8px",
    backgroundColor: "#f8fafc",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  reminderBadgeSmall: {
    fontSize: "14px",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 100,
  },
  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    borderRadius: "12px",
    maxWidth: "600px",
    width: "90%",
    zIndex: 101,
    overflow: "hidden",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    padding: "16px 24px",
    borderBottom: "1px solid #e2e8f0",
    margin: 0,
  },
  modalContent: {
    padding: "24px",
  },
  inputGroup: {
    marginBottom: "16px",
    width: "100%",
  },
  formRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "14px",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "14px",
  },
  checkboxGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "24px",
  },
  checkboxInput: {
    width: "16px",
    height: "16px",
  },
  checkboxLabel: {
    fontSize: "14px",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "24px",
  },
  actionButtons: {
    display: "flex",
    gap: "12px",
  },
  cancelButton: {
    padding: "8px 16px",
    backgroundColor: "#f1f5f9",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  },
  saveButton: {
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  },
  deleteButton: {
    padding: "8px 16px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  },
  boardContainer: {
    marginTop: "20px",
  },
  kanbanBoard: {
    display: "flex",
    gap: "24px",
    overflowX: "auto",
    paddingBottom: "16px",
  },
  kanbanColumn: {
    minWidth: "300px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
    maxHeight: "calc(100vh - 240px)",
  },
  kanbanColumnHeader: {
    padding: "12px 16px",
    borderTopLeftRadius: "12px",
    borderTopRightRadius: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kanbanColumnTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
  },
  kanbanColumnCount: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: "12px",
    padding: "2px 8px",
    fontSize: "12px",
    fontWeight: "500",
  },
  kanbanCards: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflowY: "auto",
    flexGrow: 1,
  },
  boardCard: {
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  boardCardTitle: {
    fontWeight: "500",
    fontSize: "14px",
  },
  boardCardCategory: {
    fontSize: "12px",
    backgroundColor: "#f1f5f9",
    padding: "2px 8px",
    borderRadius: "4px",
    display: "inline-block",
  },
  boardCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "4px",
  },
  boardCardDate: {
    fontSize: "12px",
    color: "#64748b",
  },
  priorityBadge: {
    fontSize: "12px",
    padding: "2px 8px",
    borderRadius: "4px",
    color: "white",
    textTransform: "capitalize",
  },
};

export default ManageSchedule;
