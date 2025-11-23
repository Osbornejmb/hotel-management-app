// Server-side copy of analytics logic used in admin dashboard
// Exposes a function to compute order analysis summary from an array of orders

function generateOrderAnalysisSummary(orders) {
  if (!orders || orders.length === 0) {
    return {
      summary: {
        totalOrders: 0,
        totalItemsOrdered: 0,
        itemFrequency: {},
        itemsByDay: {},
        itemsByRoom: {},
        commonPairings: []
      },
      analysis: {
        peakOrderingDays: [],
        mostFrequentItems: [],
        mostActiveRooms: [],
        mostCommonPairings: [],
        patterns: []
      },
      rawAnalysis: "No order data available for analysis."
    };
  }

  const itemFrequency = {};
  const itemsByDay = {};
  const itemsByRoom = {};
  const pairingMap = {};
  const roomOrderCounts = {};
  const dayOrderCounts = {};

  orders.forEach(order => {
    if (!order || !order.items || order.items.length === 0) return;
    const orderDate = order.checkedOutAt ? new Date(order.checkedOutAt).toISOString().split('T')[0] : 'unknown-date';
    const roomNumber = order.roomNumber || 'unknown-room';

    dayOrderCounts[orderDate] = (dayOrderCounts[orderDate] || 0) + 1;
    roomOrderCounts[roomNumber] = (roomOrderCounts[roomNumber] || 0) + 1;

    const itemNames = [];
    (order.items || []).forEach(item => {
      if (!item) return;
      if (Array.isArray(item.comboContents) && item.comboContents.length > 0) {
        item.comboContents.forEach(component => {
          if (component && component.name) itemNames.push(component.name);
        });
      } else if (item.name) {
        itemNames.push(item.name);
      }
    });

    const uniqueItems = [...new Set(itemNames)];

    uniqueItems.forEach(itemName => {
      itemFrequency[itemName] = (itemFrequency[itemName] || 0) + 1;
      if (!itemsByDay[itemName]) itemsByDay[itemName] = [];
      if (!itemsByDay[itemName].includes(orderDate)) itemsByDay[itemName].push(orderDate);
      if (!itemsByRoom[itemName]) itemsByRoom[itemName] = [];
      if (!itemsByRoom[itemName].includes(roomNumber)) itemsByRoom[itemName].push(roomNumber);
    });

    if (uniqueItems.length > 1) {
      for (let i = 0; i < uniqueItems.length; i++) {
        for (let j = i + 1; j < uniqueItems.length; j++) {
          const pairing = [uniqueItems[i], uniqueItems[j]].sort().join(' + ');
          pairingMap[pairing] = (pairingMap[pairing] || 0) + 1;
        }
      }
    }
  });

  const totalItems = Object.values(itemFrequency).reduce((s, c) => s + c, 0);

  const sortedItemFrequencyFull = Object.entries(itemFrequency).sort((a, b) => b[1] - a[1]);
  const sortedItemFrequency = sortedItemFrequencyFull.slice(0, 10);

  const sortedDays = Object.entries(dayOrderCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const sortedRooms = Object.entries(roomOrderCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const sortedPairings = Object.entries(pairingMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const summary = {
    totalOrders: orders.length,
    totalItemsOrdered: totalItems,
    itemFrequency: Object.fromEntries(sortedItemFrequencyFull),
    itemsByDay: Object.fromEntries(Object.entries(itemsByDay).map(([item, days]) => [item, days.length])),
    itemsByRoom: Object.fromEntries(Object.entries(itemsByRoom).map(([item, rooms]) => [item, rooms.length])),
    commonPairings: sortedPairings.map(([pairing, count]) => ({ pairing, frequency: count }))
  };

  const analysis = {
    peakOrderingDays: sortedDays.map(([day, count]) => ({ date: day, orderCount: count })),
    mostFrequentItems: sortedItemFrequency.map(([name, count]) => ({ name, orderCount: count, daysOrdered: itemsByDay[name]?.length || 0, roomsOrdered: itemsByRoom[name]?.length || 0 })),
    mostActiveRooms: sortedRooms.map(([room, count]) => ({ roomNumber: room, totalOrders: count })),
    mostCommonPairings: sortedPairings.map(([pairing, count]) => ({ items: pairing, frequency: count })),
    patterns: []
  };

  try {
    const lowPerformers = Object.entries(summary.itemFrequency).map(([name, count]) => ({ name, orderCount: count })).sort((a, b) => a.orderCount - b.orderCount).slice(0, 10);
    analysis.lowPerformers = lowPerformers;
  } catch (e) {
    analysis.lowPerformers = [];
  }

  // Minimal recommendations placeholder to keep response shape similar to frontend
  analysis.recommendations = [];

  const rawAnalysis = `Summary generated for ${summary.totalOrders} orders.`;

  return { summary, analysis, rawAnalysis, generatedAt: new Date().toISOString() };
}

module.exports = { generateOrderAnalysisSummary };
