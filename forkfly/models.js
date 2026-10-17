const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const STATUSES = ["New Order", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled"];

const User = model("User", new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["customer", "owner", "admin"], default: "customer" },
  status: { type: String, enum: ["Active", "Suspended"], default: "Active" },
  favorites: [Number],   // restaurant rid values
  restaurant: Number,    // rid of the restaurant (owners only)
}, { timestamps: true }));

const menuItem = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true, min: 1 },
  veg: { type: Boolean, default: true },
  emoji: { type: String, default: "🍽️" },
  category: { type: String, default: "Main Course" },
  available: { type: Boolean, default: true },
});

const Restaurant = model("Restaurant", new Schema({
  rid: { type: Number, unique: true },        // simple numeric id used by the frontend
  name: { type: String, required: true, trim: true },
  cuisine: { type: String, default: "Indian" },
  emoji: { type: String, default: "🍽️" },
  image: { type: String, default: "" },       // optional photo URL
  gradient: { type: String, default: "#ffd9a8,#ffb36b" },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  deliveryTime: { type: String, default: "30–40" },
  deliveryFee: { type: Number, default: 20 },
  priceRange: { type: String, default: "₹100–₹500" },
  distance: { type: Number, default: 2 },
  pureVeg: { type: Boolean, default: false },
  offer: { type: String, default: "" },
  isOpen: { type: Boolean, default: true },
  menu: [menuItem],
}, { timestamps: true }));

const Order = model("Order", new Schema({
  orderNo: { type: String, unique: true, default: () => "FD" + Math.floor(100000 + Math.random() * 900000) },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  customerName: String,
  restaurant: { type: Number, required: true },   // rid
  items: [{ name: String, emoji: String, price: Number, qty: Number, note: String }],
  address: String,
  instructions: String,
  coupon: String,
  bill: { items: Number, fee: Number, tax: Number, platformFee: Number, discount: Number, total: Number },
  payment: { type: String, default: "Cash on Delivery" },
  status: { type: String, enum: STATUSES, default: "New Order" },
}, { timestamps: true }));

const Review = model("Review", new Schema({
  restaurant: { type: Number, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  userName: String,
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: "" },
}, { timestamps: true }));

module.exports = { User, Restaurant, Order, Review, STATUSES };
