"use client";

import { useEffect, useState } from "react";

const emptyForm = {
  username: "",
  info: "",
  email: "",
  contact: "",
};

export default function HomePage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false); // avoid hydration mismatch

  const apiHost =
    process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3001";

  // Mark as mounted (client side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load users from API
  useEffect(() => {
    if (!mounted) return;

    const fetchUsers = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${apiHost}/users`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to load users (status ${res.status})`);
        }

        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [apiHost, mounted]);

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`${apiHost}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        let message = "Failed to create user";
        try {
          const errBody = await res.json();
          if (errBody && errBody.error) {
            message = errBody.error;
          }
        } catch (_) {}
        throw new Error(message);
      }

      const created = await res.json();
      // Add new user at top of list
      setUsers((prev) => [created, ...prev]);
      setForm(emptyForm);
    } catch (err) {
      setError(err.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  // Don’t render until mounted (fix hydration issues)
  if (!mounted) return null;

  return (
    <main className="page">
      <header className="header">
        <h1 className="title">User Contact Form</h1>
        <p className="subtitle">
          Submit basic user info and see it saved from the database.
        </p>
      </header>

      <section className="card form-card">
        <h2 className="card-title">Add New User</h2>
        <p className="card-subtitle">
          Fill in the details and click &quot;Save User&quot;.
        </p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Username</span>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              required
            />
          </label>

          <label className="field">
            <span>Gmail</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. john@gmail.com"
              required
            />
          </label>

          <label className="field">
            <span>Contact</span>
            <input
              name="contact"
              value={form.contact}
              onChange={handleChange}
              placeholder="e.g. 089-xxx-xxxx"
              required
            />
          </label>

          <label className="field field-full">
            <span>Information</span>
            <textarea
              name="info"
              value={form.info}
              onChange={handleChange}
              placeholder="Short note about this person"
              rows={3}
            />
          </label>

          <div className="actions">
            <button className="btn" disabled={submitting}>
              {submitting ? "Saving..." : "Save User"}
            </button>
          </div>
        </form>

        {error && <p className="error">Error: {error}</p>}
      </section>

      <section className="card list-card">
        <h2 className="card-title">Saved Users</h2>

        {loading ? (
          <p>Loading users…</p>
        ) : users.length === 0 ? (
          <p className="muted">No users yet. Add one above.</p>
        ) : (
          <ul className="user-list">
            {users.map((u) => (
              <li key={u.id} className="user-item">
                <h3>{u.username}</h3>
                <p className="muted">{u.info || "No extra information."}</p>
                <div className="user-meta">
                  <span>Email: {u.email}</span>
                  <span>Contact: {u.contact}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
