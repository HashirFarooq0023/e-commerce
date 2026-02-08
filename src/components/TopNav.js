'use client';

// ✅ FIXED IMPORTS: Added useEffect and useRef
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, User, Home, LayoutGrid, ChevronDown, Settings, List, Package, Users } from "lucide-react"; 
import ChatWidget from "./ChatWidget";

export default function TopNav({
  categories = [],
  selectedCategory,
  onSelectCategory,
  cartCount = 0,
  user,
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  
  // State for dropdowns
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 1. Create a Ref to track the navigation DOM element
  const navRef = useRef(null);

  // 2. Add Event Listener to detect clicks outside
  useEffect(() => {
    function handleClickOutside(event) {
      // If the nav exists and the click happened OUTSIDE of it
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsCatOpen(false);
        setIsAdminOpen(false);
        setIsChatOpen(false);
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  
  function handleSelect(category) {
    if (onSelectCategory) onSelectCategory(category);
    setIsCatOpen(false);
  }

  function getInitials(name) {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  // Define styles as an object
  const styles = {
    wrapper: {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      overflow: 'hidden',
    },
    initials: {
      width: '100%',
      height: '100%',
      background: '#3b82f6',
      color: 'white',
      fontSize: '10px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
    },
    img: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    }
  };

  return (
    // 3. Attach the ref to the main nav container
    <nav className="top-nav" ref={navRef}>
      {/* LEFT: Navigation */}
      <div className="nav-left">
        <Link href="/" className="logo">
          ShopLite
        </Link>

    

        <Link 
          href="/" 
          className={`nav-pill-btn ${isHome && !selectedCategory ? "active" : ""}`}
          onClick={() => handleSelect(null)}
        >
          <Home size={18} strokeWidth={2.5} />
          <span>Home</span>
        </Link>

        <div className="nav-dropdown-wrapper">
          <button 
            className={`nav-pill-btn ${selectedCategory ? "active" : ""} ${isCatOpen ? "open" : ""}`}
            onClick={() => { setIsCatOpen(!isCatOpen); setIsAdminOpen(false); }}
          >
            <LayoutGrid size={18} strokeWidth={2.5} />
            <span>Categories</span>
            <ChevronDown 
              size={14} 
              className="pill-caret" 
              style={{ transform: isCatOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} 
            />
          </button>
          
          <div className={`nav-dropdown-menu ${isCatOpen ? "open" : ""}`}>
            <div className="dropdown-arrow"></div>
            <button className={`dropdown-item ${!selectedCategory ? "active" : ""}`} onClick={() => handleSelect(null)}>
              All Products
            </button>
            <div className="dropdown-divider"></div>
            {categories && categories.length > 0 ? (
              categories.map((cat) => (
                <button key={cat} className={`dropdown-item ${selectedCategory === cat ? "active" : ""}`} onClick={() => handleSelect(cat)}>
                  {cat}
                </button>
              ))
            ) : (
              <div style={{ padding: '10px 14px', fontSize: '13px', color: '#666' }}>No categories</div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Actions + Admin */}
      <div className="nav-right">
        
      <div className="nav-dropdown-wrapper">
            <button 
              className={`icon-btn ${isChatOpen ? "active" : ""}`}
              onClick={() => { setIsChatOpen(!isChatOpen); setIsAdminOpen(false); setIsCatOpen(false); }}
              title="Chat with AI"
            >
              🤖
            </button>
            <ChatWidget isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
        </div>

        {/* Cart */}
        <Link href="/cart" className={`icon-btn ${pathname === "/cart" ? "active" : ""}`} title="Cart">
          <ShoppingBag size={20} strokeWidth={2.5} />
          {cartCount > 0 && <span className="icon-badge">{cartCount}</span>}
        </Link>

        {/* User Account / Auth */}
        <Link href="/auth" className={`icon-btn ${pathname === "/auth" ? "active" : ""}`} title="Account">
          {user ? (
            <div style={styles.wrapper}>
               {user.imageUrl ? (
                 <img src={user.imageUrl} alt="Profile" style={styles.img} />
               ) : (
                 <div style={styles.initials}>
                   {getInitials(user.name)}
                 </div>
               )}
            </div>
          ) : (
            <User size={20} strokeWidth={2.5} />
          )}
        </Link>

     

        {/* 🛡️ ADMIN MENU (ONLY SHOW IF ROLE IS ADMIN) */}
        {user && user.role === 'admin' && (
          <>
            <div className="nav-divider"></div>

            <div className="nav-dropdown-wrapper">
              <button 
                className={`nav-pill-btn ${isAdminOpen ? "active" : ""}`}
                onClick={() => { setIsAdminOpen(!isAdminOpen); setIsCatOpen(false); }}
                style={{ paddingLeft: '12px', paddingRight: '12px', color: '#facc15', borderColor: 'rgba(250, 204, 21, 0.2)' }}
              >
                <Settings size={18} strokeWidth={2.5} />
                <span>Admin</span>
                <ChevronDown 
                  size={14} 
                  className="pill-caret" 
                  style={{ transform: isAdminOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} 
                />
              </button>

              <div className={`nav-dropdown-menu admin-menu ${isAdminOpen ? "open" : ""}`}>
                <div className="dropdown-arrow" style={{ right: '20px', left: 'auto' }}></div>
                
                <div className="menu-header">Management</div>
                
                <Link href="/admin/products" className="dropdown-item" onClick={() => setIsAdminOpen(false)}>
                  <Package size={16} style={{ marginRight: '8px' }} />
                  Products
                </Link>

                <Link href="/admin/orders" className="dropdown-item" onClick={() => setIsAdminOpen(false)}>
                  <List size={16} style={{ marginRight: '8px' }} />
                  Orders
                </Link>

                <Link href="/admin/customers" className="dropdown-item" onClick={() => setIsAdminOpen(false)}>
                  <Users size={16} style={{ marginRight: '8px' }} />
                  Customers
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}