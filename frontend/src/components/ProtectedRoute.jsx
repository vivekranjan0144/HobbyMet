import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CircularProgress, Box } from "@mui/material";

export default function ProtectedRoute({ children, redirectTo = "/" }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const hasToken = Boolean(localStorage.getItem("token"));

  if (ready && !user && !hasToken) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children;
}
