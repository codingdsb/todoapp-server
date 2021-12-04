const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../constants");

router.post("/user/new", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username) return res.status(400).send({ error: "Username is required" });
  if (!email) return res.status(400).send({ error: "Email is required" });
  if (!password) return res.status(400).send({ error: "Password is required" });

  if (username.length < 3)
    return res
      .status(400)
      .json({ error: "Username must be at least 3 characters" });

  if (password.length < 6)
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });

  if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
    return res.status(400).json({ error: "Please enter a valid email" });

  let user;

  user = await User.findOne({ email });
  if (user) return res.status(400).json({ error: "Email already taken" });

  user = await User.findOne({ username });
  if (user) return res.status(400).json({ error: "Username already taken" });

  const hashedPassword = bcrypt.hashSync(password, 10);

  user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  if (!user) {
    return res.status(400).json({ error: "Error creating your account" });
  }

  return res.status(201).json({
    message: "Account created successfully",
    user,
    token: user.generateAuthToken(),
  });
});

router.post("/user/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "Please enter all fields" });

  const user = await User.findOne({ username }).populate("todos");

  if (!user) return res.status(400).json({ error: "User not found" });
  if (!bcrypt.compareSync(password, user.password))
    return res.status(400).json({ error: "Incorrect password" });
  return res.status(200).json({
    message: "Logged in successfully",
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      todos: user.todos,
    },
    token: user.generateAuthToken(),
  });
});

router.get("/user/details", async (req, res) => {
  try {
    const token = req.headers["x-access-token"];

    const decodedData = jwt.verify(token, JWT_SECRET);

    if (!decodedData) return res.status(401).json({ error: "Invalid token" });

    const idFromToken = decodedData._id;

    const user = await User.findById(idFromToken).populate("todos");

    if (!user) return res.status(400).json({ error: "User not found" });

    return res.status(200).json({
      message: "Found user details",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        todos: user.todos,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

module.exports = router;
