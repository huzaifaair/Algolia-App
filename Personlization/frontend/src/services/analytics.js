import axios from 'axios';

const API_BASE = '/api';

// User ID manage karo
export const getUserId = () => {
  let userId = localStorage.getItem('user_id');
  if (!userId) {
    userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('user_id', userId);
  }
  return userId;
};

// Event capture function
export const captureEvent = async (eventType, productData = {}) => {
  const userId = getUserId();
  
  const eventPayload = {
    userId: userId,
    eventType: eventType,
    productId: productData.objectID || productData.id,
    productName: productData.name || productData.title,
    position: productData.position,
    query: productData.query || ''
  };

  try {
    const response = await axios.post(`${API_BASE}/analytics/capture-event`, eventPayload);
    return response.data;
  } catch (error) {
    console.error('Error capturing event:', error);
  }
};

// Personalized search function
export const personalizedSearch = async (query, page = 0) => {
  const userId = getUserId();
  
  const searchPayload = {
    userId: userId,
    query: query,
    page: page,
    hitsPerPage: 20
  };

  try {
    const response = await axios.post(`${API_BASE}/search/personalized-search`, searchPayload);
    return response.data;
  } catch (error) {
    console.error('Error in personalized search:', error);
    throw error;
  }
};