'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { Loader2, Search, Users, Mail, Calendar, Phone, MapPin } from "lucide-react";

export default function AdminCustomersPage() {
  const router = useRouter();

  // State
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 1. Auth & Data Fetching
  useEffect(() => {
    async function init() {
      try {
        // Check Session
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        
        if (!sessionData.user || sessionData.user.role !== 'admin') {
          router.push("/");
          return;
        }
        setUser(sessionData.user);

        // Fetch Customers
        const res = await fetch("/api/customers");
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);

      } catch (error) {
        console.error("Failed to load customers", error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  // 2. Search Filter (Updated to include Phone)
  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  // Helper: Format Date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  if (!user && loading) return null;

  return (
    <div className="page">
      <TopNav categories={[]} user={user} />

      <div className="container">
        
        {/* HEADER */}
        <div className="header-section">
          <div>
            <h1>Customers</h1>
            <p className="subtitle">View and search your registered users.</p>
          </div>
          <div className="total-badge">
            <Users size={16} />
            {customers.length} Total Users
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name, email, or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* CUSTOMERS TABLE */}
        <div className="table-panel">
          {loading ? (
            <div className="loading-state">
              <Loader2 className="spin" size={32} color="#3b82f6" />
              <p>Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <p>No customers found.</p>
            </div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Contact Info</th>
                    <th>Location</th>
                    <th>Joined</th>
                    <th style={{textAlign: 'center'}}>Orders</th>
                    <th style={{textAlign: 'right'}}>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      {/* Name & Avatar */}
                      <td>
                        <div className="user-cell">
                          <div className="avatar-placeholder">
                            {customer.name ? customer.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <span className="user-name">{customer.name || "Guest"}</span>
                        </div>
                      </td>

                      {/* Contact (Email + Phone) */}
                      <td>
                        <div className="contact-col">
                          <div className="icon-text">
                            <Mail size={14} /> {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="icon-text sub-text">
                              <Phone size={14} /> {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Location (City + Province) */}
                      <td>
                        {customer.city ? (
                          <div className="icon-text">
                            <MapPin size={14} /> 
                            {customer.city}, {customer.province}
                          </div>
                        ) : (
                          <span className="no-data">-</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td>
                        <div className="icon-text">
                          <Calendar size={14} /> {formatDate(customer.created_at)}
                        </div>
                      </td>

                      {/* Stats: Orders */}
                      <td style={{textAlign: 'center'}}>
                        <span className={`badge ${customer.total_orders > 0 ? 'active' : ''}`}>
                          {customer.total_orders}
                        </span>
                      </td>

                      {/* Stats: Spent */}
                      <td style={{textAlign: 'right', fontWeight: 600, color: '#22c55e'}}>
                        ${Number(customer.total_spent).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 30px 20px;
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        h1 { margin: 0; font-size: 1.8rem; }
        .subtitle { color: #94a3b8; margin: 4px 0 0 0; }

        .total-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          font-weight: 600;
          font-size: 0.9rem;
        }

        /* SEARCH */
        .search-wrapper {
          position: relative;
          margin-bottom: 20px;
        }
        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
        }
        .search-wrapper input {
          width: 100%;
          padding: 12px 12px 12px 44px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          outline: none;
          font-size: 1rem;
        }
        .search-wrapper input:focus {
          border-color: #3b82f6;
          background: rgba(255, 255, 255, 0.08);
        }

        /* TABLE */
        .table-panel {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow: hidden;
        }
        .custom-table {
          width: 100%;
          border-collapse: collapse;
        }
        .custom-table th {
          text-align: left;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .custom-table td {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
          font-size: 0.9rem;
        }
        .custom-table tr:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .user-cell { display: flex; align-items: center; gap: 12px; }
        .avatar-placeholder {
          width: 36px; 
          height: 36px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex; 
          align-items: center; 
          justify-content: center;
          font-weight: bold;
          font-size: 0.9rem;
        }
        .user-name { font-weight: 500; }
        
        .icon-text {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #cbd5e1;
        }
        .sub-text {
          margin-top: 4px;
          color: #94a3b8;
          font-size: 0.85rem;
        }
        .no-data { color: #64748b; font-style: italic; }

        .badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 12px;
          background: rgba(255,255,255,0.1);
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .badge.active {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 60px;
          color: #64748b;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}