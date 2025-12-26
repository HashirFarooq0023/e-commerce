'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 1. Import Router for security
import { Edit, Trash2, Plus, Search, Loader2, ImageIcon } from "lucide-react";
import WaterButton from "@/components/WaterButton";
import TopNav from "@/components/TopNav";

export default function AdminProductsPage() {
  const router = useRouter();
  
  // 2. Add State for User
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 3. Check Session & Fetch Data
  useEffect(() => {
    async function init() {
      try {
        // A. Check Auth
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        
        if (!sessionData.user || sessionData.user.role !== 'admin') {
          // If not admin, kick them out
          router.push("/");
          return; 
        }
        
        setUser(sessionData.user);
        setAuthLoading(false);

        // B. Fetch Products (Only if authorized)
        const productRes = await fetch("/api/products");
        const productData = await productRes.json();
        setProducts(Array.isArray(productData) ? productData : []);

      } catch (error) {
        console.error("Initialization failed", error);
      } finally {
        setLoading(false);
        setAuthLoading(false);
      }
    }

    init();
  }, [router]);

  // 4. Filter Logic
  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  // 5. Delete Logic
  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const backup = [...products];
    setProducts(products.filter((p) => p._id !== id));

    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    } catch (error) {
      alert("Could not delete product.");
      setProducts(backup);
    }
  }

  // Show nothing or a loader while checking permission
  if (authLoading) return null; 

  return (
    <div className="page">
      {/* 6. Pass the fetched user to TopNav */}
      <TopNav categories={[]} user={user} />

      <div style={{ maxWidth: '1000px', margin: '0 auto', marginTop: '20px', paddingBottom: '40px' }}>
        
        {/* --- Header --- */}
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Inventory</h2>
            <p className="subtitle" style={{ margin: 0, opacity: 0.7 }}>Manage your store catalog</p>
          </div>
          
          <Link href="/admin/addproducts">
            <WaterButton variant="primary">
              <Plus size={18} style={{ marginRight: '8px' }} />
              Add Product
            </WaterButton>
          </Link>
        </div>

        {/* --- Search Bar --- */}
        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="Search products by name or category..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#fff',
              outline: 'none',
              fontSize: '1rem'
            }}
          />
        </div>

        {/* --- The Table Panel --- */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
              <Loader2 className="spin" size={32} style={{ marginBottom: '15px', margin: '0 auto' }} />
              <p>Loading inventory...</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'left' }}>
                    <th style={{ padding: '16px', fontWeight: 600 }}>Product</th>
                    <th style={{ padding: '16px', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '16px', fontWeight: 600 }}>Price</th>
                    <th style={{ padding: '16px', fontWeight: 600 }}>Stock</th>
                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="admin-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                      
                      {/* Name & Image */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover', background: '#333' }}
                            />
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, display: 'block', color: '#f8fafc' }}>{product.name}</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>ID: {product._id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '16px' }}>
                        <span className="chip" style={{ 
                          fontSize: '0.8rem', 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          background: 'rgba(255,255,255,0.1)', 
                          color: '#e2e8f0'
                        }}>
                          {product.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '16px', fontWeight: 600, color: '#f8fafc' }}>
                        ${Number(product.price).toFixed(2)}
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '16px' }}>
                        {product.stock === 0 ? (
                           <span style={{ color: '#ef4444', fontWeight: 500, fontSize: '0.9rem' }}>Out of Stock</span>
                        ) : (
                           <span style={{ color: product.stock < 10 ? '#f59e0b' : '#22c55e', fontSize: '0.9rem', fontWeight: 500 }}>
                             {product.stock} in stock
                           </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <Link href={`/admin/products/${product._id}`}> 
                            <button className="action-btn edit" title="Edit" style={{ 
                              background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', 
                              color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' 
                            }}>
                              <Edit size={16} />
                            </button>
                          </Link>
                          <button 
                            className="action-btn delete" 
                            onClick={() => handleDelete(product._id)}
                            title="Delete"
                            style={{ 
                              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', 
                              color: '#ef4444', padding: '6px', borderRadius: '6px', cursor: 'pointer' 
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                        <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                        <p>No products found matching your search.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}