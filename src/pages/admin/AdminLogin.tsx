import React, { useState } from "react";
import { API_ENDPOINTS } from "../../config/api";

export default function AdminLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const loginAdmin = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.admin.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      localStorage.setItem("admin_token", data.data.token);
      alert("Admin logged in!");
      window.location.href = "/admin";

    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Admin Login</h1>

      <input className="input" placeholder="Phone" onChange={(e) => setPhone(e.target.value)} />
      <input className="input" placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} />

      <button className="btn" onClick={loginAdmin}>Login</button>
    </div>
  );
}
