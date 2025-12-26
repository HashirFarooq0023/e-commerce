'use client';

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import WaterButton from "@/components/WaterButton";
import { 
  Loader2, Calendar, Filter, Package, MapPin, 
  ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, Settings 
} from "lucide-react";

export default function AdminOrdersPage() {
  const router = useRouter();
  
  // Auth & Loading
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Data
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null); 

  // Filter State
  const [activeFilter, setActiveFilter] = useState("all"); 
  const [customDates, setCustomDates] = useState({ start: "", end: "" });

  // 1. Stable Fetch Function
  const fetchOrders = useCallback(async (filterType, startDate = null, endDate = null) => {
    setLoading(true);
    setActiveFilter(filterType);
    
    try {
      let url = `/api/orders?filter=${filterType}`;
      if (filterType === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Auth Check & Initial Data
  useEffect(() => {
    async function init() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        
        if (!sessionData.user || sessionData.user.role !== 'admin') {
          router.push("/");
          return;
        }
        setUser(sessionData.user);
        fetchOrders("all"); 
      } catch (err) {
        console.error("Auth init error:", err);
        setLoading(false);
      }
    }
    init();
  }, [router, fetchOrders]);

  // 3. Status Update Handler
  async function handleUpdateStatus(orderId, newStatus) {
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
  
      if (res.ok) {
        fetchOrders(activeFilter); 
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || "Failed to update status"}`);
      }
    } catch (error) {
      console.error("Status update frontend error:", error);
      alert("Network error. Please try again.");
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#22c55e'; 
      case 'pending': return '#f59e0b';   
      case 'cancelled': return '#ef4444'; 
      default: return '#94a3b8';          
    }
  };

  if (!user && loading) return null; 

  return (
    <div className="page">
      <TopNav categories={[]} user={user} />

      <div className="container">
        
        <div className="header-section">
          <div>
            <h1>Orders Management</h1>
            <p className="subtitle">Track and update customer order statuses.</p>
          </div>
          <div className="total-badge">
            Total Orders: {orders.length}
          </div>
        </div>

        {/* FILTERS */}
        <div className="filters-panel">
          <div className="filter-group">
            <Filter size={18} className="filter-icon" />
            <span className="filter-label">Quick Filters:</span>
            <button className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => fetchOrders('all')}>All</button>
            <button className={`filter-btn ${activeFilter === 'today' ? 'active' : ''}`} onClick={() => fetchOrders('today')}>Today</button>
            <button className={`filter-btn ${activeFilter === 'week' ? 'active' : ''}`} onClick={() => fetchOrders('week')}>Week</button>
            <button className={`filter-btn ${activeFilter === 'month' ? 'active' : ''}`} onClick={() => fetchOrders('month')}>Month</button>
          </div>
          <div className="divider"></div>
          <form onSubmit={(e) => { e.preventDefault(); fetchOrders('custom', customDates.start, customDates.end); }} className="date-group">
            <Calendar size={18} className="filter-icon" />
            <input type="date" className="date-input" value={customDates.start} onChange={(e) => setCustomDates({...customDates, start: e.target.value})} />
            <input type="date" className="date-input" value={customDates.end} onChange={(e) => setCustomDates({...customDates, end: e.target.value})} />
            <WaterButton variant="primary" type="submit" style={{height: '36px', fontSize: '0.85rem'}}>Apply</WaterButton>
          </form>
        </div>

        <div className="orders-list">
          {loading ? (
            <div className="loading-state"><Loader2 className="spin" size={32} color="#3b82f6" /><p>Loading...</p></div>
          ) : orders.length === 0 ? (
            <div className="empty-state"><Package size={48} /><p>No orders found.</p></div>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th style={{textAlign: 'right'}}>Details</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const address = order.shipping_address || {};
                  const items = Array.isArray(order.items) ? order.items : [];

                  return (
                    <React.Fragment key={order.id}>
                      <tr className={`order-row ${isExpanded ? 'expanded' : ''}`} onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                        <td className="mono">#{order.id}</td>
                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="customer-cell">
                            <span className="name">{address.name || "Guest"}</span>
                          </div>
                        </td>
                        <td className="order-total">${Number(order.total_amount)}</td>
                        <td>
                          <span className="status-badge" style={{ color: getStatusColor(order.status), borderColor: getStatusColor(order.status) }}>
                            {order.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{textAlign: 'right'}}>{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</td>
                      </tr>

                      {isExpanded && (
                        <tr className="details-row">
                          <td colSpan="6" style={{ padding: 0 }}> {/* 🟢 Removed default padding here */}
                            <div className="details-wrapper"> {/* 🟢 New wrapper for animation/padding */}
                              <div className="details-container">
                                {/* 1. Items */}
                                <div className="detail-col">
                                  <h4><Package size={16} /> Items</h4>
                                  <ul className="item-list">
                                    {items.map((item, idx) => (
                                      <li key={idx}>
                                        <div className="item-thumb-wrapper">
                                          {item.image ? (
                                            <img src={item.image} alt="p" className="item-thumb" />
                                          ) : (
                                            <div className="item-thumb-placeholder" />
                                          )}
                                        </div>
                                        <div className="item-info">
                                          <span className="item-name">{item.name}</span>
                                          <span className="item-meta">Qty: {item.quantity}</span>
                                        </div>
                                        <div style={{ marginLeft: 'auto' }}>
                                           <span className="item-total">${(item.quantity * item.price).toFixed(2)}</span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                {/* 2. Shipping */}
                                <div className="detail-col">
                                  <h4><MapPin size={16} /> Shipping</h4>
                                  <div className="address-box">
                                    <p><strong>{address.name}</strong></p>
                                    <p>{address.house}, {address.street}</p>
                                    <p>{address.city}, {address.province}</p>
                                    <p style={{color: '#94a3b8'}}>{address.phone1}</p>
                                  </div>
                                </div>
                                {/* 3. Actions */}
                                <div className="detail-col actions-col">
                                  <h4><Settings size={16} /> Management</h4>
                                  <div className="action-buttons-stack">
                                    <button className="status-btn complete" onClick={() => handleUpdateStatus(order.id, 'completed')} disabled={order.status === 'completed'}>
                                      <CheckCircle size={14} /> Mark Completed
                                    </button>
                                    <button className="status-btn cancel" onClick={() => handleUpdateStatus(order.id, 'cancelled')} disabled={order.status === 'cancelled'}>
                                      <XCircle size={14} /> Cancel Order
                                    </button>
                                    <button className="status-btn reset" onClick={() => handleUpdateStatus(order.id, 'pending')} disabled={order.status === 'pending'}>
                                      <Clock size={14} /> Set Pending
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style jsx>{`
        .container { max-width: 1100px; margin: 0 auto; padding: 30px 20px; }
        .header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        h1 { margin: 0; font-size: 1.8rem; }
        .subtitle { color: #94a3b8; margin: 4px 0 0 0; }
        .total-badge { background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(59, 130, 246, 0.2); font-weight: 600; }
        .filters-panel { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 20px; margin-bottom: 30px; }
        .filter-group, .date-group { display: flex; align-items: center; gap: 10px; }
        .filter-label { font-size: 0.9rem; color: #94a3b8; font-weight: 500; }
        .filter-btn { background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); color: #cbd5e1; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }
        .filter-btn.active { background: #3b82f6; border-color: #3b82f6; color: white; }
        .date-input { background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); color: white; padding: 6px 10px; border-radius: 6px; outline: none; font-size: 0.8rem; }
        .divider { width: 1px; height: 24px; background: rgba(255, 255, 255, 0.1); }
        .orders-list { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; overflow: hidden; }
        .orders-table { width: 100%; border-collapse: collapse; }
        .orders-table th { text-align: left; padding: 16px; background: rgba(255, 255, 255, 0.03); color: #94a3b8; font-size: 0.9rem; }
        .order-row { border-bottom: 1px solid rgba(255, 255, 255, 0.05); cursor: pointer; }
        .order-row:hover { background: rgba(255, 255, 255, 0.03); }
        .order-row td { padding: 16px; vertical-align: middle; } /* Ensure vertical alignment */
        
        /* DETAILS ROW STYLING */
        .details-row td { background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .details-wrapper { padding: 24px; animation: slideDown 0.2s ease-out; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        .details-container { 
          display: grid; 
          grid-template-columns: 1.5fr 1fr 0.8fr; /* Adjusted proportions */
          gap: 40px; 
          align-items: start;
        }

        .detail-col h4 { margin: 0 0 16px 0; color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; display: flex; align-items: center; gap: 8px; }
        
        /* Item List Styling */
        .item-list { list-style: none; padding: 0; margin: 0; }
        .item-list li { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .item-list li:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        
        .item-thumb-wrapper { width: 48px; height: 48px; border-radius: 6px; overflow: hidden; background: #000; flex-shrink: 0; }
        .item-thumb { width: 100%; height: 100%; object-fit: cover; }
        .item-thumb-placeholder { width: 100%; height: 100%; background: #333; }
        
        .item-info { display: flex; flex-direction: column; gap: 2px; }
        .item-name { font-size: 0.9rem; font-weight: 500; color: white; }
        .item-meta { font-size: 0.8rem; color: #94a3b8; }
        .item-total { font-weight: 600; color: #e2e8f0; }

        .address-box p { margin: 4px 0; font-size: 0.9rem; line-height: 1.5; }
        .actions-col { border-left: 1px solid rgba(255,255,255,0.1); padding-left: 24px; }
        .action-buttons-stack { display: flex; flex-direction: column; gap: 10px; }
        .status-btn { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; cursor: pointer; font-size: 0.85rem; transition: 0.2s; width: 100%; justify-content: flex-start; }
        .status-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .status-btn.complete:hover:not(:disabled) { background: rgba(34, 197, 94, 0.2); border-color: #22c55e; color: #22c55e; }
        .status-btn.cancel:hover:not(:disabled) { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #ef4444; }
        .status-btn.reset:hover:not(:disabled) { background: rgba(59, 130, 246, 0.2); border-color: #3b82f6; color: #3b82f6; }

        /* Other Styles */
        .order-total { font-weight: bold; color: white; }
        .mono { font-family: monospace; color: #64748b; }
        .customer-cell .name { font-weight: 500; color: #e2e8f0; }
        .status-badge { padding: 4px 10px; border-radius: 20px; border: 1px solid; font-size: 0.7rem; font-weight: 700; }
        .loading-state, .empty-state { text-align: center; padding: 60px; color: #64748b; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        @media (max-width: 900px) { 
          .details-container { grid-template-columns: 1fr; gap: 24px; } 
          .actions-col { border-left: none; padding-left: 0; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; } 
        }
      `}</style>
    </div>
  );
}