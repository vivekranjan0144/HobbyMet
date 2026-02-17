import { Button as MUIButton, useTheme, CircularProgress } from "@mui/material";

export default function Button({
  children,
  variant = "contained",
  full = true,
  loading = false,
  sx = {},
  ...props
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const styles = {
    contained: {
      padding: "0.75rem 1.8rem",
      borderRadius: "10rem",
      fontSize: "1rem",
      fontWeight: 700,
      textTransform: "none",
      background: "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)",
      color: "#fff",
      transition: "0.3s",
      "&:hover": {
        background: "linear-gradient(90deg,#c7b3ff,#9c7aff,#6e3aff)",
        transform: "translateY(-2px)",
      },
    },

    outlined: {
      padding: "0.7rem 1.8rem",
      borderRadius: "10rem",
      fontSize: "1rem",
      fontWeight: 600,
      textTransform: "none",
      borderColor: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
      transition: "0.3s",
      "&:hover": {
        borderColor: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
        background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.05)",
        transform: "translateY(-2px)",
      },
    },

    soft: {
      padding: "0.7rem 1.6rem",
      borderRadius: "10rem",
      fontSize: "1rem",
      fontWeight: 600,
      textTransform: "none",
      background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
      transition: "0.3s",
      "&:hover": {
        background: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)",
        transform: "translateY(-2px)",
      },
    },

    text: {
      padding: "0.5rem 1rem",
      borderRadius: "0.6rem",
      fontSize: "0.95rem",
      fontWeight: 600,
      color: isDark ? "#cbb6ff" : "#5d2eff",
      textTransform: "none",
      transition: "0.3s",
      "&:hover": {
        opacity: 0.8,
        transform: "translateY(-1px)",
      },
    },
  };

  return (
    <MUIButton
      variant={variant === "soft" ? "text" : variant}
      fullWidth={full}
      disabled={loading || props.disabled}
      type={props.type || "button"}
      sx={{
        ...styles[variant],
        ...sx,
      }}
      {...props}
    >
      {loading ? (
        <CircularProgress
          size={22}
          sx={{ color: variant === "contained" ? "#fff" : "inherit" }}
        />
      ) : (
        children
      )}
    </MUIButton>
  );
}
