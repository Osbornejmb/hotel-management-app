# Quick Reference: generateOrderAnalysisSummary()

## Function Signature
```javascript
generateOrderAnalysisSummary(orders) → Object
```

## Quick Examples

### Example 1: Basic Usage
```javascript
const analysisResult = generateOrderAnalysisSummary(orders);

// Access summary
console.log(analysisResult.summary.totalOrders);        // e.g., 45
console.log(analysisResult.summary.totalItemsOrdered);  // e.g., 156

// Access analysis
console.log(analysisResult.analysis.peakOrderingDays);  // Array of top days
console.log(analysisResult.analysis.mostFrequentItems); // Top items with stats

// Get formatted report
console.log(analysisResult.rawAnalysis);  // Formatted text report
```

### Example 2: Display Top Items
```javascript
const analysis = generateOrderAnalysisSummary(orders);

analysis.analysis.mostFrequentItems.forEach(item => {
  console.log(`${item.name}: ${item.orderCount} orders (${item.roomsOrdered} rooms)`);
});
```

### Example 3: Find Item Pairings
```javascript
const analysis = generateOrderAnalysisSummary(orders);

console.log("Most commonly paired items:");
analysis.analysis.mostCommonPairings.forEach(pairing => {
  console.log(`${pairing.items}: ${pairing.frequency} times`);
});
```

### Example 4: Analyze Room Behavior
```javascript
const analysis = generateOrderAnalysisSummary(orders);

console.log("Most active rooms:");
analysis.analysis.mostActiveRooms.forEach(room => {
  console.log(`Room ${room.roomNumber}: ${room.totalOrders} orders`);
});
```

### Example 5: Get Insights/Patterns
```javascript
const analysis = generateOrderAnalysisSummary(orders);

console.log("Detected Patterns:");
analysis.analysis.patterns.forEach(pattern => {
  console.log(`• ${pattern}`);
});
```

### Example 6: Find Peak Days
```javascript
const analysis = generateOrderAnalysisSummary(orders);

console.log("Peak Ordering Days:");
analysis.analysis.peakOrderingDays.forEach(day => {
  console.log(`${day.date}: ${day.orderCount} orders`);
});
```

### Example 7: Item Distribution
```javascript
const analysis = generateOrderAnalysisSummary(orders);

console.log("Item Distribution:");
Object.entries(analysis.summary.itemFrequency).forEach(([item, count]) => {
  const days = analysis.summary.itemsByDay[item];
  const rooms = analysis.summary.itemsByRoom[item];
  console.log(`${item}: ${count} orders across ${days} days, ${rooms} rooms`);
});
```

### Example 8: React Integration
```javascript
function OrderAnalytics({ orders }) {
  const [analysis, setAnalysis] = React.useState(null);

  React.useEffect(() => {
    const result = generateOrderAnalysisSummary(orders);
    setAnalysis(result);
  }, [orders]);

  if (!analysis) return <div>Loading...</div>;

  return (
    <div>
      <h2>Total Orders: {analysis.summary.totalOrders}</h2>
      <h3>Top Items:</h3>
      <ul>
        {analysis.analysis.mostFrequentItems.map(item => (
          <li key={item.name}>{item.name}: {item.orderCount} orders</li>
        ))}
      </ul>
    </div>
  );
}
```

## Output Structure Reference

### Summary Object
```javascript
summary: {
  totalOrders: 45,
  totalItemsOrdered: 156,
  itemFrequency: {
    "Pizza Margherita": 15,
    "Caesar Salad": 12,
    // ...
  },
  itemsByDay: {
    "Pizza Margherita": 5,
    "Caesar Salad": 4,
    // ...
  },
  itemsByRoom: {
    "Pizza Margherita": 8,
    "Caesar Salad": 6,
    // ...
  },
  commonPairings: [
    { pairing: "Caesar Salad + Pizza Margherita", frequency: 7 },
    // ...
  ]
}
```

### Analysis Object
```javascript
analysis: {
  peakOrderingDays: [
    { date: "2025-11-10", orderCount: 25 },
    // ...
  ],
  mostFrequentItems: [
    {
      name: "Pizza Margherita",
      orderCount: 15,
      daysOrdered: 5,
      roomsOrdered: 8
    },
    // ...
  ],
  mostActiveRooms: [
    { roomNumber: "305", totalOrders: 8 },
    // ...
  ],
  mostCommonPairings: [
    { items: "Caesar Salad + Pizza Margherita", frequency: 7 },
    // ...
  ],
  patterns: [
    "Peak ordering detected on 2025-11-10 with 25 orders...",
    // ...
  ]
}
```

## Key Metrics Explained

| Metric | Meaning |
|--------|---------|
| `totalOrders` | Number of individual orders |
| `totalItemsOrdered` | Sum of all item quantities across orders |
| `itemFrequency` | How many times each item was ordered |
| `itemsByDay` | How many unique days each item was ordered |
| `itemsByRoom` | How many unique rooms ordered each item |
| `daysOrdered` | Number of unique days an item was ordered |
| `roomsOrdered` | Number of unique rooms that ordered an item |
| `peakOrderingDays` | Days with highest order volume |
| `mostFrequentItems` | Most popular items overall |
| `mostActiveRooms` | Rooms with most orders |
| `mostCommonPairings` | Items most frequently ordered together |

## Empty Dataset Behavior

When `orders` is empty or null:
```javascript
{
  summary: {
    totalOrders: 0,
    totalItems: 0,
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
}
```

## Generated Patterns Examples

The function automatically detects:

1. **Peak Periods**
   - "Peak ordering detected on [date] with [count] orders ([%] above average)"

2. **Popular Items**
   - "[Item]" is the most popular item, appearing in [count] orders ([%] of all items)

3. **Item Pairings**
   - "Strong item pairing detected: '[items]' appears together [count] times"

4. **Active Rooms**
   - "Room [number] is exceptionally active with [count] orders ([%] above average)"

5. **Demand Gaps**
   - "Significant demand gap: '[item1]' outpaces '[item2]' by [difference] orders"

6. **Menu Diversity**
   - "High menu diversity observed with [count] different items ordered"
   - "Limited menu diversity: only [count] items were ordered"

## Helper Functions

### generatePatterns(summary, sortedItems, sortedDays, sortedRooms, sortedPairings, orders)
Analyzes data to identify meaningful trends and patterns. Called internally by `generateOrderAnalysisSummary()`.

### generateRawAnalysis(summary, analysis)
Creates formatted text report. Called internally by `generateOrderAnalysisSummary()`.

## Performance
- **Time Complexity**: O(n) - single pass through orders
- **Space Complexity**: O(m) - where m is unique items + pairings
- **Recommended Usage**: Call on order updates, not every render
