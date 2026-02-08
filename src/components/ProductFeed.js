'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, ShoppingBag } from "lucide-react"; 
import TopNav from "./TopNav"; 
import WaterButton from "./WaterButton";
import TopRatedCarousel from "./TopRatedCarousel";

export default function ProductFeed({ initialProducts, user }) {
  const [products] = useState(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Cart State
  const [cartCount, setCartCount] = useState(0);

  // Derive unique categories
  const categories = [...new Set(products.map((p) => p.category))];

  // Filter products
  const visibleProducts = !selectedCategory
    ? products
    : products.filter((p) => p.category === selectedCategory);

  // 1. Load Cart on Mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
      updateCartState(savedCart);
    }
  }, []);

  // Helper to calculate totals
  function updateCartState(cart) {
    setCartCount(cart.length);
  }

  // 2. Add to Cart Function
  function addToCart(e, product) {
    e.preventDefault(); 
    e.stopPropagation();

    if (typeof window === "undefined") return;
    
    const existing = JSON.parse(localStorage.getItem("cart") || "[]");
    const index = existing.findIndex((item) => item.id === product.id);

    let next;
    if (index > -1) {
      next = [...existing];
      next[index].quantity = (next[index].quantity || 1) + 1;
    } else {
      next = [...existing, { ...product, quantity: 1 }];
    }

    localStorage.setItem("cart", JSON.stringify(next));
    updateCartState(next);
  }

  return ( 
    <div className="page-wrapper">
   

      <main className="main-layout">
      <TopNav
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat === selectedCategory ? null : cat)}
        cartCount={cartCount}
        user={user}
      />
        {/* TOP RATED CAROUSEL */}
        <TopRatedCarousel products={products} />
        
        {/* PRODUCT GRID SECTION */}
        <section className="products-section">
          <div className="section-header">
            <div>
              <h2>{selectedCategory ? selectedCategory : "All Products"}</h2>
           
            </div>
            <span className="count-pill">
              {visibleProducts.length} items
            </span>
          </div>
          
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <Link 
                href={`/products/${product.id}`} 
                key={product.id}
                className="card-link"
              >
                <article className="glass-tile">
                  
                  {/* Image Area */}
                  <div className="tile-media">
                    <img src={product.image} alt={product.name} />
                    
                    {/* Floating Badges */}
                    <div className="badges-overlay">
                      <span className="category-badge">{product.category}</span>
                      {product.stock !== undefined && product.stock < 10 && (
                        <span className="stock-badge">Low Stock</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Content Area */}
                  <div className="tile-content">
                    <div className="tile-top">
                      <div className="name-row">
                        <h3>{product.name}</h3>
                        <div className="rating">
                          <Star size={14} fill="#fbbf24" stroke="none" />
                          <span>{product.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="tile-footer">
                      <div className="price-container">
                        <span className="currency">PKR</span>
                        <span className="amount">{Number(product.price).toLocaleString()}</span>
                      </div>
                      
                      <div className="action-wrapper">
                        <WaterButton
                          variant="primary"
                          className="compact-btn"
                          onClick={(e) => addToCart(e, product)}
                        >
                          <ShoppingBag size={16} />
                          <span className="btn-text">Add</span>
                        </WaterButton>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* ✅ FIXED: Using safe CSS injection */}
      <style dangerouslySetInnerHTML={{__html: `
        /* --- Page Layout --- */
        .page-wrapper {
          min-height: 100vh;
          background: #020617; /* Very Dark Slate (Almost Black) */
          color: white;
          position: relative;
          overflow-x: hidden;
        }

        .main-layout {
          max-width: 85%;
          margin: 30px auto;
        
        }

        /* --- Section Header --- */
        .products-section {
          margin-top: 50px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 32px;
          padding: 0 8px;
        }

        .section-header h2 {
          font-size: 2rem;
          color: white;
          margin: 0;
          font-weight: 700;
          letter-spacing: -0.5px;
          text-transform: capitalize;
        }

        .section-subtitle {
          color: #94a3b8;
          margin: 4px 0 0 0;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .count-pill {
          background: rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.85rem;
          backdrop-filter: blur(10px);
        }

        /* --- Grid Layout --- */
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
        }

        /* --- The Glass Tile --- */
        .card-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .glass-tile {
          background: rgba(30, 41, 59, 0.4); /* Deep transparent blue */
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .glass-tile:hover {
          transform: translateY(-6px);
          background: rgba(30, 41, 59, 0.6);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.4);
        }

        /* --- Image Area --- */
        .tile-media {
          position: relative;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          background: #000;
        }

        .tile-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .glass-tile:hover .tile-media img {
          transform: scale(1.08);
        }

        .badges-overlay {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          gap: 6px;
        }

        .category-badge {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stock-badge {
          background: rgba(239, 68, 68, 0.8);
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 20px;
        }

        /* --- Content Area --- */
        .tile-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
          justify-content: space-between;
          gap: 16px;
        }

        .name-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .tile-top h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          margin: 0;
          line-height: 1.4;
        }

        .rating {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 0.8rem;
          color: #e2e8f0;
          font-weight: 500;
        }

        /* --- Footer (Price & Button) --- */
        .tile-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .price-container {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .price-container .currency {
          font-size: 0.7rem;
          color: #94a3b8;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .price-container .amount {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.5px;
        }

        .action-wrapper {
          transform: translateY(0);
          transition: transform 0.2s;
        }

        /* Small interaction: button nudges up slightly on hover */
        .glass-tile:hover .action-wrapper {
          transform: scale(1.05);
        }

        .btn-text {
          font-size: 0.85rem;
          font-weight: 600;
        }

        /* --- Mobile Adjustments --- */
        @media (max-width: 600px) {
          .product-grid {
            grid-template-columns: 1fr; /* Single column on very small screens */
            gap: 20px;
          }
          
          .section-header h2 {
            font-size: 1.5rem;
          }
        }
      `}} />
    </div>
  );
}