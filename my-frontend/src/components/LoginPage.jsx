import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // .env'den al, fallback localhost:5000
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      return setError("Kullanıcı adı ve şifre gereklidir.");
    }

    try {
      const response = await fetch(`${API_URL}/api/Auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return setError(`Hata: ${errText || response.status}`);
      }

      const data = await response.json(); // beklenen: { token } (+ opsiyonel role,name)
      if (!data?.token) {
        return setError("Sunucudan beklenen 'token' alanı gelmedi.");
      }

      // Uygulama state + localStorage
      setToken(data.token);
      localStorage.setItem("token", data.token);

      // Eğer backend role/nickname vs gönderiyorsa:
      // if (data.role) localStorage.setItem("role", String(data.role));
      // if (data.name) localStorage.setItem("name", String(data.name));

      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Giriş sırasında hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div style={{ maxWidth: "320px", margin: "100px auto", textAlign: "center" }}>
      <h2>🔐 Giriş Yap</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Kullanıcı Adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        <button type="submit" style={{ width: "100%" }}>Giriş</button>
      </form>
      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
    </div>
  );
}

export default LoginPage;
