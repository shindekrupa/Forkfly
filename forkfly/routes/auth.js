const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Restaurant } = require("../models");
const { wrap, fail, auth } = require("../middleware");

const sign = u => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const safe = u => ({ id: u._id, name: u.name, email: u.email, role: u.role, favorites: u.favorites, restaurant: u.restaurant });

router.post("/register", wrap(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const role = req.body.role || "customer";
  const restaurantName = String(req.body.restaurantName || "").trim();

  if (name.length < 2) throw fail(400, "Name must be at least 2 characters");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw fail(400, "Enter a valid email");
  if (password.length < 6) throw fail(400, "Password must be at least 6 characters");
  if (!["customer", "owner"].includes(role)) throw fail(400, "Invalid account type");   // admins are created in seed.js only
  if (role === "owner" && !restaurantName) throw fail(400, "Restaurant name is required");
  if (await User.findOne({ email })) throw fail(400, "This email is already registered");

  const user = await User.create({ name, email, role, password: await bcrypt.hash(password, 10) });
  if (role === "owner") {
    const last = await Restaurant.findOne().sort({ rid: -1 });
    const r = await Restaurant.create({ rid: last ? last.rid + 1 : 1, name: restaurantName });
    user.restaurant = r.rid;
    await user.save();
  }
  res.status(201).json({ token: sign(user), user: safe(user) });
}));

router.post("/login", wrap(async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email || "").trim().toLowerCase() });
  const ok = user && await bcrypt.compare(String(req.body.password || ""), user.password);
  if (!ok) throw fail(401, "Invalid email or password");
  if (user.status === "Suspended") throw fail(403, "Your account is suspended");
  res.json({ token: sign(user), user: safe(user) });
}));

router.get("/me", auth, (req, res) => res.json(safe(req.user)));

// add or remove a favorite restaurant
router.post("/favorites/:rid", auth, wrap(async (req, res) => {
  const rid = Number(req.params.rid);
  const has = req.user.favorites.includes(rid);
  req.user.favorites = has ? req.user.favorites.filter(x => x !== rid) : [...req.user.favorites, rid];
  await req.user.save();
  res.json({ favorites: req.user.favorites });
}));

module.exports = router;
