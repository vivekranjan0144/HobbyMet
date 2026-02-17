import { createTheme } from "@mui/material/styles";

const common = {
  typography: {
    fontFamily: "Inter, Roboto, system-ui, -apple-system, sans-serif",
    body1: { fontSize: 15, fontWeight: 500 },
  },

  shape: { borderRadius: 12 },

  components: {
    MuiModal: {
      defaultProps: { disableScrollLock: true, keepMounted: true },
    },
    MuiPopover: {
      defaultProps: { disableScrollLock: true, keepMounted: true },
    },
    MuiMenu: {
      defaultProps: { disableScrollLock: true, keepMounted: true },
    },
    MuiDrawer: {
      defaultProps: { disableScrollLock: true, keepMounted: true },
    },
    MuiDialog: {
      defaultProps: { disableScrollLock: true, keepMounted: true },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: "18px",

          "& .MuiInputLabel-root": {
            fontWeight: 600,
          },
          "& .MuiInputLabel-root.Mui-focused": {
            fontWeight: 700,
          },
          "& .MuiInputBase-input": {
            fontWeight: 600,
          },
          "& .MuiInputBase-input.Mui-disabled": {
            opacity: 1,
            WebkitTextFillColor: "inherit !important",
            color: "inherit !important",
          },
          "& input::placeholder": {
            opacity: 0.7,
          },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 18px",
          textTransform: "none",
          fontWeight: 700,
          transition: "0.25s ease",
        },
      },
      defaultProps: { disableElevation: true },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          padding: "6px",
          animation: "fade 0.25s ease",
        },
      },
    },
  },
};

export const themeLight = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#6750A4" },
    background: { default: "#f7f7f9", paper: "#ffffff" },
    text: { primary: "#1C1B1F" },
  },
  ...common,
});

export const themeDark = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#D0BCFF" },
    background: { default: "#1C1B1F", paper: "#1C1B1F" },
    text: { primary: "#ffffff", secondary: "#E6E1E5" },
  },

  components: {
    ...common.components,

    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputLabel-root": {
            color: "#E6E1E5",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#D0BCFF",
          },
          "& .MuiInputBase-input": {
            color: "#ffffff !important",
          },
          "& .MuiInputBase-input.Mui-disabled": {
            color: "#ffffff !important",
            WebkitTextFillColor: "#ffffff !important",
            opacity: 0.7,
          },
          "& input::placeholder": {
            color: "#E6E1E5",
          },
        },
      },
    },
  },
});
