import React from 'react';
import ProductCard from './ProductCard';

const ProductList = ({ 
  products, 
  onProductClick, 
  onAddToCart, 
  onAddToWishlist,
  loading = false,
  searchQuery = ''
}) => {
  
  if (loading) {
    return (
      <div className="product-list loading">
        <div className="loading-spinner"></div>
        <p>Searching for products...</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="product-list empty">
        <div className="empty-state">
          <h3>No products found</h3>
          <p>Try adjusting your search terms or browse different categories.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-list">
      <div className="results-header">
        <h2>
          Search Results for "{searchQuery}"
          <span className="results-count"> ({products.length} products)</span>
        </h2>
        
        <div className="results-actions">
          <select className="sort-select" defaultValue="relevance">
            <option value="relevance">Sort by Relevance</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>
      </div>

      <div className="products-grid">
        {products.map((product, index) => (
          <ProductCard
            key={product.objectID || product.id}
            product={product}
            position={index + 1}
            searchQuery={searchQuery}
            onProductClick={onProductClick}
            onAddToCart={onAddToCart}
            onAddToWishlist={onAddToWishlist}
          />
        ))}
      </div>

      {/* Load more button (agar pagination ho) */}
      {products.length >= 20 && (
        <div className="load-more-section">
          <button className="load-more-button">
            Load More Products
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductList;