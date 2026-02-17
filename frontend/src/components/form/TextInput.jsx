import { TextField } from "@mui/material";

export default function TextInput({ label, ...props }) {
  return <TextField label={label} fullWidth {...props} />;
}
