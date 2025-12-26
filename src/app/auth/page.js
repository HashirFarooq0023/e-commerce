'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopNav from "../../components/TopNav"; 
import WaterButton from "../../components/WaterButton";
import { Loader2, Mail, Lock, User, LogOut, ArrowRight, CheckCircle } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [loading, setLoading] = useState(false); 
  const [success, setSuccess] = useState(false); 
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.user) setCurrentUser(data.user);
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, []);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      setSuccess(true);
      setTimeout(() => { router.push("/"); router.refresh(); }, 1500);
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth", { method: "DELETE" });
      setCurrentUser(null);
      router.refresh();
      setFormData({ email: "", password: "", name: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="page center-content">
        <Loader2 className="spin" size={40} color="#3b82f6" />
      </div>
    );
  }

  return (
    <div className="page">
      <TopNav user={currentUser} categories={[]} />
      
      <main className="auth-main">
        <section className="panel auth-panel">
          
          {/* SCENARIO A: ALREADY LOGGED IN (Enhanced Card UI) */}
          {currentUser ? (
            <div className="logged-in-card">
              
              {/* Top Section: Avatar + Text aligned in Row */}
              <div className="profile-header">
                <div className="avatar-wrapper">
                  <div className="avatar-circle">
                    <User size={36} strokeWidth={1.5} />
                  </div>
                  <div className="status-dot"></div>
                </div>
                
                <div className="profile-details">
                  <p className="welcome-label">Welcome back,</p>
                  <h2 className="user-name">{currentUser.name || "Valued User"}</h2>
                  <p className="user-email">{currentUser.email}</p>
                </div>
              </div>

              <div className="divider"></div>

              {/* Bottom Section: Actions */}
              <div className="action-buttons">
                <WaterButton 
                  variant="primary" 
                  onClick={() => router.push("/")}
                  className="w-full"
                  style={{ height: '50px', fontSize: '1rem' }}
                >
                  Continue to Store <ArrowRight size={18} style={{marginLeft: 8}}/>
                </WaterButton>
                
                <WaterButton 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="w-full"
                  disabled={loading}
                  style={{ color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.15)', height: '44px' }}
                >
                  {loading ? <Loader2 className="spin" size={18} /> : <><LogOut size={18} style={{marginRight: 8}}/> Log Out</>}
                </WaterButton>
              </div>
            </div>
          ) : (
            
            /* SCENARIO B: FORM */
            <>
              {success ? (
                <div className="success-view">
                  <div className="success-icon-bg">
                    <CheckCircle size={56} color="#22c55e" />
                  </div>
                  <h2>Login Successful!</h2>
                  <p className="subtitle">Taking you to the store...</p>
                  <div className="loading-bar">
                    <div className="loading-fill"></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="panel-header">
                    <h2>Welcome</h2>
                    <p className="subtitle">
                      Login or register automatically below.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="auth-stack">
                    <div className="input-group">
                      <label>Email Address :</label>
                      <div className="input-wrapper">
                        <input type="email" name="email" placeholder="name@example.com" required value={formData.email} onChange={handleChange} />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Password :</label>
                      <div className="input-wrapper">
                        <input type="password" name="password" placeholder="••••••••" required minLength={6} value={formData.password} onChange={handleChange} />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Full Name <span style={{opacity: 0.5}}>(Optional)</span></label>
                      <div className="input-wrapper">
                        <input type="text" name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} />
                      </div>
                    </div>

                    {error && <div className="error-box">{error}</div>}

                    <WaterButton variant="primary" type="submit" className="w-full" disabled={loading} style={{ justifyContent: 'center', marginTop: '12px', height: '50px' }}>
                      {loading ? <><Loader2 className="spin" size={20} style={{ marginRight: 8 }} /> Authenticating...</> : "Continue"}
                    </WaterButton>
                  </form>
                </>
              )}
            </>
          )}

        </section>
      </main>

      <style jsx>{`
        .center-content { display: flex; align-items: center; justify-content: center; height: 100vh; }
        .w-full { width: 100%; }

        /* --- CARD STYLING --- */
        .logged-in-card {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          background: linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 32px 24px;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 20px;
          text-align: left;
        }

        /* Avatar */
        .avatar-wrapper { position: relative; }
        .avatar-circle {
          width: 68px;
          height: 68px;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(59, 130, 246, 0.25);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
        }
        .status-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          background: #22c55e;
          border: 3px solid #0f172a; /* Matches dark bg */
          border-radius: 50%;
        }

        /* Text Details */
        .profile-details { flex: 1; }
        .welcome-label {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
          margin: 0 0 4px 0;
          font-weight: 600;
        }
        .user-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f8fafc;
          margin: 0;
          line-height: 1.1;
        }
        .user-email {
          color: #64748b;
          font-size: 0.95rem;
          margin: 4px 0 0 0;
          font-family: monospace; /* Nice touch for emails */
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          margin: 24px 0;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* --- SUCCESS VIEW --- */
        .success-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 0;
          animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .success-icon-bg {
          margin-bottom: 24px;
          filter: drop-shadow(0 0 15px rgba(34, 197, 94, 0.3));
        }
        .loading-bar {
          width: 100%;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          margin-top: 24px;
          overflow: hidden;
        }
        .loading-fill {
          height: 100%;
          background: #3b82f6;
          width: 0%;
          animation: loadBar 1.5s ease-in-out forwards;
        }

        /* --- INPUTS --- */
        .input-group { margin-bottom: 20px; text-align: left; }
        .input-group label { display: block; margin-bottom: 8px; font-size: 0.9rem; color: #cbd5e1; font-weight: 500; }
        
        .input-wrapper { position: relative; }
        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }
        .input-wrapper input {
          width: 100%;
          height: 52px;
          padding: 0 16px 0 48px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: white;
          outline: none;
          transition: all 0.2s;
          font-size: 1rem;
        }
        .input-wrapper input:focus {
          border-color: #3b82f6;
          background: rgba(0,0,0,0.4);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .error-box {
          color: #ff6b6b;
          background: rgba(255,107,107,0.1);
          padding: 14px;
          border-radius: 8px;
          font-size: 0.9rem;
          margin-bottom: 16px;
          border: 1px solid rgba(255,107,107,0.2);
          text-align: center;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes popIn { 
          from { transform: scale(0.9); opacity: 0; } 
          to { transform: scale(1); opacity: 1; } 
        }
        @keyframes loadBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}