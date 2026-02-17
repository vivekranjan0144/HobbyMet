import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { env } from "../config/env.js";

function signToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

const emailRegex = /^\S+@\S+\.\S+$/;

const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;

const phoneRegex = /^[0-9]{10}$/;

const MIN_PASSWORD_LENGTH = 6;

export async function signup(req, res) {
  try {
    const { username, name, email, phone, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email and password are required" });
    }

    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message:
          "Invalid username. Only letters, numbers, underscore allowed. Min 3 chars.",
      });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (phone && !phoneRegex.test(phone)) {
      return res
        .status(400)
        .json({ message: "Phone must be a 10 digit number" });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
      });
    }

    const normalizedEmail = email.toLowerCase();

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username }],
    });

    if (existing) {
      let conflictField = "User";
      if (existing.email === normalizedEmail) {
        conflictField = "Email";
      } else if (existing.username === username) {
        conflictField = "Username";
      }

      return res
        .status(409)
        .json({ message: `${conflictField} already exists` });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      name,
      email: normalizedEmail,
      phone,
      passwordHash,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
    });

    const token = signToken(user._id.toString());

    return res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone,
        bio: user.bio,
        hobbies: user.hobbies,
        gender: user.gender,
        dob: user.dob,
        privacy: user.privacy,
        location: user.location,
        avatar: user.avatar,
        socialLinks: user.socialLinks,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (e) {
    console.error("Signup error:", e);

    if (e.code === 121 && e.errInfo) {
      return res.status(400).json({
        message: "MongoDB validation failed",
        details: e.errInfo.details,
      });
    }

    if (e.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation error", details: e.message });
    }

    return res.status(500).json({ message: "Signup failed", error: e.message });
  }
}

export async function login(req, res) {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        message: "Email/Username and password are required",
      });
    }

    const identifier = String(emailOrUsername).trim();

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user._id.toString());

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone,
        bio: user.bio,
        hobbies: user.hobbies,
        gender: user.gender,
        dob: user.dob,
        privacy: user.privacy,
        location: user.location,
        avatar: user.avatar,
        socialLinks: user.socialLinks,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ message: "Login failed", error: e.message });
  }
}

export async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.json({
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      hobbies: user.hobbies,
      gender: user.gender,
      dob: user.dob,
      privacy: user.privacy,
      location: user.location,
      avatar: user.avatar,
      socialLinks: user.socialLinks,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    });
  } catch (err) {
    console.error("me() error:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch profile", error: err.message });
  }
}

export function logout(_req, res) {
  return res.status(200).json({
    message:
      "Logged out successfully. Please remove token from client storage.",
  });
}

export async function updatePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newHash;
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Update password error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
}
