import { createContext, useContext, useEffect, useState } from "react";
import { AuthAPI } from "../api/auth.api";
import { initSocket, disconnectSocket } from "../utils/socket";
import { useRef } from "react";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const retryTimeoutRef = useRef(null);

  const meFetchedRef = useRef(false);
  const socketConnectedRef = useRef(false);

  const refreshUser = async () => {
    if (meFetchedRef.current) return;
    meFetchedRef.current = true;

    try {
      const u = await AuthAPI.me();
      setUser(u);

      if (!socketConnectedRef.current) {
        initSocket();
        socketConnectedRef.current = true;
      }
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401) {
        retryTimeoutRef.current = setTimeout(async () => {
          try {
            const u = await AuthAPI.me();
            setUser(u);
          } catch {
            localStorage.removeItem("token");
            disconnectSocket();

            meFetchedRef.current = false;
            socketConnectedRef.current = false;

            setUser(null);
          } finally {
            setReady(true);
          }
        }, 800);
        return;
      }
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      refreshUser();
    } else {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const login = async (data) => {
    const res = await AuthAPI.login(data);
    localStorage.setItem("token", res.token);

    meFetchedRef.current = false;
    socketConnectedRef.current = false;

    await refreshUser();
  };

  const signup = async (data) => {
    const res = await AuthAPI.signup(data);
    localStorage.setItem("token", res.token);

    meFetchedRef.current = false;
    socketConnectedRef.current = false;

    await refreshUser();
  };

  const logout = () => {
    localStorage.removeItem("token");
    disconnectSocket();

    meFetchedRef.current = false;
    socketConnectedRef.current = false;

    setUser(null);
    setReady(true);
  };

  return (
    <AuthContext.Provider
      value={{ user, ready, login, signup, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
