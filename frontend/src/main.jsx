import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./context/AuthContext";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { themeLight, themeDark } from "./theme";
import { HobbyProvider } from "./context/HobbyContext";

export const ColorModeContext = React.createContext({
  toggleColorMode: () => {},
});

function Main() {
  const stored = localStorage.getItem("theme");
  if (!stored) {
    localStorage.setItem("theme", "dark");
  }

  const [mode, setMode] = React.useState(stored || "dark");

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prev) => {
          const next = prev === "light" ? "dark" : "light";
          localStorage.setItem("theme", next);
          return next;
        });
      },
    }),
    [],
  );
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={mode === "light" ? themeLight : themeDark}>
        <CssBaseline />
        <BrowserRouter>
          <HobbyProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </HobbyProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Main />);
