const jwt = require("jsonwebtoken");
const { User } = require("./models");

// lets async route handlers send their errors to the error handler
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const fail = (status, message) => Object.assign(new Error(message), { status });

// requires a valid login token, sets req.user
const auth = wrap(async (req, res, next) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) throw fail(401, "Please log in");
  let id;
  try { id = jwt.verify(token, process.env.JWT_SECRET).id; }
  catch { throw fail(401, "Session expired, please log in again"); }
  const user = await User.findById(id);
  if (!user) throw fail(401, "User not found");
  if (user.status === "Suspended") throw fail(403, "Your account is suspended");
  req.user = user;
  next();
});

// restricts a route to certain roles, use after auth
const only = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(fail(403, "Not allowed"));

module.exports = { wrap, fail, auth, only };
