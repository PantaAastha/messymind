# Messy Mind - E-Commerce Behavioral Diagnostics Tool

A Next.js + Supabase diagnostic tool that analyzes Shopify/GA4 behavioral metrics using a rules-based knowledge engine to detect psychological friction patterns in the e-commerce "Messy Middle."

## 🎯 Overview

Messy Mind helps e-commerce businesses identify and address behavioral friction patterns that prevent shoppers from completing purchases. The tool analyzes session data to detect patterns like Comparison Paralysis, Trust Deficit, Value Uncertainty, and more, then provides actionable intervention recommendations.

## 🏗️ Architecture

### Pattern-Based System

Each behavioral pattern follows a 4-layer structure:

1. **Inputs** - Essential & high-value metrics from GA4/Shopify
2. **Detection Rules** - Multi-rule system with confidence scoring
3. **Primary Drivers** - Canonical behavioral signals
4. **Interventions** - Fixed buckets with primary/secondary mapping

### Data Flow

```
CSV Upload → Parse & Validate → Calculate Session Metrics → 
Run Detection Rules → Generate Drivers → Map Interventions → 
Output Diagnosis
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20.9.0 or higher
- Supabase account
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd messymind
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key  # For seeding patterns
```

3. Set up Supabase database:

Run the migration script in your Supabase SQL editor:

```bash
# Copy contents of supabase/migrations/001_initial_schema.sql
# and run in Supabase SQL Editor
```

4. Seed the knowledge base:

```bash
npx tsx scripts/seedPatterns.ts
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📊 Current Implementation Status

### ✅ Completed

- **Phase 1: Foundation & Setup**
  - Next.js 14+ with TypeScript and App Router
  - Supabase client configuration and middleware
  - Complete database schema with RLS policies
  - Comprehensive type definitions

- **Phase 2: Knowledge Base Architecture**
  - Pattern schema design
  - Complete Comparison Paralysis pattern definition
  - Pattern registry system
  - Knowledge base seeding utilities

- **Phase 4: Metrics Calculation Engine**
  - CSV parser with validation
  - Session-level metrics calculator
  - Aggregate metrics computation
  - Data quality checks

- **Phase 5: Rules-Based Detection Engine**
  - Rule evaluation engine
  - Confidence scoring system
  - Primary drivers detection
  - Intervention mapping
  - Diagnosis output generator

### 🚧 In Progress

- **Phase 3: Authentication & User Management**
- **Phase 6: UI Components & Pages**
- **Phase 7: Comparison Paralysis Implementation** (backend complete, UI pending)

### 📋 Planned

- **Phase 8: Additional Patterns** (Trust Deficit, Value Uncertainty, etc.)
- **Phase 9: Future-Proofing for AI/RAG**

## 📁 Project Structure

```
messymind/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   ├── lib/
│   │   ├── supabase/          # Supabase client & middleware
│   │   ├── patterns/          # Pattern definitions
│   │   ├── metrics/           # CSV parsing & metrics calculation
│   │   └── detection/         # Detection engine
│   └── types/                 # TypeScript type definitions
├── supabase/
│   └── migrations/            # Database schema migrations
├── scripts/                   # Utility scripts
└── public/                    # Static assets
```

## 🧪 CSV Data Format

The tool expects CSV files with the following columns:

| Column | Required | Description |
|--------|----------|-------------|
| `session_id` | Yes | Unique session identifier |
| `event_name` | Yes | Event type (view_item, add_to_cart, search) |
| `event_timestamp` | Yes | ISO 8601 timestamp |
| `item_id` | No | Product identifier |
| `item_name` | No | Product name |
| `item_category` | No | Product category |
| `item_price` | No | Product price |
| `page_location` | No | Page URL |
| `search_term` | No | Search query (for search events) |

### Sample CSV

```csv
session_id,event_name,event_timestamp,item_id,item_name,item_category,item_price,page_location
session_123,view_item,2025-01-15T10:30:00Z,prod_001,Running Shoes Pro,Running Shoes,129.99,/products/running-shoes-pro
session_123,view_item,2025-01-15T10:32:00Z,prod_002,Trail Runner X,Running Shoes,149.99,/products/trail-runner-x
session_123,add_to_cart,2025-01-15T10:35:00Z,prod_001,Running Shoes Pro,Running Shoes,129.99,/products/running-shoes-pro
```

## 🔍 Comparison Paralysis Pattern

The first implemented pattern detects when shoppers:

- View many products (5+) but rarely add to cart
- Spend extended time (5+ minutes) comparing options
- Have view-to-cart conversion below 5% (vs. industry norm of 6-11%)
- Revisit products and search multiple times without progressing

### Detection Rules

- **Rule A**: High Exploration, No Commitment (40 points)
- **Rule B**: Below-Normal View→Cart Conversion (30 points)
- **Rule C**: Revisit & Search-Cycle Indecision (30 points)
- **Bonus Conditions**: Up to 10 additional points

### Primary Drivers

10 canonical behavioral signals including:
- High Exploration Breadth
- Deep Within Category
- Zero Cart Commitment
- Extended Session Time
- And more...

### Interventions

6 intervention buckets:
1. Curation & Defaults
2. Decision Aids & Comparison Helpers
3. Social Proof Guidance
4. Attribute & Option Simplification
5. Anchoring & "Best Value" Framing
6. Commitment Nudge

## 🛠️ Technology Stack

- **Frontend**: Next.js 14+, React 18+, TypeScript
- **Backend**: Supabase (Auth, Database, Storage)
- **Styling**: Tailwind CSS
- **Data Visualization**: Recharts
- **CSV Parsing**: Papa Parse
- **Validation**: Zod

## 🔮 Future Enhancements

- Direct Shopify/GA4 API integration
- Real-time pattern detection
- AI/RAG-powered insights
- Multi-pattern analysis
- Custom pattern creation
- A/B testing recommendations

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.
