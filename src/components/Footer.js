'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Facebook, Instagram, Twitter, Phone, 
  MessageCircle, Mail, Ghost, Video 
} from "lucide-react";

export default function Footer() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error("Footer load error:", err));
  }, []);

  const config = settings || {
    brand_name: "Loading...",
    brand_description: "",
  };

  return (
    <footer className="site-footer">
      <div className="glow-effect" />
      
      <div className="container">
        <div className="footer-grid">
          
          {/* Brand Info */}
          <div className="col-brand">
            <h2 className="brand-name">{config.brand_name}</h2>
            <p className="brand-desc">{config.brand_description}</p>
            
            <div className="contact-list">
              {config.email_address && (
                <div className="contact-item">
                  <Mail size={16} /> <span>{config.email_address}</span>
                </div>
              )}
              {config.helpline_number && (
                <div className="contact-item">
                  <Phone size={16} /> <span>{config.helpline_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-links">
            <h3>Shop</h3>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/cart">My Cart</Link></li>
              <li><Link href="/auth">login</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div className="col-links">
            <h3>Help</h3>
            <ul>
              <li><Link href="/shipping-policy">Shipping Policy</Link></li>
              <li><Link href="/returns">Returns</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="col-social">
            <h3>Follow Us</h3>
            <div className="social-row">
              {config.facebook_url && (
                <a href={config.facebook_url} target="_blank" className="social-btn fb"><Facebook size={20} /></a>
              )}
              {config.instagram_url && (
                <a href={config.instagram_url} target="_blank" className="social-btn insta"><Instagram size={20} /></a>
              )}
              {config.tiktok_url && (
                <a href={config.tiktok_url} target="_blank" className="social-btn tiktok"><Video size={20} /></a>
              )}
              {config.snapchat_url && (
                <a href={config.snapchat_url} target="_blank" className="social-btn snap"><Ghost size={20} /></a>
              )}
              {config.whatsapp_number && (
                <a href={`https://wa.me/${config.whatsapp_number}`} target="_blank" className="social-btn wa"><MessageCircle size={20} /></a>
              )}
            </div>
          </div>

        </div>
        
        <div className="copyright">
          © {new Date().getFullYear()} {config.brand_name}. All Rights Reserved.
        </div>
      </div>

      {/* ✅ FIXED: Using safe CSS injection to prevent hydration errors */}
      <style dangerouslySetInnerHTML={{__html: `
        .site-footer {
          background: #020617;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding: 80px 20px 20px;
          color: #94a3b8;
          position: relative;
          overflow: hidden;
          margin-top: auto;
        }
        .glow-effect {
          position: absolute;
          bottom: 0; left: 50%; transform: translateX(-50%);
          width: 60%; height: 200px;
          background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .container { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; }
        
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 40px;
          margin-bottom: 60px;
        }

        .brand-name { color: white; font-size: 1.5rem; margin-bottom: 16px; font-weight: 700; }
        .brand-desc { line-height: 1.6; margin-bottom: 24px; font-size: 0.95rem; }
        
        .contact-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: #cbd5e1; }
        
        .col-links h3, .col-social h3 { color: white; margin-bottom: 20px; font-size: 1.1rem; font-weight: 600; }
        .col-links ul { list-style: none; padding: 0; margin: 0; }
        .col-links li { margin-bottom: 12px; }
        .col-links a { color: #94a3b8; text-decoration: none; transition: 0.2s; }
        .col-links a:hover { color: #3b82f6; padding-left: 5px; }

        .social-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .social-btn {
          width: 42px; height: 42px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          color: white; border: 1px solid rgba(255,255,255,0.1);
          transition: 0.3s;
        }
        .social-btn:hover { transform: translateY(-3px); border-color: white; }
        
        .social-btn.fb:hover { background: #1877F2; border-color: #1877F2; }
        .social-btn.insta:hover { background: #E4405F; border-color: #E4405F; }
        .social-btn.wa:hover { background: #25D366; border-color: #25D366; }
        .social-btn.tiktok:hover { background: #ffffff; color: black; border-color: #fff; }
        .social-btn.snap:hover { background: #FFFC00; color: black; border-color: #FFFC00; }

        .copyright { text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; font-size: 0.85rem; }

        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
        }
      `}} />
    </footer>
  );
}