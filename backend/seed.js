require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Product = require("./models/Product");

const products = [
  {
    name: "Aurora Wireless Headphones",
    description: "Comfortable wireless headphones with immersive sound, soft ear cushions and all-day battery life.",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    category: "Audio",
    stock: 18,
    featured: true
  },
  {
    name: "Minimal Smart Watch",
    description: "A modern smartwatch for everyday activity tracking, notifications and a clean digital lifestyle.",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
    category: "Wearables",
    stock: 12,
    featured: true
  },
  {
    name: "Urban Backpack",
    description: "Lightweight everyday backpack with a laptop sleeve and organized compartments.",
    price: 44.5,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    category: "Bags",
    stock: 25,
    featured: true
  },
  {
    name: "Mechanical Keyboard",
    description: "Compact mechanical keyboard with tactile switches and a clean minimalist layout.",
    price: 74.0,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80",
    category: "Accessories",
    stock: 20,
    featured: false
  },
  {
    name: "Desk Lamp Pro",
    description: "Adjustable LED desk lamp designed for focused work and comfortable evening reading.",
    price: 35.0,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
    category: "Home",
    stock: 14,
    featured: false
  },
  {
    name: "Classic Sneakers",
    description: "Versatile everyday sneakers with a comfortable sole and timeless low-top silhouette.",
    price: 69.0,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    category: "Fashion",
    stock: 16,
    featured: true
  }
];

async function seed() {
  await connectDB();
  await Product.deleteMany({});
  await Product.insertMany(products);

  const password = await bcrypt.hash("password123", 10);
  await User.findOneAndUpdate(
    { email: "demo@example.com" },
    { name: "Demo User", email: "demo@example.com", password, role: "user" },
    { upsert: true, new: true }
  );

  const adminPassword = await bcrypt.hash("admin123", 10);
  await User.findOneAndUpdate(
    { email: "admin@example.com" },
    { name: "Admin", email: "admin@example.com", password: adminPassword, role: "admin" },
    { upsert: true, new: true }
  );

  console.log("Seed complete");
  await mongoose.connection.close();
}

seed().catch(async err => {
  console.error(err);
  await mongoose.connection.close();
  process.exit(1);
});
