const router = require("express").Router();
const { Restaurant, Order } = require("../models");
const { wrap, fail, auth, only } = require("../middleware");

router.use(auth, only("customer"));

const EXTRAS = [["Extra Cheese", 30], ["Jalapeno", 20], ["Extra Patty", 80]];
const LARGE_EXTRA = 40;
const COUPON_MIN = { SAVE50: 299, WELCOME20: 0, FREEDELIVERY: 199 };

// place an order (cash on delivery). Prices always come from the database, not the browser.
router.post("/", wrap(async (req, res) => {
  const { items, coupon } = req.body;
  const address = String(req.body.address || "").trim();
  if (!Array.isArray(items) || !items.length || items.length > 30) throw fail(400, "Your cart is empty");
  if (address.length < 5) throw fail(400, "Please enter a delivery address");

  const restaurant = await Restaurant.findOne({ rid: Number(req.body.restaurant) });
  if (!restaurant) throw fail(404, "Restaurant not found");
  if (!restaurant.isOpen) throw fail(400, restaurant.name + " is closed right now");

  const lines = items.map(i => {
    const m = restaurant.menu.find(x => String(x._id) === String(i.menuId));
    if (!m || !m.available) throw fail(400, "An item in your cart is no longer available");
    const qty = Number(i.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) throw fail(400, "Invalid quantity");
    const extras = (Array.isArray(i.extras) ? i.extras : []).filter(x => Number.isInteger(x) && EXTRAS[x]);
    const large = Number(i.size) === 1;
    const price = m.price + (large ? LARGE_EXTRA : 0) + extras.reduce((a, x) => a + EXTRAS[x][1], 0);
    const note = [large ? "Large" : "Regular", ...extras.map(x => EXTRAS[x][0])].join(", ");
    return { name: m.name, emoji: m.emoji, price, qty, note };
  });

  const itemTotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  let fee = restaurant.deliveryFee, discount = 0;

  if (coupon) {
    const code = String(coupon);
    if (!Object.hasOwn(COUPON_MIN, code)) throw fail(400, "Invalid coupon");
    if (itemTotal < COUPON_MIN[code]) throw fail(400, `${code} needs a minimum order of ₹${COUPON_MIN[code]}`);
    if (code === "WELCOME20") {
      if (await Order.exists({ user: req.user._id })) throw fail(400, "WELCOME20 is only for your first order");
      discount = Math.round(itemTotal * 0.2);
    } else if (code === "SAVE50") discount = 50;
    else fee = 0;   // FREEDELIVERY
  }

  const tax = Math.round(itemTotal * 0.05), platformFee = 5;
  const order = await Order.create({
    user: req.user._id,
    customerName: req.user.name,
    restaurant: restaurant.rid,
    items: lines,
    address: address.slice(0, 200),
    instructions: String(req.body.instructions || "").slice(0, 200),
    coupon: coupon ? String(coupon) : undefined,
    bill: { items: itemTotal, fee, tax, platformFee, discount, total: itemTotal + fee + tax + platformFee - discount },
  });
  res.status(201).json(order);
}));

router.get("/mine", wrap(async (req, res) => {
  res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }));
}));

router.get("/:orderNo", wrap(async (req, res) => {
  const order = await Order.findOne({ orderNo: req.params.orderNo, user: req.user._id });
  if (!order) throw fail(404, "Order not found");
  res.json(order);
}));

// customers can cancel until the restaurant starts preparing
router.patch("/:orderNo/cancel", wrap(async (req, res) => {
  const order = await Order.findOne({ orderNo: req.params.orderNo, user: req.user._id });
  if (!order) throw fail(404, "Order not found");
  if (order.status !== "New Order") throw fail(400, "The restaurant has already started this order");
  order.status = "Cancelled";
  await order.save();
  res.json(order);
}));

module.exports = router;
