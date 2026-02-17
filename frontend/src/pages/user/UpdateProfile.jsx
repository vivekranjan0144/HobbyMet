import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { UserAPI } from "../../api/user.api";
import {
  Box,
  Typography,
  Stack,
  Grid,
  TextField,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  MenuItem,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { useHobbies } from "../../context/HobbyContext";
import { getHobbiesByCategory } from "../../api/hobby.api";
import api from "../../utils/fetch";

export default function UpdateProfile() {
  const { user, refreshUser } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const addressTimer = useRef(null);
  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const change = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const changePrivacy = (key, value) =>
    setForm((f) => ({
      ...f,
      privacy: { ...(f.privacy || {}), [key]: value },
    }));
  const changeSocial = (key, value) =>
    setForm((f) => ({
      ...f,
      socialLinks: { ...(f.socialLinks || {}), [key]: value },
    }));

  const [manualAddress, setManualAddress] = useState("");
  const [addressResults, setAddressResults] = useState([]);
  const [searchingAddr, setSearchingAddr] = useState(false);
  const [fetchingLiveLocation, setFetchingLiveLocation] = useState(false);
  const [addressChips, setAddressChips] = useState({
    city: "—",
    state: "—",
    country: "—",
    postcode: "—",
  });

  const [allHobbies, setAllHobbies] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filteredHobbies, setFilteredHobbies] = useState([]);
  const { categories } = useHobbies();

  if (!user) {
    return (
      <Box sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography mt={2}>Loading profile…</Typography>
      </Box>
    );
  }

  const reverseGeocode = async (_lat, _lon, setFullAddress = false) => {
    if (setFullAddress) {
      setManualAddress((v) => v);
    }
  };

  useEffect(() => {
    if (!selectedCategory) {
      setFilteredHobbies([]);
      return;
    }

    let cancelled = false;

    const loadHobbies = async () => {
      try {
        const hobbies = await getHobbiesByCategory(selectedCategory);
        if (!cancelled) {
          setFilteredHobbies(hobbies);
        }
      } catch {
        setFilteredHobbies([]);
      }
    };

    loadHobbies();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  useEffect(() => {
    const coords = user.location?.coordinates || [0, 0];

    setForm({
      username: user.username,
      name: user.name || "",
      email: user.email,
      phone: user.phone || "",
      bio: user.bio || "",
      hobbies: user.hobbies || [],

      dob: user.dob ? user.dob.split("T")[0] : "",
      gender: user.gender || "",
      privacy: { ...user.privacy },
      location: coords,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      socialLinks: {
        facebook: user.socialLinks?.facebook || "",
        instagram: user.socialLinks?.instagram || "",
        twitter: user.socialLinks?.twitter || "",
        linkedin: user.socialLinks?.linkedin || "",
        website: user.socialLinks?.website || "",
      },
    });

    setManualAddress(user.location?.address || "");

    if (coords[0] && coords[1]) {
      reverseGeocode(coords[1], coords[0]);
    }
  }, [user]);

  if (!form) return null;

  const searchAddress = async (q) => {
    if (!q || q.length < 3) {
      setAddressResults([]);
      return;
    }

    try {
      setSearchingAddr(true);

      const res = await api.get(`/location/search?q=${encodeURIComponent(q)}`);

      setAddressResults(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Location search failed", e);
      setAddressResults([]);
    } finally {
      setSearchingAddr(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErr("Geolocation is not supported by your browser");
      return;
    }

    setFetchingLiveLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        let address = "Current Location";

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          );
          const data = await res.json();
          address = data.display_name || address;
        } catch {
          console.warn("Reverse geocode failed");
        }

        setForm((f) => ({
          ...f,
          location: [lon, lat],
        }));

        setManualAddress(address);

        setFetchingLiveLocation(false);
        setMsg("📍 Current location detected. Click Save Address to confirm.");
      },
      () => {
        setFetchingLiveLocation(false);
        setErr("Unable to fetch current location");
      },
      { enableHighAccuracy: true },
    );
  };

  const saveLocation = async () => {
    try {
      const preserved = manualAddress;

      await UserAPI.updateLocation({
        coordinates: form.location,
        address: preserved,
      });

      await refreshUser();
      setManualAddress(preserved);

      setMsg("Location updated successfully");
    } catch {
      setErr("Failed to update location");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await UserAPI.updateProfile({
        name: form.name,
        phone: form.phone,
        bio: form.bio,
        gender: form.gender,
        dob: form.dob,
        hobbies: form.hobbies,

        privacy: form.privacy,
        socialLinks: form.socialLinks,
      });
      await refreshUser();
      setEditMode(false);
      setMsg("Profile updated successfully");
    } catch {
      setErr("Update failed");
    }
  };

  return (
    <Box sx={{ position: "relative", overflow: "hidden", pb: 8 }}>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: -5,
          background: isDark
            ? "linear-gradient(135deg,#0c0818,#1b1230,#0e071e)"
            : "linear-gradient(135deg,#f5efff,#ece3ff,#e6dbff)",
        }}
      />

      <Box sx={{ maxWidth: 1100, mx: "auto", mt: "6rem", px: 2 }}>
        <Typography
          variant="h4"
          fontWeight={900}
          textAlign="center"
          sx={{
            mb: 4,
            background:
              "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff,#5d2eff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Profile Settings
        </Typography>

        {msg && <Msg text={msg} color="#22c55e" />}
        {err && <Msg text={err} color="#ef4444" />}

        <GlassCard title="📍 Location">
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ my: 1 }}>
            <Chip label={`City: ${addressChips.city}`} />
            <Chip label={`State: ${addressChips.state}`} />
            <Chip label={`Country: ${addressChips.country}`} />
            <Chip label={`PIN: ${addressChips.postcode}`} />
          </Stack>
          <Box sx={{ position: "relative" }}>
            <TextField
              fullWidth
              label="Full Address"
              value={manualAddress}
              onChange={(e) => {
                const val = e.target.value;
                setManualAddress(val);

                if (addressTimer.current) {
                  clearTimeout(addressTimer.current);
                }

                addressTimer.current = setTimeout(() => {
                  searchAddress(val);
                }, 400);
              }}
              helperText={
                searchingAddr ? "Searching address..." : "Type & select address"
              }
              InputProps={{
                endAdornment: searchingAddr ? (
                  <CircularProgress size={18} />
                ) : null,
              }}
              sx={enhancedInput}
            />

            {addressResults.length > 0 && (
              <Paper sx={suggestionBox}>
                <List dense>
                  {addressResults.map((p, i) => (
                    <ListItemButton
                      key={i}
                      onClick={() => {
                        setManualAddress(p.display_name);

                        setForm((f) => ({
                          ...f,
                          location: [Number(p.lon), Number(p.lat)],
                        }));

                        setAddressResults([]);

                        reverseGeocode(Number(p.lat), Number(p.lon));
                      }}
                    >
                      <ListItemText primary={p.display_name} />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mt: 2 }}
          >
            <Button
              variant="outlined"
              onClick={useCurrentLocation}
              disabled={fetchingLiveLocation}
              sx={{ borderRadius: "999px" }}
            >
              {fetchingLiveLocation ? "Detecting…" : "📍 Use Current Location"}
            </Button>

            <Button sx={primaryBtn} onClick={saveLocation}>
              Save Address
            </Button>
          </Stack>
        </GlassCard>

        <form onSubmit={submit}>
          <GlassCard
            title="👤 Basic Information"
            action={
              !editMode && (
                <Button sx={primaryBtn} onClick={() => setEditMode(true)}>
                  Edit Profile
                </Button>
              )
            }
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Read label="Username" value={form.username} />
              </Grid>
              <Grid item xs={12}>
                <Edit
                  label="Full Name"
                  value={form.name}
                  edit={editMode}
                  onChange={(v) => change("name", v)}
                />
              </Grid>
              <Grid item xs={12}>
                <Read label="Email" value={form.email} />
              </Grid>
              <Grid item xs={12}>
                <Edit
                  label="Phone"
                  value={form.phone}
                  edit={editMode}
                  onChange={(v) => change("phone", v)}
                />
              </Grid>
              <Grid item xs={12}>
                <Grid item xs={12}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Date of Birth"
                      value={form.dob}
                      disabled={!editMode}
                      onChange={(e) => change("dob", e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={enhancedInput}
                    />
                  </Grid>

                  {form.dob && (
                    <Typography variant="caption" sx={{ ml: 1, opacity: 0.75 }}>
                      Age:{" "}
                      {Math.floor(
                        (new Date() - new Date(form.dob)) /
                          (365.25 * 24 * 60 * 60 * 1000),
                      )}{" "}
                      years
                    </Typography>
                  )}
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Gender"
                  value={form.gender || ""}
                  disabled={!editMode}
                  onChange={(e) => change("gender", e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  SelectProps={{
                    displayEmpty: true,
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          mt: 1,
                          borderRadius: "1rem",
                          backdropFilter: "blur(14px)",
                          background: "rgba(255, 255, 255, 0.04)",
                          boxShadow: "0 15px 35px rgba(0,0,0,0.25)",
                          overflow: "hidden",
                        },
                      },
                    },
                    renderValue: (selected) => {
                      if (!selected) {
                        return (
                          <span style={{ opacity: 0.6 }}>
                            Select your gender
                          </span>
                        );
                      }

                      const map = {
                        male: "👨 Male",
                        female: "👩 Female",
                        other: "🧑 Other",
                      };

                      return map[selected];
                    },
                  }}
                  sx={{
                    mb: 1.5,

                    "& .MuiInputBase-root": {
                      background: editMode
                        ? "rgba(124,77,255,0.22)"
                        : "rgba(255,255,255,0.22)",
                      backdropFilter: "blur(12px)",
                      borderRadius: "0.9rem",
                      border: editMode
                        ? "1px solid rgba(124,77,255,0.45)"
                        : "1px solid rgba(255,255,255,0.3)",
                      transition: "all 0.25s ease",
                    },

                    "& .MuiInputBase-root.Mui-focused": {
                      boxShadow: "0 0 0 3px rgba(124,77,255,0.45)",
                    },

                    "& .MuiSvgIcon-root": {
                      color: editMode ? "#7c4dff" : "rgba(0,0,0,0.45)",
                    },
                  }}
                >
                  <MenuItem
                    value=""
                    sx={{
                      opacity: 0.7,
                      fontStyle: "italic",
                    }}
                  >
                    Prefer not to say
                  </MenuItem>

                  {[
                    { label: "Male", value: "male", icon: "👨" },
                    { label: "Female", value: "female", icon: "👩" },
                    { label: "Other", value: "other", icon: "🧑" },
                  ].map((g) => (
                    <MenuItem
                      key={g.value}
                      value={g.value}
                      sx={{
                        py: 1.4,
                        px: 2,
                        display: "flex",
                        gap: 1.2,
                        alignItems: "center",
                        transition: "all 0.2s ease",

                        "&:hover": {
                          background:
                            "linear-gradient(90deg, rgba(167,139,250,0.25), rgba(124,77,255,0.25))",
                        },

                        "&.Mui-selected": {
                          background:
                            "linear-gradient(90deg, rgba(167,139,250,0.45), rgba(124,77,255,0.45))",
                          color: "#fff",
                        },

                        "&.Mui-selected:hover": {
                          background:
                            "linear-gradient(90deg, rgba(167,139,250,0.55), rgba(124,77,255,0.55))",
                        },
                      }}
                    >
                      <span style={{ fontSize: "1.1rem" }}>{g.icon}</span>
                      <Typography fontWeight={600}>{g.label}</Typography>
                    </MenuItem>
                  ))}
                </TextField>

                <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                  You can change this anytime
                </Typography>
              </Grid>
            </Grid>
          </GlassCard>

          <GlassCard title="📝 About">
            <Edit
              label="Bio"
              multiline
              value={form.bio}
              edit={editMode}
              onChange={(v) => change("bio", v)}
            />
            <TextField
              select
              fullWidth
              label="Hobby Category"
              value={selectedCategory}
              disabled={!editMode}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                change("hobbies", []);
              }}
              sx={enhancedInput}
            >
              <MenuItem value="">
                <em>Select category</em>
              </MenuItem>

              {categories.map((cat) => (
                <MenuItem key={cat._id} value={cat.slug}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Hobbies"
              disabled={!editMode || !selectedCategory}
              select
              SelectProps={{
                multiple: true,
                renderValue: (selected) => selected.join(", "),
              }}
              value={form.hobbies}
              onChange={(e) => change("hobbies", e.target.value)}
              sx={enhancedInput}
            >
              {filteredHobbies.map((hobby) => (
                <MenuItem key={hobby._id} value={hobby.name}>
                  {hobby.name}
                </MenuItem>
              ))}
            </TextField>
          </GlassCard>

          <GlassCard title="🔗 Social Links">
            {Object.entries(form.socialLinks).map(([k, v]) => (
              <Edit
                key={k}
                label={k.toUpperCase()}
                value={v}
                edit={editMode}
                onChange={(val) => changeSocial(k, val)}
              />
            ))}
          </GlassCard>

          <GlassCard title="🔒 Privacy">
            {["showEmail", "showPhone", "showLocation"].map((k) => (
              <FormControlLabel
                key={k}
                control={
                  <Switch
                    disabled={!editMode}
                    checked={form.privacy[k]}
                    onChange={(e) => changePrivacy(k, e.target.checked)}
                  />
                }
                label={k.replace("show", "Show ")}
              />
            ))}
          </GlassCard>

          <GlassCard title="⚙ System Info">
            <Sys label="Created" value={form.createdAt} />
            <Sys label="Updated" value={form.updatedAt} />
            <Sys label="Last Login" value={form.lastLoginAt} />
          </GlassCard>

          {editMode && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mt: 3 }}
            >
              <Button type="submit" sx={primaryBtn}>
                Save Profile
              </Button>
              <Button
                variant="outlined"
                sx={{ borderRadius: "999px" }}
                onClick={() => setEditMode(false)}
              >
                Cancel
              </Button>
            </Stack>
          )}
        </form>
      </Box>
    </Box>
  );
}

