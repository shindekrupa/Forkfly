const router = require("express").Router();
const { Restaurant, Order, STATUSES } = require("../models");
const { wrap, fail, auth, only } = require("../middleware");

router.use(auth, only("owner"));

// load the owner's restaurant for every request below
router.use(wrap(async (req, res, next) => {
  req.rest = await Restaurant.findOne({ rid: req.user.restaurant });
  if (!req.rest) throw fail(404, "No restaurant is linked to this account");
  next();
}));

router.get("/dashboard", wrap(async (req, res) => {
  const rid = req.rest.rid;
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const todays = await Order.find({ restaurant: rid, createdAt: { $gte: start } });
  const stats = {
    today: todays.length,
    revenue: todays.filter(o => o.status !== "Cancelled").reduce((a, o) => a + o.bill.total, 0),
    pending: await Order.countDocuments({ restaurant: rid, status: { $nin: ["Delivered", "Cancelled"] } }),
    completed: todays.filter(o => o.status === "Delivered").length,
  };
  const orders = await Order.find({ restaurant: rid }).sort({ createdAt: -1 }).limit(30);
  res.json({ restaurant: req.rest, orders, stats });
}));

// move an order to the next status, or reject it
router.patch("/orders/:orderNo", wrap(async (req, res) => {
  const order = await Order.findOne({ orderNo: req.params.orderNo, restaurant: req.rest.rid });
  if (!order) throw fail(404, "Order not found");
  if (["Delivered", "Cancelled"].includes(order.status)) throw fail(400, "This order is already closed");
  order.status = req.body.action === "reject" ? "Cancelled" : STATUSES[STATUSES.indexOf(order.status) + 1];
  await order.save();
  res.json(order);
}));

router.put("/restaurant", wrap(async (req, res) => {
  const { image, isOpen } = req.body;
  if (image !== undefined) {
    if (image && !/^https?:\/\/[^\s'"()<>]+$/.test(image)) throw fail(400, "Enter a valid http(s) image URL");
    req.rest.image = image;
  }
  if (isOpen !== undefined) req.rest.isOpen = !!isOpen;
  await req.rest.save();
  res.json(req.rest);
}));

function cleanItem(b) {
  const name = String(b.name || "").trim();
  const price = Number(b.price);
  if (!name) throw fail(400, "Item name is required");
  if (!(price > 0)) throw fail(400, "Price must be greater than 0");
  return {
    name, price,
    description: String(b.description || "").trim().slice(0, 150),
    category: String(b.category || "Main Course").trim().slice(0, 40),
    emoji: String(b.emoji || "🍽️").trim().slice(0, 8),
    veg: !!b.veg,
  };
}
const findItem = (req) => {
  const item = req.rest.menu.find(x => String(x._id) === req.params.id);
  if (!item) throw fail(404, "Menu item not found");
  return item;
};

router.post("/menu", wrap(async (req, res) => {
  req.rest.menu.push(cleanItem(req.body));
  await req.rest.save();
  res.status(201).json(req.rest);
}));

router.put("/menu/:id", wrap(async (req, res) => {
  const item = findItem(req);
  if (Object.keys(req.body).join() === "available") item.available = !!req.body.available;   // availability toggle
  else item.set(cleanItem(req.body));
  await req.rest.save();
  res.json(req.rest);
}));

router.delete("/menu/:id", wrap(async (req, res) => {
  req.rest.menu.pull(findItem(req)._id);
  await req.rest.save();
  res.json(req.rest);
}));

module.exports = router;
