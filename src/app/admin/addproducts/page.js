'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, UploadCloud, X, Loader2, ChevronDown } from "lucide-react"; 
import WaterButton from "@/components/WaterButton";
import TopNav from "@/components/TopNav";

const CATEGORIES = [
  "Clothing", "Electronics", "Accessories", "Jewellery",
  "Skin Care", "Home & Garden", "Beauty", "Sports", "Others"
];

export default function AddProductPage() {
  const router = useRouter();
  
  // 🔐 1. AUTH STATE
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Form State
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);

  // 🔐 2. CHECK PERMISSION ON LOAD
  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();

        // If no user OR role is not admin -> Redirect
        if (!data.user || data.user.role !== 'admin') {
          router.push("/"); // Kick to home
          return;
        }

        // If Admin, allow access
        setUser(data.user);
      } catch (err) {
        console.error("Auth failed", err);
        router.push("/");
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAdmin();
  }, [router]);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "", 
    stock: "",
    rating: 4.5,
    images: [], 
    description: "",
    highlights: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function selectCategory(cat) {
    setFormData((prev) => ({ ...prev, category: cat }));
    setIsDropdownOpen(false);
  }

  // --- IMAGE UPLOAD HANDLERS ---
  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleFileSelect(e) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }

  function handleFiles(files) {
    const currentCount = formData.images.length;
    const newCount = files.length;

    if (currentCount + newCount > 5) {
      alert("You can only upload a maximum of 5 images per product.");
      return;
    }

    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, reader.result]
        }));
      };
    });
  }

  function removeImage(indexToRemove) {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  }

  // --- SUBMIT TO DATABASE ---
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    if (formData.images.length === 0) {
      alert("Please upload at least one image.");
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      highlights: formData.highlights.split(",").map(h => h.trim()).filter(h => h),
      category: formData.category || "Others",
      images: formData.images 
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create product");
      }
      
      router.push("/admin/products");
      router.refresh(); 
    } catch (error) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // 🔐 3. RENDER LOADER WHILE CHECKING
  if (checkingAuth) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader2 className="spin" size={40} color="#3b82f6" />
      </div>
    );
  }

  return (
    <div className="page">
      {/* 🔐 Pass user to TopNav so avatar shows */}
      <TopNav categories={[]} user={user} /> 

      <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '30px', marginTop: '20px' }}>
          <Link href="/admin/products">
            <button className="icon-btn" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)' }}>
              <ArrowLeft size={20} />
            </button>
          </Link>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Add New Product</h1>
        </div>

        <form className="panel" onSubmit={handleSubmit}>
          <div className="form-grid">
            
            {/* --- IMAGE SECTION --- */}
            <div style={{ gridColumn: '1 / -1', marginBottom: '20px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                Product Images 
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                  {formData.images.length} / 5 Uploaded
                </span>
              </label>

              {/* Upload Box */}
              {formData.images.length < 5 && (
                <div 
                  className={`drop-zone ${dragActive ? "active" : ""}`}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload').click()}
                  style={{ marginBottom: '16px' }}
                >
                  <input 
                    type="file" 
                    id="file-upload" 
                    multiple 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={handleFileSelect} 
                  />
                  <div>
                    <UploadCloud size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>
                      Click or Drag images here (Max 5)
                    </p>
                  </div>
                </div>
              )}

              {/* Image Preview Grid */}
              {formData.images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                  {formData.images.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={img} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={() => removeImage(idx)} 
                        style={{ 
                          position: 'absolute', top: '4px', right: '4px', 
                          background: 'rgba(0,0,0,0.7)', border: 'none', 
                          color: '#ff4d4d', borderRadius: '50%', 
                          width: '24px', height: '24px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}
                      >
                        <X size={14} />
                      </button>
                      {idx === 0 && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px 0' }}>
                          Main Cover
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inputs */}
            <div>
              <label>Product Name</label>
              <input name="name" required placeholder="e.g. Neon Cyber Jacket" value={formData.name} onChange={handleChange} />
            </div>

            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <label>Category</label>
              <button 
                type="button" 
                className="custom-select-trigger"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span style={{ color: formData.category ? '#fff' : '#94a3b8' }}>
                  {formData.category || "Select a category..."}
                </span>
                <ChevronDown size={16} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
              </button>

              {isDropdownOpen && (
                <div className="custom-options-list" style={{ zIndex: 10 }}>
                  {CATEGORIES.map((cat, idx) => (
                    <div 
                      key={`${cat}-${idx}`} 
                      className={`custom-option ${formData.category === cat ? 'selected' : ''}`} 
                      onClick={() => selectCategory(cat)}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', gridColumn: '1 / -1' }}>
              <div><label>Price ($)</label><input name="price" type="number" step="0.01" required placeholder="0.00" value={formData.price} onChange={handleChange} /></div>
              <div><label>Stock</label><input name="stock" type="number" required placeholder="0" value={formData.stock} onChange={handleChange} /></div>
              <div><label>Rating</label><input name="rating" type="number" step="0.1" max="5" value={formData.rating} onChange={handleChange} /></div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label>Highlights <span style={{fontSize:'0.8rem', opacity:0.6}}>(Comma separated)</span></label>
              <input name="highlights" placeholder="e.g. Waterproof, Lightweight" value={formData.highlights} onChange={handleChange} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <textarea name="description" rows="4" required placeholder="Product details..." value={formData.description} onChange={handleChange} />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
              <WaterButton variant="primary" type="submit" disabled={loading} style={{ minWidth: '160px' }}>
                {loading ? <Loader2 className="spin" size={18} /> : ( <> <Save size={18} style={{ marginRight: '8px' }} /> Save Product </> )}
              </WaterButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}