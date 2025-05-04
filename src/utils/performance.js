import { trace } from 'firebase/performance';
import { perf } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Track rendering time
export function trackRenderTime(componentName, callback) {
  const renderTrace = trace(perf, `${componentName}_render`);
  const startTime = performance.now();
  renderTrace.start();
  
  try {
    const result = callback();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        renderTrace.stop();
        const duration = performance.now() - startTime;
        logPerformanceMetric(`${componentName}_render`, duration);
      });
    } else {
      renderTrace.stop();
      const duration = performance.now() - startTime;
      logPerformanceMetric(`${componentName}_render`, duration);
      return result;
    }
  } catch (error) {
    renderTrace.stop();
    const duration = performance.now() - startTime;
    logPerformanceMetric(`${componentName}_render`, duration, { error: error.message });
    throw error;
  }
}

// Track data loading operations
export function trackDataLoading(operationName, callback) {
  const dataLoadTrace = trace(perf, `${operationName}_data_load`);
  const startTime = performance.now();
  dataLoadTrace.start();
  
  try {
    const result = callback();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        dataLoadTrace.stop();
        const duration = performance.now() - startTime;
        logPerformanceMetric(`${operationName}_data_load`, duration);
      });
    } else {
      dataLoadTrace.stop();
      const duration = performance.now() - startTime;
      logPerformanceMetric(`${operationName}_data_load`, duration);
      return result;
    }
  } catch (error) {
    dataLoadTrace.stop();
    const duration = performance.now() - startTime;
    logPerformanceMetric(`${operationName}_data_load`, duration, { error: error.message });
    throw error;
  }
}

// Track user interactions
export function trackUserInteraction(interactionName, callback) {
  const interactionTrace = trace(perf, `${interactionName}_interaction`);
  const startTime = performance.now();
  interactionTrace.start();
  
  try {
    const result = callback();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        interactionTrace.stop();
        const duration = performance.now() - startTime;
        logPerformanceMetric(`${interactionName}_interaction`, duration);
      });
    } else {
      interactionTrace.stop();
      const duration = performance.now() - startTime;
      logPerformanceMetric(`${interactionName}_interaction`, duration);
      return result;
    }
  } catch (error) {
    interactionTrace.stop();
    const duration = performance.now() - startTime;
    logPerformanceMetric(`${interactionName}_interaction`, duration, { error: error.message });
    throw error;
  }
}

// Log performance metrics to Firestore
export async function logPerformanceMetric(operation, duration, details = {}) {
  try {
    await addDoc(collection(db, 'performance_metrics'), {
      operation,
      duration,
      details,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      path: window.location.pathname
    });
  } catch (error) {
    console.error('Error logging performance metric:', error);
  }
}

// Track app initialization
export function trackAppInitialization() {
  const appInitTrace = trace(perf, 'app_initialization');
  appInitTrace.start();
  
  window.addEventListener('load', () => {
    appInitTrace.stop();
    logPerformanceMetric('app_initialization', performance.now());
  });
}