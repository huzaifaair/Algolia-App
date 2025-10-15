import React, { useState, useEffect } from 'react';
import { personalizedSearch, captureEvent, getUserId } from './services/analytics';
import SearchBar from './components/SearchBar';
import ProductList from './components/ProductList';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const id = getUserId();
    setUserId(id);
    console.log('User ID:', id);
  }, []);

  const handleSearch = async (searchQuery) => {
    setQuery(searchQuery);
    setLoading(true);
    
    try {
      const searchResults = await personalizedSearch(searchQuery);
      setResults(searchResults.hits || []);
      
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = async (product, position) => {
    await captureEvent('Product Clicked', {
      ...product,
      position: position,
      query: query
    });
    
    // Yahan aap product detail page pe redirect kar sakte hain
    console.log('Product clicked:', product.name);
    // window.location.href = `/product/${product.objectID}`;
  };

  const handleAddToCart = async (product) => {
    await captureEvent('Added to Cart', product);
    console.log('Added to cart:', product.name);
    // Yahan aap cart logic implement kar sakte hain
  };

  const handleAddToWishlist = async (product, added) => {
    console.log(added ? 'Added to wishlist:' : 'Removed from wishlist:', product.name);
    // Yahan aap wishlist logic implement kar sakte hain
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🔍 Personalized E-Commerce Search</h1>
        <p className="user-info">User ID: <span className="user-id">{userId}</span></p>
      </header>

      <main className="app-main">
        <SearchBar 
          onSearch={handleSearch}
          loading={loading}
        />
        
        <ProductList
          products={results}
          loading={loading}
          searchQuery={query}
          onProductClick={handleProductClick}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
        />
      </main>
    </div>
  );
}

export default App;