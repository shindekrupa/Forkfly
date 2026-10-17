const router = require("express").Router();
const { Restaurant, Order, Review } = require("../models");
const { wrap, fail, auth, only } = require("../middleware");

router.get("/", wrap(async (req, res) => {
  res.json(await Restaurant.find().sort({ rid: 1 }));
}));

router.get("/:rid/reviews", wrap(async (req, res) => {
  res.json(await Review.find({ restaurant: Number(req.params.rid) }).sort({ createdAt: -1 }).limit(20));
}));

// customers can review a restaurant after one of their orders was delivered
router.post("/:rid/reviews", auth, only("customer"), wrap(async (req, res) => {
  const rid = Number(req.params.rid);
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || "").slice(0, 300);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw fail(400, "Rating must be between 1 and 5");

  const restaurant = await Restaurant.findOne({ rid });
  if (!restaurant) throw fail(404, "Restaurant not found");
  if (!await Order.exists({ user: req.user._id, restaurant: rid, status: "Delivered" }))
    throw fail(400, "You can review a restaurant after a delivered order");

  await Review.create({ restaurant: rid, user: req.user._id, userName: req.user.name, rating, comment });

  // keep the average rating up to date
  const total = restaurant.rating * restaurant.reviewCount + rating;
  restaurant.reviewCount += 1;
  restaurant.rating = Math.round((total / restaurant.reviewCount) * 10) / 10;
  await restaurant.save();
  res.status(201).json({ rating: restaurant.rating, reviewCount: restaurant.reviewCount });
}));

module.exports = router;
