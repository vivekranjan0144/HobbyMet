import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

import Home from "../pages/Home/Home";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";

import Me from "../pages/user/Me";
import UpdateProfile from "../pages/user/UpdateProfile";
import UserProfile from "../pages/user/UserProfile";

import Explore from "../pages/explore/Explore";
import MyEvents from "../pages/events/MyEvents";
import MyRequests from "../pages/events/MyRequests";
import JoinedEvents from "../pages/events/JoinedEvents";

import { useAuth } from "../context/AuthContext";

export default function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={!user ? <Home /> : <Navigate to="/explore" replace />}
      />

      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/explore" replace />}
      />

      <Route
        path="/signup"
        element={!user ? <Signup /> : <Navigate to="/explore" replace />}
      />

      <Route
        path="/explore"
        element={
          <ProtectedRoute redirectTo="/">
            <Explore />
          </ProtectedRoute>
        }
      />

      <Route
        path="/me"
        element={
          <ProtectedRoute redirectTo="/">
            <Me />
          </ProtectedRoute>
        }
      />

      <Route
        path="/update-profile"
        element={
          <ProtectedRoute redirectTo="/">
            <UpdateProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users/:userId"
        element={
          <ProtectedRoute redirectTo="/">
            <UserProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-events"
        element={
          <ProtectedRoute redirectTo="/">
            <MyEvents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/joined-events"
        element={
          <ProtectedRoute redirectTo="/">
            <JoinedEvents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-requests"
        element={
          <ProtectedRoute redirectTo="/">
            <MyRequests />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
