const express = require("express");
const Product = require("../models/Product");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { search, category, featured } = req.query;
    const filter = {};
    if (search)
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    if (category && category !== "all") filter.category = category;
    if (featured === "true") filter.featured = true;

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch {
    res.status(500).json({ message: "Could not load products" });
  }
});

router.get("/categories", async (_req, res) => {
  const categories = await Product.distinct("category");
  res.json(categories);
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch {
    res.status(400).json({ message: "Invalid product ID" });
  }
});

router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch {
    res.status(400).json({ message: "Invalid product data" });
  }
});

router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch {
    res.status(400).json({ message: "Could not update product" });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ message: "Product deleted" });
});

module.exports = router;
