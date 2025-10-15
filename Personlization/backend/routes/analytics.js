// routes/analytics.js - SIMPLIFIED VERSION
import express from 'express';
const router = express.Router();

// User events storage (in-memory) - SHARED with search.js
export const userEvents = new Map();

router.post('/capture-event', async (req, res) => {
  try {
    const { userId, eventType, productId, productName, position, query } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // User ke events store karo
    if (!userEvents.has(userId)) {
      userEvents.set(userId, []);
    }

    const event = {
      eventType,
      productId,
      productName,
      position,
      query,
      timestamp: new Date().toISOString()
    };

    userEvents.get(userId).push(event);

    console.log(`📊 Event captured for user ${userId}: ${eventType}`);
    console.log(`📊 Total events for ${userId}: ${userEvents.get(userId).length}`);
    
    res.json({ 
      success: true, 
      message: 'Event captured',
      totalEvents: userEvents.get(userId).length 
    });
    
  } catch (error) {
    console.error('Error capturing event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user events
router.get('/user-events/:userId', (req, res) => {
  const { userId } = req.params;
  const events = userEvents.get(userId) || [];
  
  res.json({
    userId,
    totalEvents: events.length,
    events: events.slice(-10)
  });
});

export default router;