// app.js - Fixed version
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import algoliasearch from 'algoliasearch';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname define karo ES modules ke liye
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env file load karo with explicit path
const envPath = path.join(__dirname, '.env');
console.log('🔧 Loading .env from:', envPath);

dotenv.config({ path: envPath });

// Environment variables check karo
console.log('🔧 Environment Variables Check:');
console.log('ALGOLIA_APP_ID:', process.env.ALGOLIA_APP_ID ? '✅ Loaded' : '❌ Missing');
console.log('ALGOLIA_API_KEY:', process.env.ALGOLIA_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('ALGOLIA_INDEX_NAME:', process.env.ALGOLIA_INDEX_NAME ? '✅ Loaded' : '❌ Missing');
console.log('PORT:', process.env.PORT || '5000 (default)');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Algolia client initialize with error handling
let client, index;
try {
  if (!process.env.ALGOLIA_APP_ID || !process.env.ALGOLIA_API_KEY) {
    throw new Error('Algolia credentials missing in environment variables');
  }

  client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY);
  index = client.initIndex(process.env.ALGOLIA_INDEX_NAME || 'products-stg-copy-1');
  
  console.log('✅ Algolia client initialized successfully');
} catch (error) {
  console.error('❌ Algolia initialization failed:', error.message);
  // Fallback - app still run karega without Algolia
}

// Global access ke liye
app.set('algoliaIndex', index);
app.set('algoliaClient', client);

// Routes import
import analyticsRoutes from './routes/analytics.js';
import searchRoutes from './routes/search.js';

// Test route - environment variables dikhane ke liye
app.get('/api/env-check', (req, res) => {
  res.json({
    algoliaAppId: process.env.ALGOLIA_APP_ID ? 'Set' : 'Missing',
    algoliaApiKey: process.env.ALGOLIA_API_KEY ? 'Set' : 'Missing', 
    algoliaIndex: process.env.ALGOLIA_INDEX_NAME || 'products-stg-copy-1',
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);

// Algolia connection test route
app.get('/api/test-algolia', async (req, res) => {
  try {
    if (!index) {
      return res.status(500).json({ 
        error: 'Algolia not initialized - check environment variables' 
      });
    }

    const testResults = await index.search('', { hitsPerPage: 1 });
    
    res.json({
      success: true,
      message: 'Algolia connection successful',
      totalProducts: testResults.nbHits,
      index: process.env.ALGOLIA_INDEX_NAME
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Algolia search failed',
      message: error.message
    });
  }
});

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is running!',
    algolia: index ? 'Connected' : 'Not connected'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔧 Test environment: http://localhost:${PORT}/api/env-check`);
  console.log(`🔧 Test Algolia: http://localhost:${PORT}/api/test-algolia`);
});