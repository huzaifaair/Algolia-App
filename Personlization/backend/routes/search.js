// routes/search.js - FIXED WITH SHARED EVENTS
import express from 'express';
import { userEvents } from './analytics.js'; // ✅ Import shared events

const router = express.Router();

router.post('/personalized-search', async (req, res) => {
  try {
    console.log('📥 Search request received:', req.body);
    
    const { userId, query = '', page = 0, hitsPerPage = 20 } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Algolia index check
    const index = req.app.get('algoliaIndex');
    if (!index) {
      return res.status(500).json({ 
        error: 'Search service temporarily unavailable' 
      });
    }

    // ✅ NOW USING SHARED EVENTS
    const userActivity = userEvents.get(userId) || [];
    console.log(`🔍 User ${userId} has ${userActivity.length} events`);
    
    // Show recent events for debugging
    if (userActivity.length > 0) {
      console.log('🔍 Recent events:', userActivity.slice(-3));
    }

    // Determine search query
    let searchQuery = query.trim();
    let searchType = 'normal';
    
    if (!searchQuery) {
      searchType = 'for_you';
      
      // ✅ SIMPLE FOR YOU LOGIC
      if (userActivity.length > 0) {
        // Get most recent product name
        const recentProduct = userActivity[userActivity.length - 1].productName;
        console.log(`🎯 Most recent product: "${recentProduct}"`);
        
        // Extract simple keyword
        if (recentProduct.toLowerCase().includes('shoe')) {
          searchQuery = 'shoes';
        } else if (recentProduct.toLowerCase().includes('shirt')) {
          searchQuery = 'shirts';  
        } else if (recentProduct.toLowerCase().includes('pant')) {
          searchQuery = 'pants';
        } else {
          searchQuery = recentProduct.split(' ')[0] || ''; // First word
        }
        
        console.log(`🎯 For You search: "${searchQuery}"`);
      } else {
        searchQuery = '';
        console.log('🎯 For You: No activity, showing popular products');
      }
    }
    
    console.log(`🔍 Final search query: "${searchQuery}"`);

    // Algolia search
    const searchResults = await index.search(searchQuery, {
      page: page,
      hitsPerPage: hitsPerPage,
      clickAnalytics: true,
      userToken: userId,
      attributesToRetrieve: ['objectID', 'name', 'price', 'category', 'image'],
      attributesToHighlight: []
    });

    console.log(`✅ Search successful: ${searchResults.hits.length} results`);

    // Show what we got
    if (searchResults.hits.length > 0) {
      console.log('📦 First 3 results categories:');
      searchResults.hits.slice(0, 3).forEach((hit, index) => {
        console.log(`  ${index + 1}. ${hit.category?.name || 'No category'}`);
      });
    }

    const response = {
      hits: searchResults.hits,
      nbHits: searchResults.nbHits,
      page: searchResults.page,
      nbPages: searchResults.nbPages,
      personalization: {
        userId: userId,
        originalQuery: query,
        searchType: searchType,
        actualQueryUsed: searchQuery,
        recentActivity: userActivity.length,
        personalized: true
      }
    };

    res.json(response);
    
  } catch (error) {
    console.error('❌ Search error:', error.message);
    res.status(500).json({ 
      error: 'Search failed',
      message: error.message
    });
  }
});

export default router;