import React, { useState } from 'react';
import { captureEvent } from '../services/analytics';

const ProductCard = ({ 
  product, 
  position, 
  searchQuery,
  onProductClick,
  onAddToCart,
  onAddToWishlist
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleProductClick = async () => {
    // Product click event capture
    await captureEvent('Product Clicked', {
      ...product,
      position: position,
      query: searchQuery
    });
    
    // Parent component ko inform karo
    if (onProductClick) {
      onProductClick(product, position);
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation(); // Parent click event ko prevent karo
    
    // Add to cart event capture
    await captureEvent('Added to Cart', {
      ...product,
      query: searchQuery
    });
    
    // Parent component ko inform karo
    if (onAddToCart) {
      onAddToCart(product);
    }
    
    // UI feedback (optional)
    const button = e.target;
    const originalText = button.textContent;
    button.textContent = '✅ Added!';
    button.disabled = true;
    
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 2000);
  };

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    
    const eventType = isWishlisted ? 'Remove from wishlist' : 'Added to wishlist';
    
    // Wishlist event capture
    await captureEvent(eventType, {
      ...product,
      query: searchQuery
    });
    
    // UI update
    setIsWishlisted(!isWishlisted);
    
    // Parent component ko inform karo
    if (onAddToWishlist) {
      onAddToWishlist(product, !isWishlisted);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Product data extract karo
  const productName = product.name || product.title || 'Unnamed Product';
  const productPrice = product.price || product.price_formatted || 'N/A';
  const productImage = product.image || product.image_url || product.thumbnail;
  const productCategory = product.category || product.category_name;
  const productBrand = product.brand || product.manufacturer;
  const productRating = product.rating || product.review_score;
  const productReviews = product.review_count || product.reviews_count;

  return (
    <div className="product-card" onClick={handleProductClick}>
      {/* Product Image */}
      <div className="product-image-container">
        {productImage && !imageError ? (
          <img 
            src={productImage} 
            alt={productName}
            className="product-image"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="product-image-placeholder">
            📷
          </div>
        )}
        
        {/* Wishlist Button */}
        <button 
          className={`wishlist-button ${isWishlisted ? 'wishlisted' : ''}`}
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {isWishlisted ? '❤️' : '🤍'}
        </button>

        {/* Sale Badge (agar sale ho) */}
        {product.on_sale && (
          <div className="sale-badge">Sale</div>
        )}
      </div>

      {/* Product Info */}
      <div className="product-info">
        {/* Category */}
        {productCategory && (
          <p className="product-category">{productCategory}</p>
        )}

        {/* Product Name */}
        <h3 className="product-title" title={productName}>
          {productName}
        </h3>

        {/* Brand */}
        {productBrand && (
          <p className="product-brand">by {productBrand}</p>
        )}

        {/* Rating */}
        {productRating && (
          <div className="product-rating">
            <span className="stars">{"⭐".repeat(Math.floor(productRating))}</span>
            <span className="rating-value">({productRating})</span>
            {productReviews && (
              <span className="review-count">({productReviews} reviews)</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="product-price-section">
          <span className="current-price">${productPrice}</span>
          
          {product.original_price && product.original_price !== productPrice && (
            <span className="original-price">${product.original_price}</span>
          )}
          
          {product.discount_percent && (
            <span className="discount-badge">-{product.discount_percent}%</span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button 
          className="add-to-cart-button"
          onClick={handleAddToCart}
        >
          🛒 Add to Cart
        </button>

        {/* Additional Info */}
        <div className="product-meta">
          {product.in_stock !== undefined && (
            <span className={`stock-status ${product.in_stock ? 'in-stock' : 'out-of-stock'}`}>
              {product.in_stock ? '✅ In Stock' : '❌ Out of Stock'}
            </span>
          )}
          
          {product.free_shipping && (
            <span className="shipping-info">🚚 Free Shipping</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;