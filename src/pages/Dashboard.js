import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faTasks,
  faBullhorn,
  faCalendarCheck,
  faCircle,
  faChevronDown
} from "@fortawesome/free-solid-svg-icons";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale
);

const Dashboard = () => {
  const [schedules, setSchedules] = useState([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState([]);
  const [priorityDistribution, setPriorityDistribution] = useState({
    high: 0,
    medium: 0,
    low: 0,
  });
  const [collapsedSections, setCollapsedSections] = useState({
    upcoming: false,
    activity: false,
    completion: false,
    priority: false
  });

  const schedulesRef = collection(db, "schedules");

  useEffect(() => {
    const unsubscribe = onSnapshot(schedulesRef, (snapshot) => {
      const fetchedSchedules = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSchedules(fetchedSchedules);
      setUpcomingSchedule(getUpcomingSchedules(fetchedSchedules));
      setPriorityDistribution(getPriorityDistribution(fetchedSchedules));
    });
    return () => unsubscribe();
  }, []);

  const toggleSection = (section) => {
    setCollapsedSections({
      ...collapsedSections,
      [section]: !collapsedSections[section]
    });
  };

  const getUpcomingSchedules = (schedules) => {
    const sortedSchedules = schedules
      .filter((schedule) => new Date(schedule.date) > new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return sortedSchedules.slice(0, 5); // Get the next 5 upcoming schedules
  };

  const getPriorityDistribution = (schedules) => {
    const distribution = { high: 0, medium: 0, low: 0 };
    schedules.forEach((schedule) => {
      if (schedule.priority) {
        distribution[schedule.priority]++;
      }
    });
    return distribution;
  };

  const getFormattedDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const appointmentCount = schedules.filter(
    (s) => s.category === "appointments"
  ).length;
  const deadlineCount = schedules.filter(
    (s) => s.category === "deadlines"
  ).length;
  const eventCount = schedules.filter((s) => s.category === "events").length;
  const totalCount = schedules.length;

  const completedCount = schedules.filter((s) => {
    const scheduleDate = new Date(s.date);
    return scheduleDate instanceof Date && !isNaN(scheduleDate) && scheduleDate <= new Date();
  }).length;
  
  const getProgressBarPercentage = () => {
    return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "high": return "#ef4455";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#3b82f6";
    }
  };


  const chartData = {
    labels: ["High", "Medium", "Low"],
    datasets: [
      {
        data: [
          priorityDistribution.high,
          priorityDistribution.medium,
          priorityDistribution.low,
        ],
        backgroundColor: [`${getPriorityColor('high')}90`, `${getPriorityColor('medium')}90`, `${getPriorityColor('low')}90`],
        borderColor: ["#ffffff", "#ffffff", "#ffffff"],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(33, 33, 33, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 14
        },
        padding: 12,
        boxPadding: 8,
        cornerRadius: 6
      }
    },
    maintainAspectRatio: false
  };

  
  const getCategoryIcon = (category) => {
    switch(category) {
      case "appointments": return faCalendarAlt;
      case "deadlines": return faTasks;
      case "events": return faBullhorn;
      default: return faCalendarCheck;
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case "appointments": return "#8E24AA"; // Purple
      case "deadlines": return "#F57C00"; // Orange
      case "events": return "#00ACC1"; // Cyan
      default: return "#9E9E9E"; // Grey
    }
  };

  return (
    <div style={styles.dashboardContainer}>
      <Sidebar />
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Overview of your schedule tracking system</p>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={{...styles.statCard, background: "linear-gradient(135deg, #8E24AA11, #8E24AA22)"}}>
            <div style={styles.statIcon}>
              <FontAwesomeIcon icon={faCalendarAlt} style={{...styles.icon, color: "#8E24AA"}} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statValue}>{appointmentCount}</h3>
              <p style={styles.statLabel}>Appointments</p>
            </div>
          </div>
          
          <div style={{...styles.statCard, background: "linear-gradient(135deg, #F57C0011, #F57C0022)"}}>
            <div style={styles.statIcon}>
              <FontAwesomeIcon icon={faTasks} style={{...styles.icon, color: "#F57C00"}} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statValue}>{deadlineCount}</h3>
              <p style={styles.statLabel}>Deadlines</p>
            </div>
          </div>
          
          <div style={{...styles.statCard, background: "linear-gradient(135deg, #00ACC111, #00ACC122)"}}>
            <div style={styles.statIcon}>
              <FontAwesomeIcon icon={faBullhorn} style={{...styles.icon, color: "#00ACC1"}} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statValue}>{eventCount}</h3>
              <p style={styles.statLabel}>Events</p>
            </div>
          </div>
          
          <div style={{...styles.statCard, background: "linear-gradient(135deg, #2196F311, #2196F322)"}}>
            <div style={styles.statIcon}>
              <FontAwesomeIcon icon={faCalendarCheck} style={{...styles.icon, color: "#2196F3"}} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statValue}>{totalCount}</h3>
              <p style={styles.statLabel}>Total Items</p>
            </div>
          </div>
        </div>

        <div style={styles.twoColumnGrid}>
          {/* Left Column */}
          <div style={styles.columnLeft}>
            {/* Upcoming Schedules Section */}
            <div style={styles.sectionCard}>
              <div 
                style={styles.sectionHeader}
                onClick={() => toggleSection('upcoming')}
              >
                <h2 style={styles.sectionTitle}>
                  <FontAwesomeIcon icon={faCalendarAlt} style={styles.headerIcon} /> 
                  Upcoming Schedule
                </h2>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  style={{
                    ...styles.chevron,
                    transform: collapsedSections.upcoming ? 'rotate(-90deg)' : 'rotate(0)'
                  }} 
                />
              </div>

              {!collapsedSections.upcoming && (
                upcomingSchedule.length > 0 ? (
                  <div style={styles.scheduleList}>
                    {upcomingSchedule.map((schedule) => (
                      <div key={schedule.id} style={styles.scheduleItem}>
                        <div style={{
                          ...styles.scheduleLeftBorder,
                          backgroundColor: `${getPriorityColor(schedule.priority)}90`
                        }}></div>
                        <div style={styles.scheduleContent}>
                          <div style={styles.scheduleDetails}>
                            <div style={styles.scheduleTitle}>{schedule.title}</div>
                            <div style={styles.scheduleCategory}>
                              <FontAwesomeIcon 
                                icon={getCategoryIcon(schedule.category)} 
                                style={{
                                  color: getCategoryColor(schedule.category),
                                  marginRight: '6px',
                                  fontSize: '12px'
                                }}
                              />
                              {schedule.category && schedule.category.charAt(0).toUpperCase() + schedule.category.slice(1)}
                            </div>
                          </div>
                          <div style={styles.scheduleRight}>
                            <div style={styles.scheduleDate}>
                              {getFormattedDate(schedule.date)}
                            </div>
                            {schedule.priority && (
                              <div style={{
                                ...styles.priorityTag,
                                backgroundColor: `${getPriorityColor(schedule.priority)}90`,
                              }}>
                                {schedule.priority}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyState}>No upcoming schedules</div>
                )
              )}
            </div>

            {/* Recent Activity Section */}
            <div style={styles.sectionCard}>
              <div 
                style={styles.sectionHeader}
                onClick={() => toggleSection('activity')}
              >
                <h2 style={styles.sectionTitle}>
                  <FontAwesomeIcon icon={faTasks} style={styles.headerIcon} /> 
                  Recent Activity
                </h2>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  style={{
                    ...styles.chevron,
                    transform: collapsedSections.activity ? 'rotate(-90deg)' : 'rotate(0)'
                  }} 
                />
              </div>

              {!collapsedSections.activity && (
                schedules.length > 0 ? (
                  <div style={styles.activityList}>
                    {schedules.slice(0, 5).map((schedule) => (
                      <div key={schedule.id} style={styles.activityItem}>
                        <div style={styles.activityIconContainer}>
                          <FontAwesomeIcon 
                            icon={getCategoryIcon(schedule.category)}
                            style={{
                              color: '#fff',
                              fontSize: '14px'
                            }} 
                          />
                        </div>
                        <div style={styles.activityContent}>
                          <div style={styles.activityTitle}>{schedule.title}</div>
                          <div style={styles.activityMeta}>
                            <span style={styles.activityDate}>{getFormattedDate(schedule.date)}</span>
                            {/* {schedule.priority && (
                              <span style={{
                                ...styles.priorityTag,
                                backgroundColor: getPriorityColor(schedule.priority),
                              }}>
                                {schedule.priority}
                              </span>
                            )} */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyState}>No recent activity</div>
                )
              )}
            </div>
          </div>

          {/* Right Column */}
          <div style={styles.columnRight}>
            {/* Completion Stats */}
            <div style={styles.sectionCard}>
              <div 
                style={styles.sectionHeader}
                onClick={() => toggleSection('completion')}
              >
                <h2 style={styles.sectionTitle}>
                  <FontAwesomeIcon icon={faCalendarCheck} style={styles.headerIcon} /> 
                  Completion Status
                </h2>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  style={{
                    ...styles.chevron,
                    transform: collapsedSections.completion ? 'rotate(-90deg)' : 'rotate(0)'
                  }} 
                />
              </div>

              {!collapsedSections.completion && (
                <div style={styles.completionContainer}>
                  <div style={styles.completionStats}>
                    <div style={{
                      ...styles.completionValue, 
                      color: getProgressBarPercentage() > 70 ? '#4CAF50' : 
                             getProgressBarPercentage() > 30 ? '#FF9800' : '#FF5252'
                    }}>
                      {getProgressBarPercentage()}%
                    </div>
                    <div style={styles.completionLabel}>completed</div>
                  </div>
                  <div style={styles.completionBarOuter}>
                    <div 
                      style={{
                        ...styles.completionBarInner,
                        width: `${getProgressBarPercentage()}%`,
                        backgroundColor: getProgressBarPercentage() > 70 ? '#4CAF50' : 
                                        getProgressBarPercentage() > 30 ? '#FF9800' : '#FF5252'
                      }}
                    ></div>
                  </div>
                  <div style={styles.completionDetails}>
                    <span>{completedCount} of {totalCount} items completed</span>
                  </div>
                </div>
              )}
            </div>

            {/* Priority Distribution Graph */}
            <div style={{...styles.sectionCard, position: 'relative'}}>
              <div 
                style={styles.sectionHeader}
                onClick={() => toggleSection('priority')}
              >
                <h2 style={styles.sectionTitle}>
                  <FontAwesomeIcon icon={faBullhorn} style={styles.headerIcon} /> 
                  Priority Distribution
                </h2>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  style={{
                    ...styles.chevron,
                    transform: collapsedSections.priority ? 'rotate(-90deg)' : 'rotate(0)'
                  }} 
                />
              </div>

              {!collapsedSections.priority && (
                <>
                  <div style={styles.chartContainer}>
                    <Pie data={chartData} options={chartOptions} />
                  </div>
                  <div style={styles.legendContainer}>
                    <div style={styles.legendItem}>
                      <span style={{...styles.legendColor, backgroundColor: `${getPriorityColor('high')}90`}}></span>
                      <span style={styles.legendLabel}>High ({priorityDistribution.high})</span>
                    </div>
                    <div style={styles.legendItem}>
                      <span style={{...styles.legendColor, backgroundColor: `${getPriorityColor('medium')}90`}}></span>
                      <span style={styles.legendLabel}>Medium ({priorityDistribution.medium})</span>
                    </div>
                    <div style={styles.legendItem}>
                      <span style={{...styles.legendColor, backgroundColor: `${getPriorityColor('low')}90`}}></span>
                      <span style={styles.legendLabel}>Low ({priorityDistribution.low})</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  dashboardContainer: {
    display: "flex",
    backgroundColor: "#F5F7FA",
    minHeight: "100vh",
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#333333",
  },
  content: {
    flex: 1,
    padding: "40px 40px 40px 290px",  // Added left padding to account for sidebar
    maxWidth: "1400px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "32px",
  },
  title: {
    fontSize: "36px",
    fontWeight: "700",
    marginBottom: "8px",
    color: "#333333",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "16px",
    color: "#6B7280",
    fontWeight: "400",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "32px",
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "10px",
    padding: "24px 20px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    display: "flex",
    alignItems: "center",
    transition: "transform 0.3s, box-shadow 0.3s",
    cursor: "pointer",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
    },
  },
  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "16px",
    backgroundColor: "#FFFFFF",
  },
  icon: {
    fontSize: "24px",
  },
  statContent: {
    display: "flex",
    flexDirection: "column",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "4px",
    marginTop: 0,
    color: "#333333",
  },
  statLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#6B7280",
    margin: 0,
  },
  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  columnLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  columnRight: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    cursor: "pointer",
    borderBottom: "1px solid #EAEAEA",
    backgroundColor: "#FFFFFF",
    userSelect: "none",
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "#F9FAFB",
    },
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#333333",
    margin: 0,
    display: "flex",
    alignItems: "center",
  },
  headerIcon: {
    marginRight: "10px",
    fontSize: "14px",
    color: "#666666",
  },
  chevron: {
    fontSize: "14px",
    color: "#6B7280",
    transition: "transform 0.2s ease",
  },
  scheduleList: {
    display: "flex",
    flexDirection: "column",
  },
  scheduleItem: {
    display: "flex",
    borderBottom: "1px solid #EAEAEA",
    transition: "background-color 0.2s",
    cursor: "pointer",
    overflow: "hidden",
    "&:hover": {
      backgroundColor: "#F9FAFB",
    },
  },
  scheduleLeftBorder: {
    width: "4px",
    backgroundColor: "#4CAF50",
  },
  scheduleContent: {
    flex: 1,
    display: "flex",
    justifyContent: "space-between",
    padding: "14px 20px",
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleRight: {
    textAlign: "right",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-end",
    minWidth: "120px",
  },
  scheduleTitle: {
    fontSize: "15px",
    fontWeight: "500",
    color: "#333333",
    marginBottom: "6px",
  },
  scheduleCategory: {
    fontSize: "13px",
    color: "#6B7280",
    display: "flex",
    alignItems: "center",
  },
  scheduleDate: {
    fontSize: "13px",
    color: "#6B7280",
    marginBottom: "6px",
  },
  priorityTag: {
    fontSize: "12px",
    padding: "3px 8px",
    borderRadius: "4px",
    color: "white",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  activityList: {
    display: "flex",
    flexDirection: "column",
    padding: "12px 20px",
  },
  activityItem: {
    display: "flex",
    alignItems: "flex-start",
    padding: "12px 0",
    borderBottom: "1px solid #EAEAEA",
  },
  activityIconContainer: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "16px",
    background:"grey"
    // background: "linear-gradient(135deg, #4CAF50, #2196F3)",
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: "15px",
    fontWeight: "500",
    color: "#333333",
    marginBottom: "6px",
  },
  activityMeta: {
    display: "flex",
    alignItems: "center",
  },
  activityDate: {
    fontSize: "13px",
    color: "#6B7280",
    marginRight: "8px",
  },
  chartContainer: {
    height: "240px",
    padding: "20px",
  },
  legendContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "24px",
    padding: "0 20px 20px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
  },
  legendColor: {
    width: "12px",
    height: "12px",
    borderRadius: "4px",
    marginRight: "8px",
  },
  legendLabel: {
    fontSize: "13px",
    color: "#6B7280",
  },
  completionContainer: {
    display: "flex",
    flexDirection: "column",
    padding: "20px",
  },
  completionStats: {
    marginBottom: "16px",
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
  },
  completionValue: {
    fontSize: "36px",
    fontWeight: "700",
  },
  completionLabel: {
    fontSize: "16px",
    color: "#6B7280",
  },
  completionBarOuter: {
    width: "100%",
    height: "10px",
    backgroundColor: "#EAEAEA",
    borderRadius: "5px",
    overflow: "hidden",
    marginBottom: "12px",
    boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  completionBarInner: {
    height: "100%",
    borderRadius: "5px",
    transition: "width 0.5s ease",
  },
  completionDetails: {
    fontSize: "14px",
    color: "#6B7280",
    fontWeight: "500",
  },
  emptyState: {
    color: "#9CA3AF",
    textAlign: "center",
    padding: "32px 20px",
    fontStyle: "italic",
    fontSize: "14px",
  },
};

export default Dashboard;