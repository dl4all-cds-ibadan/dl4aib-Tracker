"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import { IcMenu, IcUsers, IcPlus, IcTrash, IcLock, IcCheck, IcX } from "@/components/Icons";
import { LogoMark } from "@/components/AppLogo";
import { getUsers, createUser, deleteUser, changeUserPassword } from "@/lib/actions";
import { User } from "@/lib/types";

function ManageUsers() {
  const { isSuperAdmin, initialized } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [showPass, setShowPass] = useState<string | null>(null);

  // Forms
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "", role: "ADMIN" as "SUPERADMIN" | "ADMIN" });
  const [passForm, setPassForm] = useState({ password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialized) return;
    if (!isSuperAdmin) { router.push("/admin/dashboard"); return; }
    load();
  }, [isSuperAdmin, initialized, router]);

  async function load() {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  }

  const handleAdd = async () => {
    setError("");
    if (!addForm.name || !addForm.email || !addForm.password) {
      setError("All fields are required.");
      return;
    }
    setSaving(true);
    const res = await createUser({
      name: addForm.name,
      email: addForm.email,
      passwordPlain: addForm.password,
      role: addForm.role
    });
    
    if (res.success) {
      await load();
      setShowAdd(false);
    } else {
      setError(res.error || "Failed to create user");
    }
    setSaving(false);
  };

  const handlePassword = async () => {
    if (!showPass || !passForm.password) return;
    setSaving(true);
    try {
      await changeUserPassword(showPass, passForm.password);
      setShowPass(null);
    } catch {
      setError("Failed to change password. Please check your connection.");
    }
    setSaving(false);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}? They will lose access immediately.`)) return;
    try {
      await deleteUser(user.id);
      await load();
    } catch {
      alert("Failed to delete user.");
    }
  };

  if (!initialized || !isSuperAdmin) return null;

  return (
    <div>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Add Admin Modal */}
      {showAdd && (
        <div onClick={() => setShowAdd(false)} style={{
          position:"fixed", inset:0, zIndex:999, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(3px)",
          display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem",
        }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ width:"100%", maxWidth:"400px" }}>
            <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div><div className="section-title">Add Admin</div></div>
              <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-sm" style={{ padding:"0.25rem 0.5rem" }}><IcX size={16} /></button>
            </div>
            <div className="card-body" style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
              {error && <div className="alert alert-error" style={{ padding:"0.625rem 0.875rem", fontSize:"0.8125rem" }}>{error}</div>}
              
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Full Name</label>
                <input className="form-input" value={addForm.name} onChange={e => { setAddForm(p => ({...p, name: e.target.value})); setError(""); }} />
              </div>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={addForm.email} onChange={e => { setAddForm(p => ({...p, email: e.target.value})); setError(""); }} />
              </div>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Role</label>
                <select className="form-input" value={addForm.role} onChange={e => setAddForm(p => ({...p, role: e.target.value as any}))}>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Temporary Password</label>
                <input className="form-input" type="password" value={addForm.password} onChange={e => { setAddForm(p => ({...p, password: e.target.value})); setError(""); }} />
              </div>

              <div style={{ display:"flex", gap:"0.5rem", justifyContent:"flex-end", paddingTop:"0.25rem" }}>
                <button onClick={() => setShowAdd(false)} className="btn btn-secondary btn-sm" disabled={saving}>Cancel</button>
                <button onClick={handleAdd} className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPass && (
        <div onClick={() => setShowPass(null)} style={{
          position:"fixed", inset:0, zIndex:999, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(3px)",
          display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem",
        }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ width:"100%", maxWidth:"360px" }}>
            <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div><div className="section-title">Change Password</div></div>
              <button onClick={() => setShowPass(null)} className="btn btn-ghost btn-sm" style={{ padding:"0.25rem 0.5rem" }}><IcX size={16} /></button>
            </div>
            <div className="card-body" style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
              {error && <div className="alert alert-error" style={{ padding:"0.625rem 0.875rem", fontSize:"0.8125rem" }}>{error}</div>}
              
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" value={passForm.password} onChange={e => { setPassForm({password: e.target.value}); setError(""); }} />
              </div>

              <div style={{ display:"flex", gap:"0.5rem", justifyContent:"flex-end", paddingTop:"0.25rem" }}>
                <button onClick={() => setShowPass(null)} className="btn btn-secondary btn-sm" disabled={saving}>Cancel</button>
                <button onClick={handlePassword} className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? "Saving..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-content">
        <header className="app-header">
          <div className="logo-area">
            <button onClick={() => setSidebarOpen(true)} style={{ background:"rgba(255,255,255,0.07)", border:"none", color:"white", width:"34px", height:"34px", borderRadius:"var(--r-md)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <IcMenu size={16} />
            </button>
            <LogoMark size={32} />
            <div className="logo-text">
              <h1>DL4AIB</h1>
              <p>User Management</p>
            </div>
          </div>
        </header>
        
        <div className="page-wrapper">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div className="page-title">Admin Users</div>
              <div className="page-subtitle">Manage dashboard access for admins</div>
            </div>
            <button onClick={() => { setShowAdd(true); setError(""); setAddForm({name:"", email:"", password:"", role:"ADMIN"}); }} className="btn btn-primary">
              <IcPlus size={15} /> Add User
            </button>
          </div>
          
          <div className="card">
            {loading ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--gray-400)" }}>Loading users...</div>
            ) : (
              <div className="table-wrapper">
                 <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600, color: "var(--gray-900)" }}>{u.name}</td>
                        <td style={{ color: "var(--gray-500)" }}>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === "SUPERADMIN" ? "badge-blue" : "badge-gray"}`}>{u.role}</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button onClick={() => { setShowPass(u.id); setError(""); setPassForm({password:""}); }} className="btn btn-secondary btn-xs" title="Change Password">
                              <IcLock size={13} /> Password
                            </button>
                            {u.role !== "SUPERADMIN" && (
                              <button onClick={() => handleDelete(u)} className="btn btn-ghost btn-xs" style={{ color: "var(--red-600)" }}>
                                <IcTrash size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                 </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  return <AuthProvider><ManageUsers /></AuthProvider>;
}
