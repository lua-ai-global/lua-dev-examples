# Tool Examples - Learn by Example

Detailed explanation of every tool in the template.

---

## 📋 Table of Contents

- [Weather Tool](#weather-tool)
- [User Data Tools](#user-data-tools)
- [Product Tools](#product-tools)
- [Basket Tools](#basket-tools)
- [Order Tools](#order-tools)
- [Custom Data Tools](#custom-data-tools)
- [Payment Tool](#payment-tool)
- [Post Tool](#post-tool)

---

## Weather Tool

### File: `src/tools/GetWeatherTool.ts`

**What it does:** Fetches real-time weather for any city using Open-Meteo API.

**Key Features:**
- ✅ External API integration
- ✅ No API key required (free service)
- ✅ Two-step process (geocoding + weather)
- ✅ Error handling for invalid cities

**Code Walkthrough:**

```typescript
async execute(input: { city: string }) {
  // Step 1: Convert city name to coordinates
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input.city)}&count=1`;
  const geoRes = await fetch(geoUrl);
  const geoData = await geoRes.json();
  
  if (!geoData.results?.[0]) {
    throw new Error(`City not found: ${input.city}`);
  }
  
  const { latitude, longitude, name } = geoData.results[0];
  
  // Step 2: Get weather for coordinates
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
  const weatherRes = await fetch(weatherUrl);
  const weatherData = await weatherRes.json();
  
  return {
    city: name,
    temperature: weatherData.current_weather.temperature,
    windSpeed: weatherData.current_weather.windspeed
  };
}
```

**Learn from this:**
- How to call external APIs
- How to handle API responses
- How to chain multiple API calls
- How to handle errors gracefully

**Use it for:**
- Weather information
- Location services
- Any external API integration

**Customize:**
```typescript
// Add weather recommendations
return {
  ...weather,
  recommendation: weather.temperature < 10 
    ? "Bring a jacket!" 
    : "Perfect weather!"
};
```

---

## User Data Tools

### File: `src/tools/UserDataTool.ts`

Contains 2 tools for user management.

---

### Tool 1: GetUserDataTool

**What it does:** Retrieves current user's data from Lua platform.

**Code:**
```typescript
async execute(input: {}) {
  return User.get();
}
```

**Returns:**
```typescript
{
  id: string;
  email: string;
  name: string;
  // ... other user fields
}
```

**Learn from this:**
- Simplest possible tool
- Platform API usage
- No input required

**Use it for:**
- Displaying user profile
- Personalizing responses
- User verification

---

### Tool 2: UpdateUserDataTool

**What it does:** Updates user's data.

**Code:**
```typescript
async execute(input: { data: { name?: string; age?: number } }) {
  const user = await User.get();
  return await user.update(input.data);
}
```

**Learn from this:**
- Getting instance first
- Partial updates (optional fields)
- Chaining operations

**Use it for:**
- Profile updates
- Preference changes
- User data management

---

## Product Tools

### File: `src/tools/ProductsTool.ts`

Contains 6 tools for complete product management.

---

### 1. SearchProductsTool

**What it does:** Searches product catalog.

```typescript
async execute(input: { query: string }) {
  return await Products.search(input.query);
}
```

**Use when:** Users describe what they're looking for

---

### 2. GetAllProductsTool

**What it does:** Lists all products with pagination.

```typescript
async execute(input: { page?: number; limit?: number }) {
  return await Products.get(input.page, input.limit);
}
```

**Use when:** Browsing catalog, showing inventory

---

### 3. CreateProductTool

**What it does:** Adds new product to catalog.

```typescript
async execute(input: { 
  product: { name: string; description: string; price: number } 
}) {
  return Products.create({ 
    ...input.product, 
    id: uuidv4()  // Generate unique ID
  });
}
```

**Use when:** Admin adding new products

---

### 4. UpdateProductTool

**What it does:** Modifies existing product.

```typescript
async execute(input: { 
  product: { id: string; name: string; description: string; price: number } 
}) {
  return Products.update(input.product, input.product.id);
}
```

**Use when:** Updating prices, descriptions, etc.

---

### 5. GetProductByIdTool

**What it does:** Gets specific product details.

```typescript
async execute(input: { id: string }) {
  return Products.getById(input.id);
}
```

**Use when:** Need full product details

---

### 6. DeleteProductTool

**What it does:** Removes product from catalog.

```typescript
async execute(input: { id: string }) {
  return Products.delete(input.id);
}
```

**Use when:** Discontinuing products

---

## Basket Tools

### File: `src/tools/BasketTool.ts`

Contains 9 tools for complete shopping cart flow.

---

### The Complete Shopping Flow

```
create_basket
    ↓
add_to_basket (multiple items)
    ↓
update_basket_metadata (shipping info, etc.)
    ↓
checkout_basket
    ↓
Order created!
```

---

### Tool Breakdown

**1. CreateBasketTool** - Start shopping
```typescript
async execute(input: { currency: string }) {
  return Baskets.create({ currency: input.currency });
}
```

**2. AddItemToBasketTool** - Add products
```typescript
async execute(input: { basketId, productId, quantity }) {
  const product = await Products.getById(input.productId);
  return Baskets.addItem(input.basketId, {
    id: input.productId,
    price: product.price,
    quantity: input.quantity
  });
}
```

**3. RemoveItemFromBasketTool** - Remove products
**4. ClearBasketTool** - Empty cart
**5. UpdateBasketStatusTool** - Change status
**6. UpdateBasketMetadataTool** - Add notes, shipping info
**7. CheckoutBasketTool** - Convert to order
**8. GetBasketByIdTool** - View specific basket
**9. GetBasketsTool** - List all baskets

**Learn from this:**
- Multi-step workflows
- State management
- Business logic
- API chaining

---

## Order Tools

### File: `src/tools/OrderTool.ts`

Contains 4 tools for order management.

---

### Tool Breakdown

**1. CreateOrderTool** - Create from basket
```typescript
async execute(input: { basketId, data }) {
  return Orders.create({
    basketId: input.basketId,
    data: input.data
  });
}
```

**2. UpdateOrderStatusTool** - Update fulfillment status
```typescript
async execute(input: { orderId, status }) {
  return Orders.updateStatus(input.status, input.orderId);
}
```

Statuses: `pending` → `confirmed` → `fulfilled` or `cancelled`

**3. GetOrderByIdTool** - Get order details
**4. GetUserOrdersTool** - List user's orders

---

## Custom Data Tools

### File: `src/tools/CustomDataTool.ts`

Contains 6 tools for movie database (demonstrates custom data + vector search).

---

### The Power of Vector Search

**Traditional search:**
- Query: "Inception" → Finds "Inception" ✅
- Query: "dream movie" → Finds nothing ❌

**Vector search:**
- Query: "Inception" → Finds "Inception" ✅
- Query: "dream movie" → Finds "Inception"! ✅ (semantic understanding)

---

### Tool Breakdown

**1. CreateMovieTool** - Add movie with search indexing

```typescript
async execute(input: { title, director, year, genre }) {
  // Create searchable text
  const searchText = `${input.title} ${input.director} ${input.genre}`;
  
  return Data.create('movies', input, searchText);
}
```

**Key:** The `searchText` parameter enables vector search!

---

**2. SearchMoviesTool** - Semantic search

```typescript
async execute(input: { query: string }) {
  return Data.search('movies', input.query, 10, 0.7);
}
```

**Try:**
- "sci-fi thriller about dreams" → Finds Inception!
- "Christopher Nolan movies" → Finds his films!
- "mind-bending" → Finds similar themes!

**Scores:**
- `1.0` = Perfect match
- `0.8-0.9` = Very similar
- `0.7-0.8` = Somewhat similar
- `<0.7` = Different

---

**3. GetMoviesTool** - List all
**4. GetMovieByIdTool** - Get specific
**5. UpdateMovieTool** - Modify details
**6. DeleteMovieTool** - Remove movie

**Learn from this:**
- Vector search implementation
- Custom data collections
- Semantic similarity
- CRUD patterns

**Use it for:**
- Knowledge bases
- FAQs
- Documentation search
- Product recommendations
- Content discovery

---

## Payment Tool

### File: `src/tools/PaymentTool.ts`

**What it does:** Creates Stripe payment links.

**Code:**
```typescript
async execute(input: { 
  amount: number; 
  currency: string; 
  description: string 
}) {
  const stripeKey = env('STRIPE_API_KEY');
  
  if (!stripeKey) {
    throw new Error('Stripe not configured');
  }
  
  // Call Stripe API...
  return { paymentUrl: "https://checkout.stripe.com/..." };
}
```

**Learn from this:**
- Environment variables
- API key management
- Payment integration
- Security best practices

**Requires:**
- `.env` file with `STRIPE_API_KEY=sk_test_...`
- Stripe account

---

## Post Tool

### File: `src/tools/CreatePostTool.ts`

**What it does:** Simple example of creating a post.

**Code:**
```typescript
async execute(input: { title: string; content: string }) {
  return {
    id: Math.random().toString(36),
    title: input.title,
    content: input.content,
    createdAt: new Date().toISOString()
  };
}
```

**Learn from this:**
- Simplest tool pattern
- ID generation
- Timestamp handling
- Returning structured data

**Use it for:**
- Starting point for new tools
- Simple data creation
- Learning the basics

---

## 🎯 Recommended Learning Order

### 1. Start Simple
**Read:** `CreatePostTool.ts`  
**Why:** Simplest example, easy to understand

### 2. External API
**Read:** `GetWeatherTool.ts`  
**Why:** Shows API integration pattern

### 3. Platform API
**Read:** `UserDataTool.ts`  
**Why:** Shows platform API usage

### 4. CRUD Pattern
**Read:** `ProductsTool.ts`  
**Why:** Complete CRUD operations

### 5. Vector Search
**Read:** `CustomDataTool.ts`  
**Why:** Advanced feature, very powerful

### 6. Complex Workflow
**Read:** `BasketTool.ts`  
**Why:** Multi-step business logic

---

## 💡 How to Use These Examples

### Approach 1: Copy and Modify

1. Find similar tool (e.g., `CustomDataTool.ts` for searchable data)
2. Copy the file
3. Rename (e.g., `ArticleTool.ts`)
4. Update names, descriptions
5. Modify logic for your domain

**Time:** 15-30 minutes per tool

---

### Approach 2: Learn Pattern, Build New

1. Read an example tool
2. Understand the pattern
3. Close the file
4. Build your own from memory
5. Refer back if stuck

**Time:** 30-60 minutes per tool  
**Learning:** Deeper understanding

---

### Approach 3: Mix and Match

1. Keep useful examples as-is
2. Delete irrelevant ones
3. Add your custom tools alongside
4. Deploy mix of examples + custom

**Time:** Variable  
**Best for:** Quick prototyping

---

## 🔧 Customization Examples

### Make Weather More Useful

```typescript
async execute(input: { city: string }) {
  const weather = await this.getWeather(input.city);
  
  // Add recommendations
  const temp = weather.temperature;
  let advice = "";
  if (temp < 10) advice = "🧥 Wear a warm jacket";
  else if (temp < 20) advice = "👕 Light jacket recommended";
  else advice = "☀️ T-shirt weather!";
  
  return {
    ...weather,
    clothingAdvice: advice,
    emoji: temp < 10 ? "❄️" : temp < 20 ? "🌤️" : "☀️"
  };
}
```

---

### Add Business Logic to Products

```typescript
async execute(input: { query: string; maxPrice?: number }) {
  const results = await Products.search(input.query);
  
  // Filter by price if specified
  let products = results.data;
  if (input.maxPrice) {
    products = products.filter(p => p.price <= input.maxPrice);
  }
  
  // Add availability message
  return {
    products: products.map(p => ({
      ...p,
      message: p.inStock 
        ? "✅ Available for immediate delivery"
        : "⏰ Back in stock in 2 weeks"
    })),
    total: products.length
  };
}
```

---

### Enhance Search with Scoring

```typescript
async execute(input: { query: string }) {
  const results = await Data.search('movies', input.query, 10, 0.6);
  
  return {
    movies: results.map(entry => ({
      title: entry.title,
      director: entry.director,
      year: entry.year,
      score: entry.score,
      matchQuality: entry.score > 0.9 ? "🌟 Excellent match" :
                    entry.score > 0.8 ? "✅ Good match" :
                    entry.score > 0.7 ? "👍 Fair match" :
                                        "🤔 Possible match"
    })),
    tip: "Higher scores = better matches"
  };
}
```

---

## 🎯 Quick Reference

| Tool | File | API Used | Complexity | Start Here? |
|------|------|----------|------------|-------------|
| Create Post | CreatePostTool.ts | None | ⭐ Easy | ✅ Yes |
| Get Weather | GetWeatherTool.ts | External | ⭐⭐ Medium | ✅ Yes |
| User Data | UserDataTool.ts | User | ⭐ Easy | ✅ Yes |
| Products | ProductsTool.ts | Products | ⭐⭐ Medium | After basics |
| Custom Data | CustomDataTool.ts | Data | ⭐⭐⭐ Advanced | After CRUD |
| Baskets | BasketTool.ts | Baskets | ⭐⭐⭐ Complex | After APIs |
| Orders | OrderTool.ts | Orders | ⭐⭐ Medium | With Baskets |
| Payment | PaymentTool.ts | External + env | ⭐⭐⭐ Advanced | Last |

---

## 🚀 Next Steps

1. **Read** the code for 2-3 tools
2. **Test** them with `lua test`
3. **Modify** one tool slightly
4. **Test** your changes
5. **Build confidence** to create your own

---

**For complete API reference, see `../API_REFERENCE.md`**  
**For project guide, see `README.md`**

