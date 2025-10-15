import React, { useState } from 'react';
import { captureEvent } from '../services/analytics';

const SearchBar = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Search event capture
    await captureEvent('Search', { query });
    
    // Parent component ko query bhejo
    onSearch(query);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search for products, brands, categories..."
            className="search-input"
            disabled={loading}
          />
          
          {query && (
            <button 
              type="button"
              onClick={handleClear}
              className="clear-button"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={loading || !query.trim()}
          className="search-button"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Searching...
            </>
          ) : (
            <>
              🔍 Search
            </>
          )}
        </button>
      </form>

      {/* Popular searches suggestions */}
      <div className="search-suggestions">
        <span className="suggestions-label">Popular: </span>
        {['shirts', 'shoes', 'electronics', 'watches', 'bags'].map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              setQuery(suggestion);
              onSearch(suggestion);
            }}
            className="suggestion-tag"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;