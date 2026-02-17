import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Modal,
  Chip,
  useTheme,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useRef } from "react";
import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import UploadIcon from "@mui/icons-material/Upload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import { EventAPI } from "../../api/event.api";
import MapPicker from "../../components/map/MapPicker";
import { Paper, List, ListItemButton, ListItemText } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import { useHobbies } from "../../context/HobbyContext";
import { getHobbiesByCategory } from "../../api/hobby.api";

export default function CreateEventPopup({ open, onClose, onCreated }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [showMap, setShowMap] = useState(false);
  const [fetchingLoc, setFetchingLoc] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({
    type: "",
    text: "",
  });
  const [errors, setErrors] = useState({});

  const [hobbies, setHobbies] = useState([]);

  const [loadingHobbies, setLoadingHobbies] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    hobbyTags: [],
    rules: "",
    coverImage: "",
    gallery: [],
    eventDateTime: "",
    endDateTime: "",
    location: { type: "Point", coordinates: [0, 0], address: "" },
    capacity: 1,
    visibility: "public",
    status: "active",
  });

  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const { categories } = useHobbies();

  const [tag, setTag] = useState("");

  const loadHobbies = async (categorySlug) => {
    if (!categorySlug) return;
    try {
      setLoadingHobbies(true);
      const res = await getHobbiesByCategory(categorySlug);

      setHobbies(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error("Hobby load failed", e);
    } finally {
      setLoadingHobbies(false);
    }
  };

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const addTag = () => {
    if (tag.trim() && !form.hobbyTags.includes(tag.trim())) {
      setForm((f) => ({ ...f, hobbyTags: [...f.hobbyTags, tag.trim()] }));
      setTag("");
    }
  };
  const removeTag = (i) =>
    setForm((f) => ({
      ...f,
      hobbyTags: f.hobbyTags.filter((_, j) => j !== i),
    }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { UploadAPI } = await import("../../api/upload.api");
      const result = await UploadAPI.uploadFile(file, {
        folder: "hobbymet/events",
        resourceType: "image",
      });
      setForm((f) => ({ ...f, coverImage: result.url }));
    } catch (err) {
      console.error("Failed to upload image:", err);
      setErrors((prev) => ({ ...prev, coverImage: "Failed to upload image" }));
    } finally {
      setUploading(false);
    }
  };
  const removeImage = () => setForm((f) => ({ ...f, coverImage: "" }));
  const addressTimer = useRef(null);

  const validateForm = () => {
    const newErrors = {};

    if (!form.title || form.title.length < 3)
      newErrors.title = "Title must be at least 3 characters long";

    if (!form.description || form.description.length < 10)
      newErrors.description = "Description must be at least 10 characters long";

    if (!form.category) newErrors.category = "Category is required";

    if (!form.hobbyTags.length)
      newErrors.hobbyTags = "At least one hobby tag is required";

    if (!form.coverImage) newErrors.coverImage = "Cover image is required";

    if (!form.location.address) newErrors.address = "Address is required";

    if (!form.location.coordinates || form.location.coordinates[0] === 0)
      newErrors.coordinates = "Valid coordinates are required";

    if (!form.capacity || form.capacity < 1)
      newErrors.capacity = "Capacity must be at least 1";

    if (!form.eventDateTime)
      newErrors.eventDateTime = "Event start time is required";

    if (
      form.endDateTime &&
      new Date(form.endDateTime) <= new Date(form.eventDateTime)
    )
      newErrors.endDateTime = "End time must be after start time";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setErrors({});
    setLoading(true);

    if (!validateForm()) {
      setMsg({
        type: "error",
        text: "Please fix the highlighted errors before submitting.",
      });
      setLoading(false);
      return;
    }

    try {
      await EventAPI.createEvent(form);

      setMsg({
        type: "success",
        text: "Event created successfully!",
      });

      setTimeout(() => {
        onClose();
        onCreated?.();
      }, 800);
    } catch (err) {
      const res = err?.response?.data;

      if (res?.details) {
        const backendErrors = {};
        Object.keys(res.details).forEach((k) => {
          backendErrors[k] = res.details[k].message;
        });
        setErrors(backendErrors);
      }

      setMsg({
        type: "error",
        text: res?.message || "Failed to create event. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMapSelect = (coords, address) => {
    setForm((f) => ({
      ...f,
      location: {
        type: "Point",
        coordinates: coords,
        address,
      },
    }));

    setAddressQuery(address);

    setAddressResults([]);

    setShowMap(false);
  };

  const searchAddress = async (q) => {
    if (!q || q.trim().length < 3) {
      setAddressResults([]);
      return;
    }

    try {
      setSearchingAddress(true);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(q)}` +
          `&format=json` +
          `&addressdetails=1` +
          `&limit=10` +
          `&accept-language=en` +
          `&bounded=1` +
          `&viewbox=68.1,37.1,97.4,6.4`,
      );

      const data = await res.json();
      setAddressResults(data || []);
    } catch (err) {
      console.warn("Address search failed", err);
    } finally {
      setSearchingAddress(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMsg("❌ Geolocation not supported on this device");
      return;
    }

    setFetchingLoc(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = "Current Location";

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          );
          const data = await res.json();
          address = data.display_name || address;
        } catch {
          console.warn("Reverse geocode failed");
        }

        setForm((f) => ({
          ...f,
          location: {
            type: "Point",
            coordinates: [longitude, latitude],
            address,
          },
        }));

        setAddressQuery(address);
        setAddressResults([]);

        setFetchingLoc(false);
        setMsg("📍 Location set to current position");
      },
      () => {
        setMsg("❌ Failed to get current location");
        setFetchingLoc(false);
      },
    );
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box
          component="form"
          onSubmit={submit}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "92%",
            maxWidth: 650,
            p: 4,
            borderRadius: "1.6rem",
            background: isDark ? "rgba(25,20,40,0.95)" : "#fff",
            boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
            maxHeight: "92vh",
            overflowY: "auto",

            scrollbarWidth: "none",
            "&::-webkit-scrollbar": {
              display: "none",
            },
            WebkitOverflowScrolling: "touch",
          }}
        >
          <IconButton
            sx={{ position: "absolute", top: 12, right: 12 }}
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>

          <Typography
            variant="h6"
            fontWeight={900}
            textAlign="center"
            mb={2}
            sx={{
              background:
                "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff,#5d2eff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Create Event
          </Typography>

          {msg.text && (
            <Alert
              severity={msg.type || "info"}
              sx={{ mb: 2 }}
              onClose={() => setMsg({ type: "", text: "" })}
            >
              {msg.text}
            </Alert>
          )}

          <Stack spacing={2}>
            <TextField
              label="Title *"
              name="title"
              value={form.title}
              onChange={handleChange}
              error={!!errors.title}
              helperText={errors.title}
            />
            <TextField
              label="Description *"
              name="description"
              multiline
              rows={3}
              value={form.description}
              onChange={handleChange}
              error={!!errors.description}
              helperText={errors.description}
            />

            <TextField
              select
              label="Category *"
              value={form.category}
              onChange={(e) => {
                const val = e.target.value;

                setForm((f) => ({
                  ...f,
                  category: val,
                  hobbyTags: [],
                }));
                setHobbies([]);
                loadHobbies(val);
              }}
              fullWidth
              SelectProps={{
                MenuProps: {
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                  },
                  transformOrigin: {
                    vertical: "top",
                    horizontal: "left",
                  },
                  PaperProps: {
                    sx: {
                      mt: 0.5,
                      borderRadius: 2,
                      maxHeight: 280,
                      overflowY: "auto",

                      scrollbarWidth: "none",
                      "&::-webkit-scrollbar": {
                        display: "none",
                      },

                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(30,30,40,0.95)"
                          : "#fff",
                    },
                  },
                },
              }}
            >
              {categories.map((c) => (
                <MenuItem key={c._id} value={c.slug}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Event Rules"
              name="rules"
              multiline
              rows={2}
              value={form.rules}
              onChange={handleChange}
            />

            <Stack spacing={1}>
              <TextField
                select
                label="Hobby Tags *"
                value={null}
                fullWidth
                SelectProps={{
                  renderValue: () => "Select hobbies",
                  MenuProps: {
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                    PaperProps: {
                      sx: {
                        mt: 0.5,
                        borderRadius: 2,
                        maxHeight: 280,
                        overflowY: "auto",

                        scrollbarWidth: "none",
                        "&::-webkit-scrollbar": {
                          display: "none",
                        },

                        backgroundColor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(30,30,40,0.95)"
                            : "#fff",
                      },
                    },
                  },
                }}
              >
                {loadingHobbies && (
                  <MenuItem disabled>Loading hobbies...</MenuItem>
                )}

                {hobbies.map((h) => (
                  <MenuItem
                    key={h._id}
                    onClick={() => {
                      if (!form.hobbyTags.includes(h.name)) {
                        setForm((f) => ({
                          ...f,
                          hobbyTags: [...f.hobbyTags, h.name],
                        }));
                      }
                    }}
                  >
                    {h.name}
                  </MenuItem>
                ))}
              </TextField>

              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {form.hobbyTags.map((tag, i) => (
                  <Chip key={i} label={tag} onDelete={() => removeTag(i)} />
                ))}
              </Stack>
            </Stack>

            <Divider />

            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
              >
                {uploading ? "Uploading..." : "Upload Cover Image"}
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleImageUpload}
                />
              </Button>
              {form.coverImage && (
                <IconButton onClick={removeImage} color="error">
                  <DeleteOutlineIcon />
                </IconButton>
              )}
            </Stack>
            {errors.coverImage && (
              <Typography color="error" fontSize={13}>
                {errors.coverImage}
              </Typography>
            )}
            {form.coverImage && (
              <img
                src={form.coverImage}
                alt="cover preview"
                style={{
                  width: "100%",
                  borderRadius: 10,
                  marginTop: 6,
                  objectFit: "cover",
                }}
              />
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Start Time"
                type="datetime-local"
                name="eventDateTime"
                value={form.eventDateTime}
                onChange={handleChange}
                error={!!errors.eventDateTime}
                helperText={
                  errors.eventDateTime || "Select event start date & time"
                }
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{}}
              />

              <TextField
                label="End Time"
                type="datetime-local"
                name="endDateTime"
                value={form.endDateTime}
                onChange={handleChange}
                error={!!errors.endDateTime}
                helperText={
                  errors.endDateTime || "Select event end date & time"
                }
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: form.eventDateTime || undefined,
                }}
              />
            </Stack>

            <Box sx={{ position: "relative" }}>
              <TextField
                label="Address *"
                value={addressQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setAddressQuery(val);

                  setForm((f) => ({
                    ...f,
                    location: {
                      ...f.location,
                      address: val,
                      coordinates: [0, 0],
                    },
                  }));

                  if (addressTimer.current) {
                    clearTimeout(addressTimer.current);
                  }

                  addressTimer.current = setTimeout(() => {
                    searchAddress(val);
                  }, 400);
                }}
                error={!!errors.address}
                helperText={
                  errors.address ||
                  (searchingAddress
                    ? "Searching address..."
                    : "Type & select address")
                }
                InputProps={{
                  endAdornment: searchingAddress ? (
                    <CircularProgress size={18} />
                  ) : null,
                }}
                fullWidth
              />

              {addressResults.length > 0 && (
                <Paper
                  elevation={6}
                  sx={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 30,
                    mt: 0.5,
                    borderRadius: 2,
                    maxHeight: 280,
                    overflowY: "auto",
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(30,30,40,0.95)"
                        : "#fff",
                  }}
                >
                  <List dense disablePadding>
                    {addressResults.map((p, i) => (
                      <ListItemButton
                        key={i}
                        onClick={() => {
                          const lat = Number(p.lat);
                          const lon = Number(p.lon);

                          setForm((f) => ({
                            ...f,
                            location: {
                              type: "Point",
                              coordinates: [lon, lat],
                              address: p.display_name,
                            },
                          }));

                          setAddressQuery(p.display_name);
                          setAddressResults([]);
                        }}
                        sx={{
                          alignItems: "flex-start",
                          px: 2,
                          py: 1.2,
                        }}
                      >
                        <ListItemText
                          primary={p.display_name}
                          primaryTypographyProps={{
                            fontSize: 14,
                            lineHeight: 1.4,
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<AddLocationAltIcon />}
                onClick={() => setShowMap(true)}
                sx={{ flex: 1 }}
              >
                Select on Map
              </Button>
              <Button
                variant="outlined"
                startIcon={<MyLocationIcon />}
                onClick={useCurrentLocation}
                disabled={fetchingLoc}
                sx={{ flex: 1 }}
              >
                {fetchingLoc ? "Fetching..." : "Use Current"}
              </Button>
            </Stack>

            <TextField
              label="Max Capacity"
              name="capacity"
              value={form.capacity}
              onChange={(e) => {
                const val = e.target.value;

                if (val === "") {
                  setForm((f) => ({ ...f, capacity: "" }));
                  return;
                }

                const num = Number(val);

                if (!Number.isInteger(num) || num < 1) return;

                setForm((f) => ({ ...f, capacity: num }));
              }}
              onWheel={(e) => e.target.blur()}
              error={!!errors.capacity}
              helperText={errors.capacity || "Number of people allowed"}
              fullWidth
              type="text"
              inputProps={{
                inputMode: "numeric",
                pattern: "[0-9]*",
              }}
              sx={{
                "& input[type=number]": {
                  MozAppearance: "textfield",
                },
                "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                  {
                    WebkitAppearance: "none",
                    margin: 0,
                  },
              }}
            />

            <TextField
              select
              label="Visibility"
              name="visibility"
              value={form.visibility}
              onChange={handleChange}
              helperText="Choose who can see this event"
              fullWidth
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      borderRadius: 2,
                      mt: 1,
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(30,30,40,0.95)"
                          : "#fff",
                    },
                  },
                },
              }}
            >
              <MenuItem value="public">Public</MenuItem>

              <MenuItem value="private">Private</MenuItem>
            </TextField>

            <TextField
              select
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              helperText="Current status of the event"
              fullWidth
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      borderRadius: 2,
                      mt: 1,
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(30,30,40,0.95)"
                          : "#fff",
                    },
                  },
                },
              }}
            >
              <MenuItem value="active">Active</MenuItem>
            </TextField>

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.2,
                borderRadius: "8rem",
                background: "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)",
              }}
            >
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <MapPicker
        open={showMap}
        onClose={() => setShowMap(false)}
        onSelect={handleMapSelect}
      />
    </>
  );
}
