const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: "Cart is empty" });

    const ids = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: ids } });

    if (products.length !== ids.length) return res.status(400).json({ message: "One or more products no longer exist" });

    const productMap = new Map(products.map(p => [String(p._id), p]));
    const orderItems = [];
    let total = 0;

    for (const item of items) {
      const product = productMap.get(String(item.productId));
      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: "Invalid quantity" });
      if (quantity > product.stock) return res.status(400).json({ message: `${product.name} has only ${product.stock} left` });

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity
      });
      total += product.price * quantity;
    }

    if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.address || !shippingAddress?.city || !shippingAddress?.postalCode) {
      return res.status(400).json({ message: "Complete shipping information is required" });
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount: Number(total.toFixed(2)),
      shippingAddress
    });

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    res.status(201).json(order);
  } catch {
    res.status(500).json({ message: "Could not process order" });
  }
});

router.get("/mine", protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

router.get("/", protect, adminOnly, async (_req, res) => {
  const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
  res.json(orders);
});

router.get("/:id", protect, async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (req.user.role !== "admin" && String(order.user._id) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not allowed" });
  }
  res.json(order);
});

router.patch("/:id/status", protect, adminOnly, async (req, res) => {
  const allowed = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid status" });

  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
});

module.exports = router;
