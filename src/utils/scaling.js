// src/utils/scaling.js
// import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
// import { db } from '../firebase';

// Simple memory cache
const memoryCache = {
  cache: {},
  set(key, value, ttl = 5 * 60 * 1000) { // Default 5 minutes TTL
    this.cache[key] = {
      value,
      expiry: Date.now() + ttl
    };
  },
  get(key) {
    const item = this.cache[key];
    
    // Return null if item doesn't exist or is expired
    if (!item || item.expiry < Date.now()) {
      delete this.cache[key];
      return null;
    }
    
    return item.value;
  },
  clear() {
    this.cache = {};
  }
};

// // Get upcoming events efficiently with caching
// export async function getUpcomingEvents(userId, limitCount = 10) {
//   const cacheKey = `upcoming_events_${userId}_${limitCount}`;
  
//   // Try to get from cache first
//   const cachedData = memoryCache.get(cacheKey);
//   if (cachedData) {
//     return cachedData;
//   }
  
//   // If not in cache, fetch from Firestore
//   const now = new Date();
  
//   const eventsRef = collection(db, 'schedules');
//   const q = query(
//     eventsRef,
//     where('userId', '==', userId),
//     where('date', '>=', now.toISOString().split('T')[0]),
//     orderBy('date'),
//     orderBy('scheduleTime'),
//     limit(limitCount)
//   );
  
//   const snapshot = await getDocs(q);
//   const events = snapshot.docs.map(doc => ({
//     id: doc.id,
//     ...doc.data()
//   }));
  
//   // Store in cache for 5 minutes
//   memoryCache.set(cacheKey, events);
  
//   return events;
// }

// // Get events for a specific date with caching
// export async function getEventsForDate(userId, date) {
//   const dateString = date instanceof Date ? date.toISOString().split('T')[0] : date;
//   const cacheKey = `events_${userId}_${dateString}`;
  
//   // Try to get from cache first
//   const cachedData = memoryCache.get(cacheKey);
//   if (cachedData) {
//     return cachedData;
//   }
  
//   // If not in cache, fetch from Firestore
//   const eventsRef = collection(db, 'schedules');
//   const q = query(
//     eventsRef,
//     where('userId', '==', userId),
//     where('date', '==', dateString),
//     orderBy('scheduleTime')
//   );
  
//   const snapshot = await getDocs(q);
//   const events = snapshot.docs.map(doc => ({
//     id: doc.id,
//     ...doc.data()
//   }));
  
//   // Store in cache for 5 minutes
//   memoryCache.set(cacheKey, events);
  
//   return events;
// }

// Invalidate cache for a specific user
export function invalidateUserCache(userId) {
  // Get all cache keys
  const keys = Object.keys(memoryCache.cache);
  
  // Filter keys that belong to this user
  const userKeys = keys.filter(key => key.includes(`_${userId}_`));
  
  // Delete these keys from cache
  userKeys.forEach(key => {
    delete memoryCache.cache[key];
  });
}

export { memoryCache };