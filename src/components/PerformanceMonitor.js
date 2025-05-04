// src/components/PerformanceMonitor.js
import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

function PerformanceMonitor() {
  const [metrics, setMetrics] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch performance metrics
    const metricsRef = collection(db, 'performance_metrics');
    const metricsQuery = query(metricsRef, orderBy('timestamp', 'desc'), limit(20));
    
    const unsubscribeMetrics = onSnapshot(metricsQuery, (snapshot) => {
      const metricsData = [];
      snapshot.forEach(doc => {
        metricsData.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        });
      });
      setMetrics(metricsData);
      setLoading(false);
    });
    
    // Fetch logs
    const logsRef = collection(db, 'logs');
    const logsQuery = query(logsRef, orderBy('timestamp', 'desc'), limit(20));
    
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsData = [];
      snapshot.forEach(doc => {
        logsData.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        });
      });
      setLogs(logsData);
    });
    
    return () => {
      unsubscribeMetrics();
      unsubscribeLogs();
    };
  }, []);
  
  if (loading) {
    return <div>Loading monitoring data...</div>;
  }
  
  return (
    <div className="performance-monitor">
      <h2>Performance Metrics</h2>
      
      <table>
        <thead>
          <tr>
            <th>Operation</th>
            <th>Duration (ms)</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map(metric => (
            <tr key={metric.id}>
              <td>{metric.operation}</td>
              <td>{metric.duration?.toFixed(2) || 'N/A'}</td>
              <td>{metric.timestamp.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <h2>Recent Logs</h2>
      
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Message</th>
            <th>Severity</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{log.type}</td>
              <td>{log.message}</td>
              <td>{log.severity}</td>
              <td>{log.timestamp.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PerformanceMonitor;