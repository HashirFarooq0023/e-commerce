'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import TopNav from "./TopNav"; 
import WaterButton from "./WaterButton";
import { Star, ShoppingCart, ArrowLeft, Check } from "lucide-react";

export default function ProductDetails({ product, user ,categories= []  }) {
  // State for Gallery and Cart
  const [activeImage, setActiveImage] = useState(product.image); 
  const [cartCount, setCartCount] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Helper: Create a safe array of images for the gallery
  const galleryImages = Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : [product.image];

  // 1. Load Cart Count on Mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.length);
    }
  }, []);

  // 2. Add to Cart Logic
  function addToCart() {
    if (typeof window === "undefined") return;

    const existing = JSON.parse(localStorage.getItem("cart") || "[]");
    const index = existing.findIndex((item) => item.id === product.id);

    let next;
    if (index > -1) {
      next = [...existing];
      next[index].quantity = (next[index].quantity || 1) + quantity;
    } else {
      next = [...existing, { ...product, quantity: quantity }];
    }

    localStorage.setItem("cart", JSON.stringify(next));
    setCartCount(next.length);
    
    // Quick success feedback animation
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  }

  return (
    <div className="product-details-wrapper page">
      <TopNav user={user} cartCount={cartCount} categories={categories}/>

      <div className="container">
        
        {/* Breadcrumb Navigation */}
        <div className="breadcrumb">
          <Link href="/" className="back-link">
            <ArrowLeft size={16} /> Back to Products
          </Link>
          <span className="crumb-separator">/</span>
          <span className="crumb-current">{product.category}</span>
        </div>

        <div className="details-grid">
          
          {/* LEFT: GALLERY SECTION */}
          <div className="gallery-section">
            <div className="main-image-frame">
              <img 
                src={activeImage || product.image || "https://placehold.co/600x400?text=No+Image"} 
                alt={product.name} 
              />
            </div>
            
            {galleryImages.length > 1 && (
              <div className="thumbnails">
                {galleryImages.map((img, idx) => (
                  <div 
                    key={idx} 
                    className={`thumb ${activeImage === img ? 'active' : ''}`}
                    onMouseEnter={() => setActiveImage(img)}
                    onClick={() => setActiveImage(img)}
                  >
                    <img src={img} alt={`view ${idx}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: INFO SECTION */}
          <div className="info-section">
            <div className="product-header">
              <span className="category-pill">{product.category}</span>
              <h1>{product.name}</h1>
              
              <div className="meta-row">
                <div className="rating-block">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        fill={i < Math.round(product.rating || 0) ? "#facc15" : "none"} 
                        stroke={i < Math.round(product.rating || 0) ? "#facc15" : "#64748b"} 
                      />
                    ))}
                  </div>
                  <span className="rating-text">({product.rating || "No"} reviews)</span>
                </div>
                
                {product.stock !== undefined && product.stock < 10 && (
                  <span className="stock-alert">Only {product.stock} left!</span>
                )}
              </div>

              <div className="price-tag">${Number(product.price).toFixed(2)}</div>
            </div>

            <div className="divider"></div>

            <div className="description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            {product.highlights && (
              <div className="highlights">
                <h3>Highlights</h3>
                <div className="chip-container">
                   {(Array.isArray(product.highlights) 
                      ? product.highlights 
                      : (product.highlights || "").split(',')
                   ).map((item, idx) => (
                     item && <span key={idx} className="chip">{item.trim()}</span>
                   ))}
                </div>
              </div>
            )}

            <div className="actions-panel">
              <div className="quantity-control">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>

              <WaterButton 
                variant="primary" 
                onClick={addToCart} 
                className={`add-btn ${isAdded ? 'success' : ''}`}
              >
                {isAdded ? <Check size={20} /> : <ShoppingCart size={20} />}
                {isAdded ? "Added" : "Add to Cart"}
              </WaterButton>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ FIX: Using standard <style> tag instead of <style jsx>.
        We scope styles using .product-details-wrapper to prevent conflicts.
      */}
      <style dangerouslySetInnerHTML={{__html: `
        .product-details-wrapper .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        
        .product-details-wrapper .breadcrumb { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; color: #64748b; font-size: 0.9rem; }
        .product-details-wrapper .back-link { display: flex; align-items: center; gap: 6px; color: #94a3b8; text-decoration: none; transition: 0.2s; }
        .product-details-wrapper .back-link:hover { color: white; }
        .product-details-wrapper .crumb-separator { color: #334155; }
        .product-details-wrapper .crumb-current { color: #e2e8f0; }

        .product-details-wrapper .details-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 60px; }
        
        /* Gallery */
        .product-details-wrapper .main-image-frame { 
          width: 100%; aspect-ratio: 1; background: #000; border-radius: 16px; 
          overflow: hidden; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 16px; 
          position: relative; display: flex; align-items: center; justify-content: center;
        }
        .product-details-wrapper .main-image-frame img { width: 100%; height: 100%; object-fit: contain; }

        .product-details-wrapper .thumbnails { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; }
        .product-details-wrapper .thumb { 
          aspect-ratio: 1; border-radius: 8px; overflow: hidden; cursor: pointer; 
          border: 2px solid transparent; opacity: 0.6; transition: 0.2s; background: #111; 
        }
        .product-details-wrapper .thumb.active, .product-details-wrapper .thumb:hover { border-color: #3b82f6; opacity: 1; }
        .product-details-wrapper .thumb img { width: 100%; height: 100%; object-fit: cover; }

        /* Info */
        .product-details-wrapper .category-pill { display: inline-block; background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; margin-bottom: 16px; }
        .product-details-wrapper h1 { font-size: 2.5rem; margin: 0 0 12px 0; line-height: 1.1; color: white; }
        
        .product-details-wrapper .meta-row { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
        .product-details-wrapper .rating-block { display: flex; align-items: center; gap: 8px; }
        .product-details-wrapper .rating-text { color: #94a3b8; font-size: 0.9rem; }
        .product-details-wrapper .stock-alert { color: #ef4444; font-size: 0.85rem; font-weight: 600; }

        .product-details-wrapper .price-tag { font-size: 2.2rem; font-weight: 700; color: #22c55e; margin-bottom: 10px; }

        .product-details-wrapper .divider { height: 1px; background: rgba(255,255,255,0.1); margin: 30px 0; }

        .product-details-wrapper .description h3, .product-details-wrapper .highlights h3 { font-size: 1.1rem; color: #e2e8f0; margin-bottom: 10px; font-weight: 600; }
        .product-details-wrapper .description p { color: #94a3b8; line-height: 1.7; margin-bottom: 30px; }

        .product-details-wrapper .chip-container { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 30px; }
        .product-details-wrapper .chip { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 6px 14px; border-radius: 8px; font-size: 0.85rem; color: #cbd5e1; }

        /* Actions */
        .product-details-wrapper .actions-panel { display: flex; gap: 16px; align-items: stretch; height: 54px; }
        
        .product-details-wrapper .quantity-control { 
          display: flex; align-items: center; background: rgba(255,255,255,0.05); 
          border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0 10px; 
        }
        .product-details-wrapper .quantity-control button { background: none; border: none; color: white; font-size: 1.2rem; width: 32px; height: 100%; cursor: pointer; }
        .product-details-wrapper .quantity-control span { width: 30px; text-align: center; font-weight: 600; }

        .product-details-wrapper .add-btn { flex: 1; font-size: 1.1rem; gap: 10px; }
        .product-details-wrapper .add-btn.success { background: #22c55e; border-color: #22c55e; }

        @media (max-width: 900px) {
          .product-details-wrapper .details-grid { grid-template-columns: 1fr; gap: 30px; }
          .product-details-wrapper h1 { font-size: 2rem; }
        }
      `}} />
    </div>
  );
}