const GlassCard = ({ title, children, action }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        mb: 4,
        p: { xs: 2, sm: 3 },
        borderRadius: "1.4rem",
        background: isDark
          ? "rgba(108, 30, 243, 0.08)"
          : "rgba(255,255,255,0.35)",
        backdropFilter: "blur(14px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Typography fontWeight={800}>{title}</Typography>
        {action}
      </Stack>
      {children}
    </Box>
  );
};

const Msg = ({ text, color }) => (
  <Typography sx={{ color, mb: 2, fontWeight: 700 }}>{text}</Typography>
);

const enhancedInput = {
  mb: 2,
  "& .MuiInputBase-root": {
    background: "rgba(124, 77, 255, 0.1)",
    backdropFilter: "blur(12px)",
    borderRadius: "0.9rem",
    border: "1px solid rgba(124, 77, 255, 0.13)",
    transition: "all 0.25s ease",
  },
  "& .MuiInputBase-root.Mui-focused": {
    boxShadow: "0 0 0 3px rgba(124, 77, 255, 0.23)",
  },
};

const primaryBtn = {
  borderRadius: "999px",
  px: 4,
  background: "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)",
  color: "#fff",
};
const suggestionBox = {
  maxHeight: 260,
  overflowY: "auto",
  borderRadius: "1rem",
  backdropFilter: "blur(25px)",
  background: "rgba(30, 30, 30, 0.65)",
  boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
};

const Read = ({ label, value }) => (
  <Box>
    <Typography variant="caption" sx={{ opacity: 0.6 }}>
      {label}
    </Typography>
    <Typography fontWeight={600}>{value || "—"}</Typography>
  </Box>
);

const Edit = ({ label, value, edit, onChange, multiline }) => (
  <TextField
    fullWidth
    label={label}
    value={value || ""}
    multiline={multiline}
    rows={multiline ? 3 : 1}
    disabled={!edit}
    onChange={(e) => onChange(e.target.value)}
    sx={enhancedInput}
  />
);

const Sys = ({ label, value }) => (
  <Box>
    <Typography variant="caption" sx={{ opacity: 0.6 }}>
      {label}
    </Typography>
    <Typography fontWeight={600}>
      {value ? new Date(value).toLocaleString() : "—"}
    </Typography>
  </Box>
);
