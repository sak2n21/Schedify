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
import { auth } from "../firebase";
import { query, where } from "firebase/firestore";
import emailjs from "@emailjs/browser";
// import { getAuth } from "firebase/auth";
// import axios from "axios";
import { trackRenderTime, trackDataLoading, trackUserInteraction } from '../utils/performance';
import { logUserAction, logError, logSystemEvent, LOG_SEVERITY } from '../utils/logging';
import { invalidateUserCache } from '../utils/scaling';
// import { getDocs } from 'firebase/firestore';
emailjs.init("wcwEuLp9fqmUlhoXd"); 

const ManageSchedule = () => {
  // State management
  const [schedules, setSchedules] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [currentView, setCurrentView] = useState("calendar");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    priority: "",
    reminder: false,
    date: "",
    scheduleTime: "",
    reminderTime: "",
    reminderDate: "",
  });

  // Firebase reference
  const schedulesRef = collection(db, "schedules");
  
  // const [, setSending] = useState(false);
  // const [, setError] = useState(null);

  // const sendReminder = async () => {
  //   const reminderPayload = {
  //     to: "kokshaoai@gmail.com",
  //     title: "testing 11",
  //     scheduleTime: "20:08",
  //     reminderTime: "18:20",
  //     date: "2025-04-10",
  //     category: "events",
  //     priority: "low",
  //     reminder: true,
  //   };

  //   setSending(true);
  //   setError(null);

  //   // Use a CORS proxy for development
  //   const corsProxy = "https://cors-anywhere.herokuapp.com/";
  //   const functionUrl =
  //     "https://us-central1-appointmentapplication-9c371.cloudfunctions.net/sendReminderNow";

  //   try {
  //     // Make the request through the CORS proxy
  //     const response = await axios.post(
  //       `${corsProxy}${functionUrl}`,
  //       reminderPayload,
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //           "X-Requested-With": "XMLHttpRequest", // Required by some CORS proxies
  //         },
  //         timeout: 10000,
  //       }
  //     );

  //     console.log("Response:", response.data);
  //     alert("Reminder sent successfully!");
  //   } catch (error) {
  //     console.error("Error sending reminder:", error);

  //     if (error.response) {
  //       setError(
  //         `Server error (${error.response.status}): ${
  //           error.response.data.message || JSON.stringify(error.response.data)
  //         }`
  //       );
  //     } else if (error.request) {
  //       setError(
  //         "No response from server. The Firebase function may be unavailable."
  //       );
  //     } else {
  //       setError(`Request setup error: ${error.message}`);
  //     }
  //   } finally {
  //     setSending(false);
  //   }
  // };

  useEffect(() => {
    if (auth.currentUser) {
      const userId = auth.currentUser.uid; // Ensure you're getting the correct UID
      const q = query(
        collection(db, "schedules"),
        where("userId", "==", userId)
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const schedulesData = [];
        querySnapshot.forEach((doc) => {
          schedulesData.push({ id: doc.id, ...doc.data() });
        });
        setSchedules(schedulesData);
      });

      return () => unsubscribe(); // Cleanup on unmount
    }
  }, [auth.currentUser]); // Make sure this re-runs when the user is authenticated

  // In your component, add this when dark mode is active
  useEffect(() => {
    if (isDarkMode) {
      // Apply dark mode styles to calendar elements
      const calendarElements = document.querySelectorAll(
        ".fc-col-header-cell-cushion, .fc-daygrid-day-number"
      );
      calendarElements.forEach((el) => {
        el.style.color = "#f3f4f6";
      });

      // Fix calendar backgrounds
      const headerCells = document.querySelectorAll(".fc-col-header-cell");
      headerCells.forEach((el) => {
        el.style.backgroundColor = "#374151";
      });
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (isDarkMode) {
      // Add a style element to invert input icons
      const style = document.createElement("style");
      style.textContent = `
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;

      trackDataLoading("schedules_load", async () => {
        try {
          const q = query(
            collection(db, "schedules"),
            where("userId", "==", userId)
          );

          logSystemEvent("Fetching schedules", "info", { userId });

          const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const schedulesData = [];
            querySnapshot.forEach((doc) => {
              schedulesData.push({ id: doc.id, ...doc.data() });
            });
            setSchedules(schedulesData);
            setLoading(false);

            logSystemEvent("Schedules loaded", "info", {
              count: schedulesData.length,
              userId,
            });
          });

          return () => unsubscribe();
        } catch (error) {
          setLoading(false);
          logError(error, { action: "fetch_schedules", userId });
        }
      });
    }
  }, [auth.currentUser]);

  // Filter schedules based on selected category and priority
  const filteredSchedules = schedules.filter((schedule) => {
    const matchesCategory =
      filterCategory === "all" || schedule.category === filterCategory;
    const matchesPriority =
      filterPriority === "all" || schedule.priority === filterPriority;
    return matchesCategory && matchesPriority;
  });

  // Group schedules by priority for board view
  const schedulesByPriority = {
    high: filteredSchedules.filter((s) => s.priority === "high"),
    medium: filteredSchedules.filter((s) => s.priority === "medium"),
    low: filteredSchedules.filter((s) => s.priority === "low"),
  };

  // View options for the schedule manager
  const viewOptions = [
    { name: "Calendar", value: "calendar", icon: "📅" },
    { name: "Board", value: "board", icon: "📋" },
    { name: "All Tasks", value: "allTasks", icon: "📝" },
  ];

  // Handle date click in calendar
  const handleDateClick = (calendarInfo) => {
    resetForm();
    setFormData({
      ...formData,
      date: calendarInfo.dateStr,
      reminderDate: calendarInfo.dateStr, // Set the reminder date same as schedule date by default
    });
    setIsModalOpen(true);
  };

  // Handle event click in calendar
  const handleEventClick = (eventInfo) => {
    const clickedSchedule = schedules.find((s) => s.id === eventInfo.event.id);

    if (clickedSchedule) {
      setSelectedSchedule(clickedSchedule);
      setFormData({
        title: clickedSchedule.title || "",
        category: clickedSchedule.category || "",
        priority: clickedSchedule.priority || "",
        reminder: clickedSchedule.reminder || false,
        date: clickedSchedule.date || "",
        scheduleTime: clickedSchedule.scheduleTime || "",
        reminderTime: clickedSchedule.reminderTime || "",
        reminderDate:
          clickedSchedule.reminderDate || clickedSchedule.date || "", // Use reminderDate if available, fallback to date
      });
      setIsModalOpen(true);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      priority: "",
      reminder: false,
      date: "",
      scheduleTime: "",
      reminderTime: "",
      reminderDate: "",
    });
    setSelectedSchedule(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle reminder checkbox change
  const handleReminderChange = (e) => {
    setFormData({
      ...formData,
      reminder: e.target.checked,
      // Set reminderDate to the same as the schedule date if it's empty and checkbox is checked
      reminderDate:
        e.target.checked && !formData.reminderDate
          ? formData.date
          : formData.reminderDate,
    });
  };

  const saveSchedule = async () => {
    const requiredFields = [
      "title",
      "category",
      "priority",
      "date",
      "scheduleTime",
    ];

    // Only require reminderTime if reminder is true
    if (formData.reminder) {
      requiredFields.push("reminderTime");
      requiredFields.push("reminderDate");
    }

    console.log("Form Data:", formData);
    const missingFields = requiredFields.filter(field => !formData[field]);
    const isMissingField = missingFields.length > 0;

    if (isMissingField) {
      // Now using the array of missing fields
      logSystemEvent(
        `Validation failed: Missing required fields: ${missingFields.join(', ')}`,
        LOG_SEVERITY.WARNING,
        { 
          action: "schedule_validation",
          missingFields, // Pass the array of missing fields
          formData
        }
      );
      alert("Please fill in all required fields");
      return;
    }

    return trackUserInteraction("save_schedule", async () => {
      try {
        const userId = auth.currentUser.uid; // Get the current user's UID

        const scheduleData = {
          title: formData.title,
          category: formData.category,
          priority: formData.priority,
          reminder: formData.reminder,
          date: formData.date,
          scheduleTime: formData.scheduleTime,
          reminderTime: formData.reminderTime, // Ensure reminderTime is included
          reminderDate: formData.reminderDate,
          userId: userId, // Add the user ID to the schedule
        };

        // Normalize a string for comparison
        const normalize = (str) => str.trim().toLowerCase();

        // Check for duplicate schedule (same title, date, time)
        const duplicate = schedules.find(
          (s) =>
            s.date === formData.date &&
            s.scheduleTime === formData.scheduleTime &&
            normalize(s.title) === normalize(formData.title) &&
            (!selectedSchedule || s.id !== selectedSchedule.id) // avoid comparing with itself during edit
        );

        if (duplicate) {
          alert(
            "A schedule with the same title, date, and time already exists."
          );
          return;
        }

        // Optional: Prevent scheduling in the past
        const selectedDateTime = new Date(
          `${formData.date}T${formData.scheduleTime}`
        );
        if (selectedDateTime < new Date()) {
          alert("Cannot schedule a task in the past.");
          return;
        }

        if (selectedSchedule) {
          // Update existing schedule
          await updateDoc(
            doc(db, "schedules", selectedSchedule.id),
            scheduleData
          );

          logUserAction("schedule_updated", {
            scheduleId: selectedSchedule.id,
          });

          // Invalidate cache for this user
          invalidateUserCache(userId);

          alert("Schedule updated successfully!");
        } else {
          // Add new schedule
          const docRef = await addDoc(schedulesRef, scheduleData);
          logUserAction('schedule_created', {scheduleId: docRef.id});
          

          // Invalidate cache for this user
          invalidateUserCache(userId);

          // Trigger email reminder if needed
          if (formData.reminder && auth.currentUser?.email) {
            // Access the email from auth.currentUser
            // Trigger reminder email with correct data
            const reminderPayload = {
              title: formData.title,
              category: formData.category,
              priority: formData.priority,
              date: formData.date,
              scheduleTime: formData.scheduleTime,
              reminderTime: formData.reminderTime,
              reminderDate: formData.reminderDate,
              email: auth.currentUser.email, // Use auth.currentUser.email here
            };

            console.log("Reminder Payload:", reminderPayload); // Check the payload
            await triggerEmailReminder(reminderPayload);
          }

          alert("Schedule added successfully!");
        }

        setIsModalOpen(false);
        resetForm();
      } catch (error) {
        console.error("Error saving schedule:", error);
        logError(error, {
          action: selectedSchedule ? "update_schedule" : "create_schedule",
          scheduleData: formData,
        });
        alert("There was an error saving your schedule. Please try again.");
      }
    });
  };

  const triggerEmailReminder = async (reminderPayload) => {
    try {
      // Construct the email body from the reminder payload
      const payload = {
        email: reminderPayload.email,
        subject: `Reminder: ${reminderPayload.title} on ${reminderPayload.date} at ${reminderPayload.scheduleTime}`,
        body: `This is a reminder for your scheduled task: ${reminderPayload.title}\nScheduled for: ${reminderPayload.date} at ${reminderPayload.scheduleTime}\nReminder Date: ${reminderPayload.reminderDate}\nReminder Time: ${reminderPayload.reminderTime}`,
      };

      // Call your backend or email service to send the email
      const response = await fetch(
        "https://us-central1-appointmentapplication-9c371.cloudfunctions.net/sendReminderNow",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send reminder email.");
      }

      console.log("Reminder email sent successfully!");
    } catch (error) {
      console.error("Error sending reminder email:", error);
    }
  };

  // Delete a schedule
  const deleteSchedule = async () => {
    if (!selectedSchedule) return;

    if (window.confirm("Are you sure you want to delete this schedule?")) {
      try {
        await deleteDoc(doc(db, "schedules", selectedSchedule.id));
        logUserAction("schedule_deleted", { scheduleId: selectedSchedule.id });

        // Invalidate cache for this user
        invalidateUserCache(auth.currentUser.uid);

        alert("Schedule deleted successfully!");
        setIsModalOpen(false);
        resetForm();
      } catch (error) {
        console.error("Error deleting schedule:", error);
        logError(error, {
          action: "delete_schedule",
          scheduleId: selectedSchedule.id,
        });
        alert("There was an error deleting your schedule. Please try again.");
      }
    }
  };

  // Get color based on priority
  const getPriorityColor = (priority) => {
    const colors = {
      high: "#ef4455", // Red
      medium: "#f59e0b", // Amber
      low: "#10b981", // Emerald
    };
    return colors[priority] || "#3b82f6"; // Default blue
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Theme class for dark mode
  const themeClass = isDarkMode ? "dark-theme" : "light-theme";

  return trackRenderTime("manage_schedule", () => (
    <div
      className={`schedule-manager ${themeClass}`}
      style={isDarkMode ? darkStyles.container : styles.container}
    >
      <Sidebar />

      <div className="content-area" style={styles.content}>
        {/* Header Section */}
        <header style={styles.header}>
          <h1 style={isDarkMode ? darkStyles.title : styles.title}>
            Schedule Manager
          </h1>

          <div style={styles.controls}>
            <button
              onClick={toggleDarkMode}
              style={isDarkMode ? darkStyles.themeToggle : styles.themeToggle}
            >
              {isDarkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              style={styles.primaryButton}
            >
              + New Schedule
            </button>
          </div>
        </header>

        {/* View and Filter Controls */}
        <div style={styles.controlsPanel}>
          <div style={styles.viewControls}>
            {viewOptions.map((view) => (
              <button
                key={view.value}
                onClick={() => setCurrentView(view.value)}
                style={{
                  ...(isDarkMode ? darkStyles.viewButton : styles.viewButton),
                  ...(currentView === view.value
                    ? isDarkMode
                      ? darkStyles.activeView
                      : styles.activeView
                    : {}),
                }}
              >
                <span style={styles.viewIcon}>{view.icon}</span>
                {view.name}
              </button>
            ))}
          </div>

          <div style={styles.filterControls}>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={
                isDarkMode ? darkStyles.filterDropdown : styles.filterDropdown
              }
            >
              <option value="all">All Categories</option>
              <option value="deadlines">Deadlines</option>
              <option value="appointments">Appointments</option>
              <option value="events">Events</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={
                isDarkMode ? darkStyles.filterDropdown : styles.filterDropdown
              }
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Calendar View */}
        {currentView === "calendar" && (
          <div
            style={
              isDarkMode ? darkStyles.calendarWrapper : styles.calendarWrapper
            }
          >
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
              height="auto"
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              events={filteredSchedules.map((schedule) => ({
                id: schedule.id,
                title: schedule.title,
                start: `${schedule.date}T${schedule.scheduleTime}`,
                backgroundColor: getPriorityColor(schedule.priority),
                borderColor: getPriorityColor(schedule.priority),
                textColor: "#ffffff",
                extendedProps: {
                  category: schedule.category,
                  priority: schedule.priority,
                  reminder: schedule.reminder,
                  scheduleTime: schedule.scheduleTime,
                  reminderTime: schedule.reminderTime,
                  reminderDate: schedule.reminderDate,
                },
              }))}
              eventContent={(arg) => (
                <div
                  style={{
                    width: "100%",
                    backgroundColor: arg.event.backgroundColor, // This sets the background color
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
          <div style={styles.boardView}>
            <div style={styles.kanbanBoard}>
              {Object.entries(schedulesByPriority).map(([priority, tasks]) => (
                <div
                  key={priority}
                  style={
                    isDarkMode ? darkStyles.kanbanColumn : styles.kanbanColumn
                  }
                >
                  <div
                    style={{
                      ...(isDarkMode
                        ? darkStyles.columnHeader
                        : styles.columnHeader),
                      backgroundColor: `${getPriorityColor(priority)}${
                        isDarkMode ? "33" : "22"
                      }`,
                      borderBottom: `2px solid ${getPriorityColor(priority)}`,
                    }}
                  >
                    <h3
                      style={
                        isDarkMode ? darkStyles.columnTitle : styles.columnTitle
                      }
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}{" "}
                      Priority
                    </h3>
                    <span style={styles.taskCount}>{tasks.length}</span>
                  </div>

                  <div style={styles.taskList}>
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        style={
                          isDarkMode ? darkStyles.taskCard : styles.taskCard
                        }
                        onClick={() => {
                          setSelectedSchedule(task);
                          setFormData({
                            title: task.title,
                            category: task.category,
                            priority: task.priority,
                            reminder: task.reminder,
                            date: task.date,
                            scheduleTime: task.scheduleTime,
                            reminderTime: task.reminderTime,
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <div
                          style={
                            isDarkMode ? darkStyles.taskTitle : styles.taskTitle
                          }
                        >
                          {task.title}
                        </div>
                        <div
                          style={
                            isDarkMode
                              ? darkStyles.taskCategory
                              : styles.taskCategory
                          }
                        >
                          {task.category}
                        </div>
                        <div style={styles.taskFooter}>
                          <div
                            style={
                              isDarkMode ? darkStyles.taskDate : styles.taskDate
                            }
                          >
                            {new Date(task.date).toLocaleDateString()}
                          </div>
                          {task.reminder && (
                            <div style={styles.reminderIcon}>🔔</div>
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

        {/* List View */}
        {currentView === "allTasks" && (
          <div style={styles.listView}>
            <h3
              style={isDarkMode ? darkStyles.sectionTitle : styles.sectionTitle}
            >
              All Schedules
            </h3>

            <div style={styles.taskListContainer}>
              {filteredSchedules
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((task) => (
                  <div
                    key={task.id}
                    style={{
                      ...(isDarkMode ? darkStyles.listItem : styles.listItem),
                      borderLeft: `4px solid ${getPriorityColor(
                        task.priority
                      )}`,
                    }}
                    onClick={() => {
                      setSelectedSchedule(task);
                      setFormData({
                        title: task.title,
                        category: task.category,
                        priority: task.priority,
                        reminder: task.reminder,
                        date: task.date,
                        scheduleTime: task.scheduleTime,
                        reminderTime: task.reminderTime,
                      });
                      setIsModalOpen(true);
                    }}
                  >
                    <div style={styles.listItemHeader}>
                      <div
                        style={
                          isDarkMode
                            ? darkStyles.listItemTitle
                            : styles.listItemTitle
                        }
                      >
                        {task.title}
                      </div>
                      <div
                        style={
                          isDarkMode
                            ? darkStyles.listItemDate
                            : styles.listItemDate
                        }
                      >
                        {new Date(task.date).toLocaleDateString()} at{" "}
                        {task.scheduleTime}
                      </div>
                    </div>

                    <div style={styles.listItemDetails}>
                      <div
                        style={
                          isDarkMode
                            ? darkStyles.listItemCategory
                            : styles.listItemCategory
                        }
                      >
                        {task.category}
                      </div>
                      <div
                        style={{
                          ...styles.priorityBadge,
                          backgroundColor: getPriorityColor(task.priority),
                        }}
                      >
                        {task.priority}
                      </div>
                      {task.reminder && (
                        <div
                          style={
                            isDarkMode
                              ? darkStyles.reminderBadge
                              : styles.reminderBadge
                          }
                        >
                          🔔 Reminder Set
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Enhanced Schedule Modal */}
        {isModalOpen && (
          <>
            <div
              style={styles.modalOverlay}
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            />

            <div style={isDarkMode ? darkStyles.modal : styles.modal}>
              <div
                style={isDarkMode ? darkStyles.modalHeader : styles.modalHeader}
              >
                <h3
                  style={isDarkMode ? darkStyles.modalTitle : styles.modalTitle}
                >
                  {selectedSchedule ? "Edit Schedule" : "Create New Schedule"}
                </h3>
                <button
                  style={
                    isDarkMode ? darkStyles.closeButton : styles.closeButton
                  }
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                >
                  ×
                </button>
              </div>

              <div style={styles.modalBody}>
                {/* Title Input */}
                <div style={styles.formGroup}>
                  <label
                    style={isDarkMode ? darkStyles.formLabel : styles.formLabel}
                  >
                    Title<span style={styles.requiredStar}>*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Meeting with team"
                    value={formData.title}
                    onChange={handleInputChange}
                    style={isDarkMode ? darkStyles.formInput : styles.formInput}
                  />
                </div>

                {/* Category and Priority */}
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label
                      style={
                        isDarkMode ? darkStyles.formLabel : styles.formLabel
                      }
                    >
                      Category<span style={styles.requiredStar}>*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      style={
                        isDarkMode ? darkStyles.formInput : styles.formInput
                      }
                      className={formData.category ? "" : "placeholder"}
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      <option value="deadlines">Deadline</option>
                      <option value="appointments">Appointment</option>
                      <option value="events">Event</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label
                      style={
                        isDarkMode ? darkStyles.formLabel : styles.formLabel
                      }
                    >
                      Priority<span style={styles.requiredStar}>*</span>
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      style={{
                        ...(isDarkMode
                          ? darkStyles.formInput
                          : styles.formInput),
                        ...(formData.priority && {
                          borderLeft: `4px solid ${getPriorityColor(
                            formData.priority
                          )}`,
                        }),
                      }}
                      className={formData.priority ? "" : "placeholder"}
                    >
                      <option value="" disabled>
                        Select priority
                      </option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                {/* Date - Now in its own group */}
                <div style={styles.formGroup}>
                  <label
                    style={isDarkMode ? darkStyles.formLabel : styles.formLabel}
                  >
                    Date<span style={styles.requiredStar}>*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    style={isDarkMode ? darkStyles.formInput : styles.formInput}
                  />
                </div>

                {/* Time - Now in its own group */}
                <div style={styles.formGroup}>
                  <label
                    style={isDarkMode ? darkStyles.formLabel : styles.formLabel}
                  >
                    Time<span style={styles.requiredStar}>*</span>
                  </label>
                  <input
                    type="time"
                    name="scheduleTime"
                    value={formData.scheduleTime}
                    onChange={handleInputChange}
                    style={isDarkMode ? darkStyles.formInput : styles.formInput}
                  />
                </div>

                {/* Reminder Section - Modified to show reminder time only when checkbox is checked */}
                <div style={styles.reminderSection}>
                  <label
                    style={
                      isDarkMode
                        ? darkStyles.checkboxContainer
                        : styles.checkboxContainer
                    }
                  >
                    <input
                      type="checkbox"
                      name="reminder"
                      checked={formData.reminder}
                      onChange={handleReminderChange}
                      style={styles.checkboxInput}
                    />
                    <span
                      style={
                        isDarkMode
                          ? darkStyles.checkboxLabel
                          : styles.checkboxLabel
                      }
                    >
                      Set Reminder
                    </span>
                  </label>

                  {/* Only show reminder time input when reminder checkbox is checked */}
                  {formData.reminder && (
                    <>
                      <input
                        type="date"
                        name="reminderDate"
                        value={formData.reminderDate}
                        onChange={handleInputChange}
                        style={
                          isDarkMode ? darkStyles.formInput : styles.formInput
                        }
                      />

                      {/* Your existing reminderTime input remains here */}
                      <input
                        type="time"
                        name="reminderTime"
                        value={formData.reminderTime}
                        onChange={handleInputChange}
                        style={
                          isDarkMode ? darkStyles.formInput : styles.formInput
                        }
                      />
                    </>
                  )}
                </div>

                {/* Modal Footer with Actions */}
                <div style={styles.modalFooter}>
                  {selectedSchedule && (
                    <button
                      onClick={deleteSchedule}
                      style={styles.dangerButton}
                    >
                      Delete Schedule
                    </button>
                  )}

                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                      style={
                        isDarkMode
                          ? darkStyles.secondaryButton
                          : styles.secondaryButton
                      }
                    >
                      Cancel
                    </button>
                    <button onClick={saveSchedule} style={styles.primaryButton}>
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
  ));
};
// Light theme styles
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
    backgroundColor: "#f9fafb",
    color: "#333",
    transition: "all 0.3s ease",
  },
  content: {
    flex: 1,
    padding: "2rem",
    marginLeft: "260px", // Sidebar width
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid #e2e8f0",
  },
  title: {
    // fontSize: "1.75rem",
    fontWeight: 600,
    margin: 0,
    color: "#1e293b",
  },
  controls: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
  },
  themeToggle: {
    padding: "0.5rem 1rem",
    backgroundColor: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: "0.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "1rem",
  },
  primaryButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    fontWeight: 500,
    transition: "background-color 0.2s",
  },
  controlsPanel: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  viewControls: {
    display: "flex",
    gap: "0.5rem",
  },
  viewButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: "0.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.875rem",
    transition: "all 0.2s",
  },
  activeView: {
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
    fontWeight: 500,
  },
  viewIcon: {
    fontSize: "1rem",
  },
  filterControls: {
    display: "flex",
    gap: "0.75rem",
  },
  filterDropdown: {
    padding: "0.5rem 1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    backgroundColor: "white",
  },
  calendarWrapper: {
    backgroundColor: "white",
    borderRadius: "0.75rem",
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  eventContent: {
    padding: "0.25rem 0.5rem",
  },
  eventTitle: {
    fontWeight: 500,
    fontSize: "0.875rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  eventCategory: {
    fontSize: "0.75rem",
    opacity: 0.8,
  },
  boardView: {
    marginTop: "1.5rem",
  },
  kanbanBoard: {
    display: "flex",
    gap: "1.5rem",
    overflowX: "auto",
    paddingBottom: "1rem",
  },
  kanbanColumn: {
    minWidth: "300px",
    backgroundColor: "white",
    borderRadius: "0.75rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
    maxHeight: "70vh",
  },
  columnHeader: {
    padding: "0.75rem 1rem",
    borderTopLeftRadius: "0.75rem",
    borderTopRightRadius: "0.75rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  columnTitle: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 600,
  },
  taskCount: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: "0.75rem",
    padding: "0.125rem 0.5rem",
    fontSize: "0.75rem",
    fontWeight: 500,
  },
  taskList: {
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    overflowY: "auto",
    flex: 1,
  },
  taskCard: {
    padding: "0.75rem",
    backgroundColor: "#f8fafc",
    borderRadius: "0.5rem",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  taskTitle: {
    fontWeight: 500,
    fontSize: "0.875rem",
  },
  taskCategory: {
    fontSize: "0.75rem",
    backgroundColor: "#f1f5f9",
    padding: "0.125rem 0.5rem",
    borderRadius: "0.25rem",
    display: "inline-block",
  },
  taskFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "0.25rem",
  },
  taskDate: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
  reminderIcon: {
    fontSize: "0.875rem",
  },
  listView: {
    marginTop: "1.5rem",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "1rem",
    color: "#1e293b",
  },
  taskListContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  listItem: {
    padding: "0.75rem 1rem",
    backgroundColor: "white",
    borderRadius: "0.5rem",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  listItemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
  },
  listItemTitle: {
    fontWeight: 500,
    flex: 1,
  },
  listItemDate: {
    fontSize: "0.875rem",
    color: "#64748b",
  },
  listItemDetails: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  listItemCategory: {
    fontSize: "0.875rem",
    backgroundColor: "#f1f5f9",
    padding: "0.125rem 0.5rem",
    borderRadius: "0.25rem",
  },
  priorityBadge: {
    fontSize: "0.75rem",
    padding: "0.125rem 0.5rem",
    borderRadius: "0.25rem",
    color: "white",
    textTransform: "capitalize",
  },
  reminderBadge: {
    fontSize: "0.75rem",
    padding: "0.125rem 0.5rem",
    backgroundColor: "#f8fafc",
    borderRadius: "0.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },

  // Modal overlay - darkens the background when modal is open
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
  },

  // Main modal container
  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
    width: "500px",
    maxWidth: "90%",
    maxHeight: "90vh",
    overflow: "auto",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
  },

  // Modal header section
  modalHeader: {
    padding: "16px 24px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
  },

  // Modal title
  modalTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827",
  },

  // Close button
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "24px",
    color: "#6b7280",
    cursor: "pointer",
    padding: "0 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s",
    "&:hover": {
      color: "#111827",
    },
  },

  // Modal body containing the form
  modalBody: {
    padding: "24px",
  },

  // Form group (label + input/select)
  formGroup: {
    marginBottom: "20px",
    width: "100%",
  },

  // Form row for side-by-side inputs
  formRow: {
    display: "flex",
    gap: "26px",
    marginBottom: "20px",
    marginRight: "20px",
  },

  // Label styling
  formLabel: {
    display: "block",
    marginBottom: "6px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
  },

  // Required field indicator
  requiredStar: {
    color: "#dc2626",
    marginLeft: "4px",
  },

  // Input and select styling
  formInput: {
    width: "97%",
    padding: "10px 14px",
    fontSize: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: "#fff",
    color: "#1f2937",
    transition: "border-color 0.2s, box-shadow 0.2s",
    "&:focus": {
      outline: "none",
      borderColor: "#2563eb",
      boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)",
    },
    "&.placeholder": {
      color: "#9ca3af",
    },
  },

  // Reminder section container
  reminderSection: {
    marginBottom: "20px",
    padding: "16px",
    backgroundColor: "#f9fafb",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
  },

  // Checkbox container
  checkboxContainer: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    marginBottom: "12px",
  },

  // Checkbox input
  checkboxInput: {
    marginRight: "8px",
    cursor: "pointer",
  },

  // Checkbox label
  checkboxLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
  },

  // Modal footer
  modalFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },

  // Container for action buttons (save/cancel)
  actionButtons: {
    display: "flex",
    gap: "12px",
  },

  // Primary button (Save/Update)
  primaryButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "#1d4ed8",
    },
    "&:focus": {
      outline: "none",
      boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.4)",
    },
  },

  // Secondary button (Cancel)
  secondaryButton: {
    backgroundColor: "#ffffff",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s, border-color 0.2s",
    "&:hover": {
      backgroundColor: "#f3f4f6",
      borderColor: "#9ca3af",
    },
    "&:focus": {
      outline: "none",
      boxShadow: "0 0 0 3px rgba(209, 213, 219, 0.4)",
    },
  },

  // Danger button (Delete)
  dangerButton: {
    backgroundColor: "#ffffff",
    color: "#dc2626",
    border: "1px solid #dc2626",
    borderRadius: "6px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s, color 0.2s",
    "&:hover": {
      backgroundColor: "#dc2626",
      color: "#ffffff",
    },
    "&:focus": {
      outline: "none",
      boxShadow: "0 0 0 3px rgba(220, 38, 38, 0.2)",
    },
  },
};

// Dark theme styles
const darkStyles = {
  container: {
    ...styles.container,
    backgroundColor: "#111827",
    color: "#e5e7eb",
  },
  modal: {
    ...styles.modal,
    backgroundColor: "#1f2937",
    color: "#e5e7eb",
  },
  modalHeader: {
    ...styles.modalHeader,
    backgroundColor: "#111827",
    borderBottom: "1px solid #374151",
  },
  modalTitle: {
    ...styles.title,
    color: "#f3f4f6",
  },
  closeButton: {
    ...styles.closeButton,
    color: "#9ca3af",
  },
  formLabel: {
    ...styles.formLabel,
    color: "#d1d5db",
  },
  title: {
    ...styles.title,
    color: "#f3f4f6",
  },
  sectionTitle: {
    ...styles.sectionTitle,
    color: "#f3f4f6",
  },
  primaryButton: {
    ...styles.primaryButton,
    backgroundColor: "#2563eb",
  },
  secondaryButton: {
    ...styles.secondaryButton,
    backgroundColor: "#374151",
    color: "#f3f4f6",
    borderColor: "#4b5563",
  },
  dangerButton: {
    ...styles.dangerButton,
    backgroundColor: "#374151",
    color: "#ef4444",
    borderColor: "#ef4444",
  },
  formInput: {
    ...styles.formInput,
    backgroundColor: "#1f2937",
    borderColor: "#4b5563",
    color: "#f3f4f6",
    // We can't use pseudo-selectors, so we add direct style properties
  },
  checkboxContainer: {
    ...styles.checkboxContainer,
    color: "#d1d5db",
  },
  checkboxLabel: {
    ...styles.checkboxLabel,
    color: "black",
  },
  filterDropdown: {
    ...styles.filterDropdown,
    backgroundColor: "#1f2937",
    borderColor: "#4b5563",
    color: "#f3f4f6",
  },
  viewButton: {
    ...styles.viewButton,
    borderColor: "#4b5563",
    color: "#f3f4f6",
  },
  activeView: {
    ...styles.activeView,
    backgroundColor: "#374151",
    borderColor: "#4b5563",
  },
  calendarWrapper: {
    ...styles.calendarWrapper,
    backgroundColor: "#1f2937",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
  },
  kanbanColumn: {
    ...styles.kanbanColumn,
    backgroundColor: "#1f2937",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
  },
  columnHeader: {
    ...styles.columnHeader,
    backgroundColor: "#111827",
  },
  columnTitle: {
    ...styles.columnTitle,
    color: "#f3f4f6",
  },
  taskCard: {
    ...styles.taskCard,
    backgroundColor: "#111827",
    borderColor: "#4b5563",
  },
  taskTitle: {
    ...styles.taskTitle,
    color: "#f3f4f6",
  },
  taskCategory: {
    ...styles.taskCategory,
    backgroundColor: "#374151",
    color: "#f3f4f6",
  },
  taskDate: {
    ...styles.taskDate,
    color: "#9ca3af",
  },
  listItem: {
    ...styles.listItem,
    backgroundColor: "#1f2937",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
  },
  listItemTitle: {
    ...styles.listItemTitle,
    color: "#f3f4f6",
  },
  listItemDate: {
    ...styles.listItemDate,
    color: "#9ca3af",
  },
  listItemCategory: {
    ...styles.listItemCategory,
    backgroundColor: "#374151",
    color: "#f3f4f6",
  },
  reminderBadge: {
    ...styles.reminderBadge,
    backgroundColor: "#1f2937",
    color: "red",
  },
  // Fix for reminder section
  reminderSection: {
    ...styles.reminderSection,
    backgroundColor: "#2d3748", // Dark blue-gray background
    borderColor: "#4b5563",
    color: "black", // Light text color
  },
  // Add specific style for theme toggle button in dark mode
  themeToggle: {
    ...styles.themeToggle,
    color: "#f3f4f6", // Light color for the text in dark mode
    borderColor: "#4b5563",
  },
  requiredStar: {
    ...styles.requiredStar,
  },
};

export default ManageSchedule;
