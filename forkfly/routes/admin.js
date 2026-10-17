const router = require("express").Router();
const mongoose = require("mongoose");
const { User, Restaurant, Order } = require("../models");
const { wrap, fail, auth, only } = require("../middleware");

router.use(auth, only("admin"));

router.get("/stats", wrap(async (req, res) => {
  const [users, restaurants, orders, revenue, byStatus] = await Promise.all([
    User.countDocuments(),
    Restaurant.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $match: { status: "Delivered" } }, { $group: { _id: null, total: { $sum: "$bill.total" } } }]),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);
  res.json({
    users, restaurants, orders,
    revenue: revenue[0] ? revenue[0].total : 0,
    byStatus: byStatus.map(s => ({ status: s._id, count: s.count })),
  });
}));

router.get("/users", wrap(async (req, res) => {
  res.json(await User.find().select("-password").sort({ createdAt: -1 }));
}));

async function findUser(id) {
  const user = mongoose.isValidObjectId(id) ? await User.findById(id) : null;
  if (!user) throw fail(404, "User not found");
  if (user.role === "admin") throw fail(400, "Admin accounts can't be changed here");
  return user;
}

router.patch("/users/:id/status", wrap(async (req, res) => {
  const user = await findUser(req.params.id);
  user.status = user.status === "Active" ? "Suspended" : "Active";
  await user.save();
  res.json({ status: user.status });
}));

router.delete("/users/:id", wrap(async (req, res) => {
  await (await findUser(req.params.id)).deleteOne();
  res.json({ ok: true });
}));

router.patch("/restaurants/:rid/open", wrap(async (req, res) => {
  const r = await Restaurant.findOne({ rid: Number(req.params.rid) });
  if (!r) throw fail(404, "Restaurant not found");
  r.isOpen = !r.isOpen;
  await r.save();
  res.json({ isOpen: r.isOpen });
}));

router.delete("/restaurants/:rid", wrap(async (req, res) => {
  const rid = Number(req.params.rid);
  await Restaurant.deleteOne({ rid });
  await User.updateMany({ restaurant: rid }, { $unset: { restaurant: 1 } });
  res.json({ ok: true });
}));

module.exports = router;
