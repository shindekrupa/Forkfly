# Forkfly – backend + database

Express + MongoDB (Mongoose) API that also serves the frontend from `public/index.html`.

## Run it
1. Install Node 18+ and MongoDB (local, or a free MongoDB Atlas link).
2. `npm install`
3. Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`.
4. `npm run seed`   (loads restaurants + demo users; **wipes existing data**)
5. `npm start`  then open http://localhost:5000

## Demo logins (from seed)
| Role | Email | Password |
|---|---|---|
| Customer | customer@forkfly.com | customer123 |
| Restaurant owner | owner@forkfly.com | owner123 |
| Admin | admin@forkfly.com | admin123 |

New customers and restaurant owners can sign up in the app. Admins only come from `seed.js`.

## Files
- `models.js` – User, Restaurant (with menu), Order, Review
- `middleware.js` – login check (JWT) and role check
- `routes/auth.js` – register, login, favorites
- `routes/restaurants.js` – list restaurants, reviews and ratings
- `routes/orders.js` – place order (cash on delivery), my orders, track, cancel
- `routes/owner.js` – owner dashboard, order status, menu add/edit/delete, photo, open/closed
- `routes/admin.js` – stats, suspend/delete users, close/delete restaurants
