'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import TopNav from "./TopNav"; 
import WaterButton from "./WaterButton";

export default function ProductFeed({ initialProducts, user }) {
  const [products] = useState(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Cart State
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

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
    const total = cart.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity || 1),
      0
    );
    setCartTotal(total);
  }

  // 2. Add to Cart Function
  function addToCart(e, product) {
    // 🛑 Prevent the Link from triggering (so we don't change pages)
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

  // 3. Clear Cart Function
  function clearCart() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("cart");
    updateCartState([]);
  }

  // Scroll helper
  function scrollToProducts() {
    const el = document.querySelector(".products");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="page">
      <TopNav
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat === selectedCategory ? null : cat)}
        cartCount={cartCount}
        user={user}
      />

      {/* HERO SECTION */}
      <header className="hero">
        <div>
          <p className="eyebrow">Ecommerce Starter</p>
          <h1>Modern storefront with cart & checkout.</h1>
          <p className="subtext">
            Browse our collection, view product details, and manage your orders.
          </p>
          <div className="hero-actions">
            <WaterButton variant="primary" onClick={scrollToProducts}>
              Start Shopping
            </WaterButton>
            <WaterButton variant="ghost" onClick={clearCart}>
              Clear Cart
            </WaterButton>
          </div>
        </div>
        <div className="hero-stat">
          <div className="stat-card">
            <div className="stat-value">${cartTotal.toFixed(2)}</div>
            <div className="stat-label">Cart Total</div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="layout" style={{ display: 'block', maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* PRODUCT GRID */}
        <section className="panel products" style={{ width: '100%' }}>
          <div className="panel-header">
            <div>
              <h2>{selectedCategory ? `${selectedCategory} Products` : "All Products"}</h2>
              <p style={{color: '#94a3b8'}}>Browse the catalog and add items to your cart.</p>
            </div>
            <span className="pill" style={{background: 'rgba(255,255,255,0.1)', padding:'4px 12px', borderRadius:'12px'}}>
              {visibleProducts.length} items
            </span>
          </div>
          
          <div className="product-grid">
            {visibleProducts.map((product) => (
              /* 🔗 WRAP CARD IN LINK to go to Details Page */
              <Link 
                href={`/products/${product.id}`} 
                key={product.id}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <article className="product-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  
                  <div className="product-thumb">
                    <img src={product.image} alt={product.name} />
                    <span className="badge">{product.category}</span>
                  </div>
                  
                  <div className="product-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="product-top">
                      <h3>{product.name}</h3>
                      <span className="price">${Number(product.price).toFixed(2)}</span>
                    </div>

                    {/* Rating Mini-Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                      <span style={{ color: '#fbbf24' }}>★</span>
                      <span style={{ fontWeight: 600 }}>{product.rating || "N/A"}</span>
                      {product.stock !== undefined && product.stock < 10 && (
                        <span style={{ fontSize: '0.75rem', color: '#f87171', marginLeft: 'auto', background: 'rgba(248,113,113,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          Low Stock
                        </span>
                      )}
                    </div>

                    <p className="desc" style={{ marginBottom: '16px', flex: 1 }}>
                      {product.description ? product.description.substring(0, 60) + "..." : "No description"}
                    </p>
                    
                    {/* Add to Cart Button */}
                    <div style={{ marginTop: 'auto' }}>
                      <WaterButton
                        variant="primary"
                        className="block"
                        onClick={(e) => addToCart(e, product)} // Pass event to stop propagation
                      >
                        Add to cart
                      </WaterButton>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}