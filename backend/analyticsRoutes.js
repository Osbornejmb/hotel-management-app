const express = require('express');
const router = express.Router();
const { Order } = require('./Order');
const Food = require('./Food');
const { generateOrderAnalysisSummary } = require('./analytics');

// GET /api/analytics/summary
router.get('/summary', async (req, res) => {
  try {
    // Fetch all completed/checked out orders for analysis
    const orders = await Order.find({}).lean().exec();
    // Also fetch current food catalog to map historical item records to current names
    const foods = await Food.find({}).lean().exec();

    // Build lookup maps for matching
    const foodsByImg = {};
    const foodsByPriceCat = {};
    const foodsByName = {};
    (foods || []).forEach(f => {
      if (!f) return;
      if (f.img) foodsByImg[f.img] = f;
      const key = `${f.price || ''}|${(f.category || '').toString().toLowerCase()}`;
      if (!foodsByPriceCat[key]) foodsByPriceCat[key] = [];
      foodsByPriceCat[key].push(f);
      if (f.name) foodsByName[f.name.toString().toLowerCase()] = f;
    });

    const mapName = (raw) => {
      if (!raw) return raw;
      const name = (raw.name || raw).toString();
      const lname = name.toLowerCase();
      // exact current name
      if (foodsByName[lname]) return foodsByName[lname].name;
      // match by image
      if (raw.img && foodsByImg[raw.img]) return foodsByImg[raw.img].name;
      // match by price+category
      const key = `${raw.price || ''}|${(raw.category || '').toString().toLowerCase()}`;
      const list = foodsByPriceCat[key] || [];
      if (list.length === 1) return list[0].name;
      // fallback to original stored name
      return name;
    };

    // Create a mapped copy of orders where item/component names are replaced by current names when we can match
    const mappedOrders = (orders || []).map(order => {
      if (!order || !order.items) return order;
      const newItems = (order.items || []).map(it => {
        if (!it) return it;
        const copy = { ...it };
        if (Array.isArray(copy.comboContents) && copy.comboContents.length > 0) {
          copy.comboContents = copy.comboContents.map(c => ({ ...(c || {}), name: mapName(c) }));
        }
        copy.name = mapName(copy);
        return copy;
      });
      return { ...order, items: newItems };
    });

    const analysis = generateOrderAnalysisSummary(mappedOrders);
    res.json(analysis);
  } catch (err) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ error: 'Failed to generate analytics summary' });
  }
});

module.exports = router;
