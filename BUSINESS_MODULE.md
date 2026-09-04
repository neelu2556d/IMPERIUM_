# Business Module

The Business module is a comprehensive garment business management system built into Vitality. It helps garment manufacturers and traders manage their entire workflow from lot creation to order fulfillment, inventory tracking, and financial reporting.

## Features

### 🏭 Lot Management
- Create and track garment lots (fabric rolls, garments, etc.)
- Monitor stock levels per color (top, bottom, dupatta)
- Track lot status: Arrived → Active → Low Stock → Cleared → Dead Stock
- Store design photos and arrival dates

### 👥 Party Management
- Manage suppliers and buyers (parties)
- Store rate cards (pricing per item type)
- Set payment terms and GST preferences
- Track outstanding balances

### 📝 Order Management
- Create orders against specific lots and parties
- Automatic calculation of totals, GST, discounts
- Multi-color order support
- Payment terms tracking
- Order status tracking

### 📊 Registers & Reports
- **Stock Register**: Real-time inventory deduction
- **Sales Register**: Auto-populated sales tracking
- **Party Ledger**: Outstanding balances and due dates
- **Collection Register**: Pending payment tracking
- **Analytics Reports**:
  - Per Day Sales (bar chart)
  - Party-wise Breakdown
  - Item-wise Analysis
  - Reverse Engineering Summary (forecasting)

### 🤖 Imperium AI Integration
- AI-powered business insights
- Party visit recommendations
- Stock alert predictions
- Monthly performance analysis

## Access Control

This module is strictly limited to a single authorized user: `writer.nishant2809@gmail.com`
- Server-side validation on all API routes
- Client-side UI restriction
- Row Level Security (RLS) policies in Supabase

## Database Schema

The module creates the following tables with RLS policies:
- `business_lots` - Core lot entities
- `lot_stock` - Stock per color within lots
- `business_parties` - Suppliers/buyers with rate cards
- `business_orders` - Customer orders
- `order_items` - Line items per color in orders
- `business_stock_register` - Real-time inventory deductions
- `business_sales_register` - Auto-populated sales
- `business_party_ledger` - Outstanding party balances
- `business_collection_register` - Pending payments

## API Endpoints

All endpoints are under `/api/business/*` and require authentication as the business owner:

### Lots
- `GET /api/business/lots` - List all lots
- `POST /api/business/lots` - Create new lot
- `GET /api/business/lots/[id]` - Get lot details
- `PUT /api/business/lots/[id]` - Update lot
- `DELETE /api/business/lots/[id]` - Delete lot

### Parties
- `GET /api/business/parties` - List all parties
- `POST /api/business/parties` - Create new party
- `GET /api/business/parties/[id]` - Get party details
- `PUT /api/business/parties/[id]` - Update party
- `DELETE /api/business/parties/[id]` - Delete party

### Orders
- `GET /api/business/orders` - List all orders
- `POST /api/business/orders` - Create new order
- `GET /api/business/orders/[id]` - Get order details
- `PUT /api/business/orders/[id]` - Update order
- `DELETE /api/business/orders/[id]` - Delete order

### Reports
- `GET /api/business/reports?period=[monthly|quarterly|half_yearly|yearly]` - Generate reports

## Frontend Components

- `BusinessModule.tsx` - Main tabbed interface
- `LotsTab.tsx` - Lot management view
- `OrdersTab.tsx` - Order tracking
- `StockTab.tsx` - Inventory register
- `SalesTab.tsx` - Sales tracking
- `PartyTab.tsx` - Party ledger
- `CollectionTab.tsx` - Collection tracking
- `ReportsTab.tsx` - Analytics and charts
- `ImperiumTab.tsx` - AI-powered insights

## Styling

Uses Vitality's design system:
- Pure black background (`#04060a`)
- Mint accents (`#6ee7b7`)
- Inter font family
- Vanilla CSS (no Tailwind)
- CSS modules for component scoping

## Testing

Run tests with:
```bash
pnpm test
```

The module includes tests for:
- API route handlers
- Business logic calculations
- Component rendering
- Form validation
- RLS policy compliance

## Deployment

1. Run the Supabase migration: `supabase/migrations/20260903_business_schema.sql`
2. Deploy the Next.js application
3. Ensure environment variables are set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (for server-side operations)
   - `ANTHROPIC_API_KEY` (for Imperium AI features)

## Usage

1. Navigate to the Business tile from the dashboard
2. Create your first lot (fabric/garment inventory)
3. Add parties (suppliers/buyers)
4. Create orders against lots and parties
5. Monitor stock levels in real-time
6. Generate reports for business insights
7. Use Imperium AI for intelligent recommendations

---

*Built for Vitality - An open-source multi-user life dashboard*