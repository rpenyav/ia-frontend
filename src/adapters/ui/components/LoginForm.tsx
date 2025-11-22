// src/adapters/ui/react/auth/LoginForm.tsx
import { useState, type FormEvent } from "react";
import { useAuthContext } from "../../../infrastructure/contexts/AuthContext";

export const LoginForm = () => {
  const { login, loading, error } = useAuthContext();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login({ email, password });
  };

  return (
    <div className="iachat-login-container">
      <form className="iachat-login-form" onSubmit={handleSubmit}>
        <h2 className="iachat-login-title">Iniciar sesión</h2>

        <div className="iachat-login-field">
          <label htmlFor="iachat-email">Email</label>
          <input
            id="iachat-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@test.com"
            required
          />
        </div>

        <div className="iachat-login-field">
          <label htmlFor="iachat-password">Contraseña</label>
          <input
            id="iachat-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />
        </div>

        {error && <p className="iachat-login-error">{error}</p>}

        <button
          className="iachat-login-button"
          type="submit"
          disabled={loading}
        >
          {loading ? "Conectando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
};
