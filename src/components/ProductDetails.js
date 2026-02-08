'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import TopNav from "./TopNav"; 
import WaterButton from "./WaterButton";
import { 
  Star, ShoppingCart, ArrowLeft, Check, Minus, Plus, 
  ShieldCheck, Truck, CreditCard, RotateCcw 
} from "lucide-react";
import TopRatedCarousel from "./TopRatedCarousel";

export default function ProductDetails({ product, user, categories = [], products = [] }) {
  
  const [activeImage, setActiveImage] = useState(product.image); 
  const [cartCount, setCartCount] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const galleryImages = Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : [product.image];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.length);
    }
  }, []);

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
    
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  }

  return (
    <div className="page-wrapper">
    
      {/* Subtle Glow (kept for depth, but subtle) */}
      <div className="ambient-glow" />

      <div className="main-container">
      <TopNav user={user} cartCount={cartCount} categories={categories}/>

        {/* Breadcrumb */}
        <div className="breadcrumb-nav">
          <Link href="/" className="back-link">
            <ArrowLeft size={18} />
            <span>Back to Collection</span>
          </Link>
        </div>

        <div className="product-layout">
          
          {/* LEFT: GALLERY (Sticky) */}
          <div className="gallery-column">
            <div className="hero-image-frame">
              <img 
                src={activeImage || product.image || "https://placehold.co/600x400?text=No+Image"} 
                alt={product.name} 
              />
            </div>
            
            {galleryImages.length > 1 && (
              <div className="thumbnail-strip">
                {galleryImages.map((img, idx) => (
                  <button 
                    key={idx} 
                    className={`thumb-btn ${activeImage === img ? 'active' : ''}`}
                    onClick={() => setActiveImage(img)}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: INFO (Open Layout) */}
          <div className="info-column">
            
            <div className="header-section">
              <span className="category-text">{product.category}</span>
              <h1 className="product-title">{product.name}</h1>
              
              <div className="rating-row">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      fill={i < Math.round(product.rating || 0) ? "#FCD34D" : "none"} 
                      stroke={i < Math.round(product.rating || 0) ? "none" : "#64748b"} 
                    />
                  ))}
                </div>
                <span className="rating-count">{product.rating} (120 reviews)</span>
              </div>
            </div>

            <div className="price-section">
              <span className="currency">PKR</span>
              <span className="amount">{Number(product.price).toLocaleString()}</span>
            </div>

            <div className="divider-line" />

            {/* TRUST BADGES ROW (Requested) */}
            <div className="trust-grid">
              <div className="trust-item">
                <div className="icon-box"><Truck size={18} /></div>
                <span>Fast Delivery</span>
              </div>
              <div className="trust-item">
                <div className="icon-box"><ShieldCheck size={18} /></div>
                <span>Authentic</span>
              </div>
              <div className="trust-item">
                <div className="icon-box"><CreditCard size={18} /></div>
                <span>Secure Pay</span>
              </div>
              <div className="trust-item">
                <div className="icon-box"><RotateCcw size={18} /></div>
                <span>Easy Returns</span>
              </div>
            </div>

            <div className="divider-line" />

            <div className="description-section">
              <h3>Description</h3>
              <p className="description-text">{product.description}</p>
            </div>

            {/* Highlights */}
            {product.highlights && (
              <div className="highlights-grid">
                {(Array.isArray(product.highlights) 
                  ? product.highlights 
                  : (product.highlights || "").split(',')
                ).map((item, idx) => (
                  <div key={idx} className="feature-item">
                    <Check size={16} className="check-icon" />
                    <span>{item.trim()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Area */}
            <div className="actions-section">
              <div className="quantity-stepper">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus size={16} />
                </button>
                <span className="qty-value">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>
                  <Plus size={16} />
                </button>
              </div>

              <div className="cta-wrapper">
                <WaterButton 
                  variant="primary" 
                  onClick={addToCart} 
                  className={`add-to-cart-btn ${isAdded ? 'success' : ''}`}
                >
                  {isAdded ? <Check size={20} /> : <ShoppingCart size={20} />}
                  <span>{isAdded ? "Added to Cart" : "Add to Cart"}</span>
                </WaterButton>
              </div>
            </div>

          </div>
        </div>

        {/* RELATED PRODUCTS */}
        <div className="related-section">
          <div className="section-title">
           
            <div className="title-line" />
          </div>
          <TopRatedCarousel products={products} />
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        /* --- Layout & Background --- */
        .page-wrapper {
          min-height: 50vh;
          background: #020617; 
          color: white;
          position: relative;
          overflow-x: hidden;
        }


        .ambient-glow {
          position: absolute;
          top: -10%;
          right: -10%;
          width: 60vw;
          height: 60vw;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 60%);
          filter: blur(120px);
          z-index: 0;
          pointer-events: none;
        }

        .main-container {
          max-width: 85%;
          margin: 30px auto;
       
          position: relative;
          z-index: 1;
        }

        /* --- Breadcrumbs --- */
        .breadcrumb-nav {
          margin-bottom: 40px;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
          font-size: 0.95rem;
        }
        .back-link:hover { color: white; }

        /* --- Layout Grid --- */
        .product-layout {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 80px;
          align-items: start;
        }

        /* --- LEFT: Gallery --- */
        .gallery-column {
          position: sticky;
          top: 100px;
        }

        .hero-image-frame {
          width: 100%;
          aspect-ratio: 1;
          /* No borders, just clean image floating */
          background: radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 70%);
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .hero-image-frame img {
          width: 90%;
          height: 90%;
          object-fit: contain;
          transition: transform 0.5s ease;
          filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));
        }
        .hero-image-frame:hover img {
          transform: scale(1.05);
        }

        .thumbnail-strip {
          display: flex;
          gap: 16px;
          margin-top: 24px;
          justify-content: center;
        }
        .thumb-btn {
          width: 70px;
          height: 70px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          cursor: pointer;
          padding: 8px;
          transition: all 0.2s;
        }
        .thumb-btn.active {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }
        .thumb-btn img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        /* --- RIGHT: Info (Clean, No Box) --- */
        .info-column {
          padding-top: 20px;
        }

        .category-text {
          color: #60a5fa;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 12px;
          display: block;
        }

        .product-title {
          font-size: 3rem;
          font-weight: 800;
          margin: 0 0 16px 0;
          line-height: 1.1;
          color: white;
          letter-spacing: -1px;
        }

        .rating-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .stars { display: flex; gap: 4px; }
        .rating-count { color: #94a3b8; font-size: 0.95rem; }

        .price-section {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 24px;
        }
        .price-section .currency {
          font-size: 1.2rem;
          font-weight: 600;
          color: #94a3b8;
          margin-top: 8px;
        }
        .price-section .amount {
          font-size: 3.5rem;
          font-weight: 700;
          color: #4ade80;
          line-height: 1;
        }

        /* --- Dividers --- */
        .divider-line {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          width: 100%;
          margin: 32px 0;
        }

        /* --- TRUST BADGES --- */
        .trust-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .trust-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
        }
        .icon-box {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }
        .trust-item span {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* --- Description --- */
        .description-section h3 {
          font-size: 1.2rem;
          color: white;
          margin: 0 0 12px 0;
        }
        .description-text {
          color: #cbd5e1;
          line-height: 1.8;
          font-size: 1.05rem;
          margin: 0;
        }

        /* --- Highlights --- */
        .highlights-grid {
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(2, 1fr); /* 2 columns for better readability */
          gap: 12px;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #e2e8f0;
          font-size: 0.95rem;
        }
        .check-icon { color: #4ade80; flex-shrink: 0; }

        /* --- Actions --- */
        .actions-section {
          margin-top: 40px;
          display: flex;
          gap: 20px;
          height: 60px;
        }

        .quantity-stepper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50px;
          padding: 4px;
          width: 140px;
        }
        .quantity-stepper button {
          width: 48px;
          height: 100%;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .quantity-stepper button:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .qty-value {
          font-weight: 700;
          font-size: 1.2rem;
        }

        .cta-wrapper { flex: 1; }
        .add-to-cart-btn {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 50px !important; /* Pill shape */
        }
        .add-to-cart-btn.success {
          background: #22c55e !important;
          border-color: #22c55e !important;
        }

        /* --- Related Section --- */
        .related-section {
          margin-top: 120px;
          padding-top: 40px;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 40px;
        }
        .section-title h3 {
          font-size: 2rem;
          font-weight: 700;
          color: white;
          margin: 0;
          white-space: nowrap;
        }
        .title-line {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          width: 100%;
        }

        /* --- Responsive --- */
        @media (max-width: 900px) {
          .product-layout {
            grid-template-columns: 1fr;
            gap: 50px;
          }
          .gallery-column { position: static; }
          .product-title { font-size: 2.2rem; }
          .price-section .amount { font-size: 2.8rem; }
          .trust-grid { grid-template-columns: repeat(2, 1fr); }
          .actions-section { flex-direction: column; height: auto; }
          .quantity-stepper { width: 100%; height: 56px; margin-bottom: 16px; }
          .add-to-cart-btn { height: 56px; }
        }
      `}} />
    </div>
  );
}