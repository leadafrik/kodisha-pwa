import React, { useState } from "react";
import { API_ENDPOINTS } from "../../config/api";

export default function AdminLogin() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginAdmin = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.admin.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, email, password }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Login failed");

      localStorage.setItem("kodisha_admin_token", data.token);
      // Mirror admin token into user token so admin routes that use either will pass
      localStorage.setItem("kodisha_token", data.token);
      alert("Admin logged in!");
      window.location.href = "/admin";

    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-3">
      <h1 className="text-xl font-bold">Admin Login</h1>
      <p className="text-sm text-gray-600">Use phone or email plus password.</p>

      <input
        className="input w-full border rounded px-3 py-2"
        placeholder="Admin phone (optional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        className="input w-full border rounded px-3 py-2"
        placeholder="Admin email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
      />
      <input
        className="input w-full border rounded px-3 py-2"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="btn w-full bg-emerald-600 text-white py-2 rounded" onClick={loginAdmin}>
        Login
      </button>
    </div>
  );
}
