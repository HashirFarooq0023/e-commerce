'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav"; 
import WaterButton from "@/components/WaterButton"; 
import Link from "next/link";
import { Trash2, MapPin, Phone, User, Home, ArrowRight, Loader2 } from "lucide-react";

// 🇵🇰 Pakistan Data for Dropdowns
const PROVINCES = [
  "Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", 
  "Islamabad Capital Territory", "Gilgit-Baltistan", "Azad Kashmir"
];

const CITIES = [
  "Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Gujranwala", "Peshawar", "Multan", 
  "Hyderabad", "Islamabad", "Quetta", "Bahawalpur", "Sargodha", "Sialkot", "Sukkur", 
  "Larkana", "Sheikhupura", "Rahim Yar Khan", "Jhang", "Dera Ghazi Khan", "Gujrat"
];

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // State for categories
  const [categories, setCategories] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone1: "",
    phone2: "",
    house: "",
    street: "",
    area: "",
    city: "",
    province: "",
    landmark: "", 
  });

  // 1. Load Data
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // A. Load Cart
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(savedCart);
    calculateTotal(savedCart);

    // B. Load User Session
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setFormData(prev => ({ ...prev, name: data.user.name || "" }));
        }
      })
      .catch(() => {});

    // C. Fetch Categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(err => console.error("Failed to load categories", err));

  }, []);

  function calculateTotal(items) {
    const sum = items.reduce((acc, item) => acc + (Number(item.price) * (item.quantity || 1)), 0);
    setTotal(sum);
  }

  function updateQuantity(id, newQty) {
    if (newQty < 1) return;
    const nextCart = cart.map(item => item._id === id ? { ...item, quantity: newQty } : item);
    setCart(nextCart);
    localStorage.setItem("cart", JSON.stringify(nextCart));
    calculateTotal(nextCart);
  }

  function removeItem(id) {
    const nextCart = cart.filter(item => item._id !== id);
    setCart(nextCart);
    localStorage.setItem("cart", JSON.stringify(nextCart));
    calculateTotal(nextCart);
  }

  function handleInputChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setLoading(true);

    const orderData = {
      items: cart,
      totalAmount: total,
      shippingAddress: formData,
      customerName: formData.name,
      userId: user?.id || "guest", 
      email: user?.email || formData.email || "guest@example.com",
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        localStorage.removeItem("cart");
        setCart([]);
        alert("✅ Order Placed Successfully!");
        router.push("/"); 
      } else {
        alert("Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const cartCount = cart.length;
  return (
    <div className="page">
      <TopNav cartCount={cartCount} user={user} categories={categories} />
      
      <main className="layout" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        
        <h1 style={{ fontSize: '2rem', marginBottom: '20px', fontWeight: 'bold' }}>Checkout</h1>

        {cart.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '60px' }}>
            <p className="muted" style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Your cart is empty.</p>
            <Link href="/">
              <WaterButton variant="primary">Browse Products</WaterButton>
            </Link>
          </div>
        ) : (
          <div className="checkout-grid">
            
            {/* LEFT COLUMN: CART ITEMS */}
            <section className="panel cart-section">
              <div className="panel-header">
                <h3>Order Summary</h3>
                <span className="pill">{cartCount} Items</span>
              </div>

              <div className="cart-list">
                {cart.map((item) => (
                  <div key={item._id} className="cart-row-enhanced">
                    <div className="cart-img-wrapper">
                      <img src={item.image} alt={item.name} />
                    </div>

                    <div className="cart-info">
                      <h4>{item.name}</h4>
                      <p className="muted">{item.category}</p>
                      <div className="price-tag">${Number(item.price).toFixed(2)}</div>
                    </div>

                    <div className="cart-controls">
                      <div className="qty-selector">
                        <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                      </div>
                      <button className="delete-btn" onClick={() => removeItem(item._id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-footer">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="total-row grand-total">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </section>

            {/* RIGHT COLUMN: SHIPPING FORM */}
            <section className="panel form-section">
              <div className="panel-header">
                <h3>Shipping Details</h3>
                <MapPin size={20} style={{ opacity: 0.7 }} />
              </div>

              <form onSubmit={handlePlaceOrder} className="shipping-form">
                
                <h4 className="form-heading"><User size={16}/> Contact Information</h4>
                <div className="form-group">
                  <label>Full Name</label>
                  <input name="name" required placeholder="Ali Khan" value={formData.name} onChange={handleInputChange} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number 1</label>
                    <input name="phone1" required type="tel" placeholder="0300-1234567" value={formData.phone1} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Phone Number 2 <span className="muted-label">(Optional)</span></label>
                    <input name="phone2" type="tel" placeholder="Secondary number" value={formData.phone2} onChange={handleInputChange} />
                  </div>
                </div>

                <h4 className="form-heading" style={{marginTop: '20px'}}><Home size={16}/> Delivery Address</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>House / Office No.</label>
                    <input name="house" required placeholder="H# 123, Block A" value={formData.house} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Street / Road</label>
                    <input name="street" required placeholder="Main Boulevard" value={formData.street} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Area / Society</label>
                  <input name="area" required placeholder="DHA, Gulberg, etc." value={formData.area} onChange={handleInputChange} />
                </div>

                {/* 🟢 FIXED DROPDOWN ROW */}
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input list="cities" name="city" required placeholder="Select or type city" value={formData.city} onChange={handleInputChange} />
                    <datalist id="cities">
                      {CITIES.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>

                  <div className="form-group">
                    <label>Province</label>
                    <input list="provinces" name="province" required placeholder="Select or type province" value={formData.province} onChange={handleInputChange} />
                    <datalist id="provinces">
                      {PROVINCES.map(p => <option key={p} value={p} />)}
                    </datalist>
                  </div>
                </div>

                <div className="form-group">
                  <label>Address Note / Landmark</label>
                  <textarea name="landmark" rows="2" placeholder="Near famous park, blue gate, etc." value={formData.landmark} onChange={handleInputChange}></textarea>
                </div>

                <WaterButton variant="primary" type="submit" className="w-full submit-btn" disabled={loading}>
                  {loading ? <Loader2 className="spin" /> : <>Place Order <ArrowRight size={18} /></>}
                </WaterButton>

              </form>
            </section>

          </div>
        )}
      </main>

      <style jsx>{`
        .checkout-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 900px) { .checkout-grid { grid-template-columns: 1fr; } }
        
        /* Cart Styling */
        .cart-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
        .cart-row-enhanced { display: flex; align-items: center; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .cart-img-wrapper { width: 70px; height: 70px; border-radius: 8px; overflow: hidden; background: #000; flex-shrink: 0; }
        .cart-img-wrapper img { width: 100%; height: 100%; object-fit: cover; }
        .cart-info { flex: 1; }
        .cart-info h4 { margin: 0; font-size: 1rem; font-weight: 600; }
        .price-tag { color: #3b82f6; font-weight: bold; margin-top: 4px; }
        .cart-controls { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
        .qty-selector { display: flex; align-items: center; background: rgba(255,255,255,0.05); border-radius: 6px; overflow: hidden; }
        .qty-selector button { background: transparent; border: none; color: white; width: 24px; height: 24px; cursor: pointer; }
        .qty-selector button:hover { background: rgba(255,255,255,0.1); }
        .qty-selector span { font-size: 0.9rem; padding: 0 8px; }
        .delete-btn { background: transparent; border: none; color: #ef4444; cursor: pointer; opacity: 0.7; transition: 0.2s; }
        .delete-btn:hover { opacity: 1; }
        
        .cart-footer { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.95rem; color: #94a3b8; }
        .grand-total { font-size: 1.2rem; color: white; font-weight: bold; margin-top: 12px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.1); }
        
        /* Form Styling */
        .shipping-form { display: flex; flex-direction: column; gap: 16px; }
        .form-heading { margin: 0 0 12px 0; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 0.85rem; color: #cbd5e1; }
        .muted-label { opacity: 0.5; font-size: 0.75rem; }
        .form-group input, .form-group textarea { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 10px 12px; border-radius: 8px; font-size: 0.95rem; outline: none; transition: border 0.2s; }
        .form-group input:focus, .form-group textarea:focus { border-color: #3b82f6; background: rgba(0,0,0,0.5); }
        
        .submit-btn { margin-top: 10px; justify-content: center; height: 48px; font-size: 1rem; }
        .w-full { width: 100%; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}