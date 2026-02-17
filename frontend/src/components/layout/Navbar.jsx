import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Stack,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  Badge,
  InputBase,
  Drawer,
  Divider,
  useTheme,
} from "@mui/material";

import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import NotificationDropdown from "./NotificationDropdown";

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useContext, useEffect, useState } from "react";
import { ColorModeContext } from "../../main";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery("(max-width: 700px)");
  const { toggleColorMode } = useContext(ColorModeContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const menuItemSx = {
    px: 2.5,
    py: 1.2,
    mx: 1,
    borderRadius: "0.6rem",
    fontSize: "0.95rem",
    fontWeight: 500,
    transition: "0.25s ease",
    "&:hover": {
      background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
      transform: "translateX(4px)",
    },
  };

  const handleLogoClick = () => {
    if (!user) {
      if (pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate("/");
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 20);
      }
      return;
    }

    if (pathname === "/explore") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/explore");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 20);
    }
  };

  return (
    <>
      {isMobile && (
        <AppBar
          elevation={0}
          position="fixed"
          sx={{
            height: "3.5rem",
            px: "1rem",
            display: "flex",
            justifyContent: "center",
            background: scrolled
              ? isDark
                ? "rgba(15,12,25,0.55)"
                : "rgba(255,255,255,0.55)"
              : "transparent",
            backdropFilter: scrolled ? "blur(1.2rem)" : "none",
            borderBottom: scrolled
              ? isDark
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(0,0,0,0.12)"
              : "1px solid transparent",
            transition: "0.4s ease",
            zIndex: 300,
          }}
        >
          <Toolbar sx={{ p: 0, justifyContent: "space-between" }}>
            <IconButton onClick={() => setMobileMenuOpen(true)}>
              <MenuIcon sx={{ fontSize: "1.8rem" }} />
            </IconButton>

            {user && (
              <Typography
                onClick={handleLogoClick}
                sx={{
                  fontSize: "1.4rem",
                  fontWeight: 900,
                  cursor: "pointer",
                  background:
                    "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff,#5d2eff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                HobbyMeet
              </Typography>
            )}

            <IconButton
              onClick={toggleColorMode}
              sx={{
                background: isDark
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(0,0,0,0.08)",
              }}
            >
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {!isMobile && (
        <AppBar
          elevation={0}
          position="fixed"
          sx={{
            height: scrolled ? "3.8rem" : "4.8rem",
            background: scrolled
              ? isDark
                ? "rgba(15,12,25,0.55)"
                : "rgba(255,255,255,0.55)"
              : "transparent",
            backdropFilter: scrolled ? "blur(1.2rem)" : "none",
            borderBottom: scrolled
              ? isDark
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(0,0,0,0.12)"
              : "1px solid transparent",
            transition: "0.4s",
          }}
        >
          <Toolbar
            sx={{
              px: { xs: "1rem", md: "2rem" },
              maxWidth: "120rem",
              mx: "auto",
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            {user && (
              <Typography
                onClick={handleLogoClick}
                className="navLogoGlow"
                sx={{
                  fontSize: scrolled ? "1.35rem" : "1.75rem",
                  fontWeight: 900,
                  cursor: "pointer",
                  background:
                    "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff,#5d2eff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                HobbyMeet
              </Typography>
            )}

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ ml: "auto" }}
            >
              {user && <NotificationDropdown />}

              <IconButton onClick={toggleColorMode}>
                {isDark ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>

              {!user && (
                <>
                  <Button component={Link} to="/login">
                    Login
                  </Button>
                  <Button component={Link} to="/signup" variant="contained">
                    Signup
                  </Button>
                </>
              )}

              {user && (
                <>
                  <Avatar
                    sx={{ cursor: "pointer" }}
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                  >
                    {user.username[0].toUpperCase()}
                  </Avatar>

                  <Menu
                    anchorEl={anchorEl}
                    open={openMenu}
                    onClose={() => setAnchorEl(null)}
                    PaperProps={{
                      sx: {
                        mt: 1,
                        borderRadius: "1rem",
                        background: isDark
                          ? "rgba(25,20,40,0.92)"
                          : "rgba(255,255,255,0.92)",
                        backdropFilter: "blur(10px)",
                        overflow: "hidden",
                      },
                    }}
                    MenuListProps={{ sx: { py: 0.5 } }}
                    ModalProps={{ disableScrollLock: true, keepMounted: true }}
                  >
                    <MenuItem
                      component={Link}
                      to="/me"
                      sx={menuItemSx}
                      onClick={() => setAnchorEl(null)}
                    >
                      Manage Profile
                    </MenuItem>
                    <MenuItem
                      component={Link}
                      to="/explore"
                      sx={menuItemSx}
                      onClick={() => setAnchorEl(null)}
                    >
                      Explore Events
                    </MenuItem>
                    <MenuItem
                      component={Link}
                      to="/my-events"
                      sx={menuItemSx}
                      onClick={() => setAnchorEl(null)}
                    >
                      My Hosted Events
                    </MenuItem>
                    <MenuItem
                      component={Link}
                      to="/my-requests"
                      sx={menuItemSx}
                      onClick={() => setAnchorEl(null)}
                    >
                      Requested Events
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        logout();
                        setAnchorEl(null);
                        navigate("/login");
                      }}
                      sx={{
                        ...menuItemSx,
                        color: "error.main",
                        fontWeight: 700,
                      }}
                    >
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Stack>
          </Toolbar>
        </AppBar>
      )}

      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        ModalProps={{ disableScrollLock: true, keepMounted: true }}
        PaperProps={{
          sx: {
            width: "72%",
            background: isDark
              ? "rgba(20,17,30,0.92)"
              : "rgba(255,255,255,0.92)",
            backdropFilter: "blur(1rem)",
            borderRadius: "0 1.2rem 1.2rem 0",
            boxShadow: "4px 0px 18px rgba(0,0,0,0.22)",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogoClick();
              }}
              sx={{
                fontWeight: 900,
                fontSize: "1.4rem",
                cursor: "pointer",
                background: "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              HobbyMeet
            </Typography>

            <IconButton onClick={() => setMobileMenuOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={2}>
            {!user ? (
              <>
                <Button
                  component={Link}
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Button>
                <Button
                  component={Link}
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Signup
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Button>

                <Button
                  component={Link}
                  to="/explore"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Explore Events
                </Button>

                <Button
                  component={Link}
                  to="/me"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Manage Profile
                </Button>

                <Button
                  component={Link}
                  to="/my-events"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Hosted Events
                </Button>

                <Button
                  component={Link}
                  to="/my-requests"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Requested Events
                </Button>

                <Button
                  color="error"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate("/login");
                  }}
                >
                  Logout
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Drawer>

      <style>
        {`
        .navLogoGlow {
          animation: glowLogo 5s infinite ease-in-out;
        }
        @keyframes glowLogo {
          0%,100% { filter: brightness(1); }
          50% { filter: brightness(1.2); }
        }
        `}
      </style>
    </>
  );
}
