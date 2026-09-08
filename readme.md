# CodeAlpha E-Commerce Store

A basic full-stack e-commerce project built for the CodeAlpha task.

## Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB + Mongoose
- Authentication: JWT + bcryptjs

## Features

- Product listing and search/filter
- Product details
- Shopping cart using localStorage
- User registration/login
- Protected checkout
- Order creation and order history
- Stock validation
- Admin-ready product/order APIs
- Responsive UI

## Requirements

- Node.js 18+
- MongoDB local instance or MongoDB Atlas

## Run

```bash
cd backend
npm install
cp .env
npm run seed
npm run dev
```

Then open http://localhost:5000

The frontend is served by Express, so no separate frontend server is required.
