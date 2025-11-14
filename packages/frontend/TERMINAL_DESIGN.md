# KEKTECH TRADING TERMINAL - UI DESIGN SPECIFICATION

**Created**: 2025-11-14
**Status**: Implementation Ready
**Patterns Source**: next_STYLE_patterns repository analysis

---

## 🎯 DESIGN VISION

**Central trading terminal** where users see active markets, proposals, and resolutions in a **smart, seamless, dynamic, and beautifully organized** interface.

### Core Principles

1. **Terminal-First**: Dark theme optimized for financial data display
2. **Real-Time**: WebSocket-driven live updates with smooth animations
3. **Hierarchical**: Clear data flow: Proposals → Active Markets → Resolutions
4. **Responsive**: Container queries for fluid layouts (not breakpoints)
5. **Accessible**: WCAG AA compliant with keyboard navigation

---

## 📐 LAYOUT STRUCTURE

```
┌────────────────────────────────────────────────────────────────────────┐
│ HEADER (h-16)                                                          │
│ Logo | Search Bar | Wallet: 0x123...abc | Network: BasedAI           │
├──────────────┬─────────────────────────────────────────────────────────┤
│              │                                                         │
│ SIDEBAR      │ MAIN CONTENT (Terminal)                                 │
│ (w-64)       │                                                         │
│              │ ┌─────────────────────────────────────────────────────┐ │
│ Navigation:  │ │ HERO SECTION (h-48)                                 │ │
│  🏠 Home     │ │ Neon Trail Animation Background                     │ │
│  📊 Markets  │ │ "Live Prediction Markets on BasedAI"                │ │
│  💰 My Bets  │ └─────────────────────────────────────────────────────┘ │
│  🏆 Rewards  │                                                         │
│  ⚙️  Admin   │ ┌─────────────────────────────────────────────────────┐ │
│              │ │ METRICS CARDS (4-column grid, gap-4)                │ │
│ Categories:  │ │ ┌──────────┬──────────┬──────────┬──────────┐       │ │
│  All Markets │ │ │ Active   │ Total    │ 24h      │ Total    │       │ │
│  📈 Trending │ │ │ Markets  │ Volume   │ Trades   │ Liquidity│       │ │
│  🔥 Hot      │ │ │ 42       │ $1.2M    │ 1,234    │ $450K    │       │ │
│  ⏰ Closing  │ │ └──────────┴──────────┴──────────┴──────────┘       │ │
│              │ └─────────────────────────────────────────────────────┘ │
│ Filters:     │                                                         │
│  Politics    │ ┌─────────────────────────────────────────────────────┐ │
│  Sports      │ │ LIVE MARKETS TABLE                                  │ │
│  Crypto      │ │ Market Name | YES% | NO% | Vol | Liq | Change | → │ │
│  Tech        │ │ ────────────────────────────────────────────────────│ │
│  Science     │ │ Bitcoin > $100k? | 65% | 35% | $120K | $45K | +2% │ │
│  Other       │ │ (hover effect, click to view details)               │ │
│              │ └─────────────────────────────────────────────────────┘ │
│              │                                                         │
│ Status:      │ ┌─────────────────────────────────────────────────────┐ │
│  🟢 Proposed │ │ PROPOSALS PENDING APPROVAL                          │ │
│  🔵 Active   │ │ Community Vote: Should we add new category?         │ │
│  🟡 Resolving│ │ [View All Proposals →]                              │ │
│  ⚪ Finalized│ └─────────────────────────────────────────────────────┘ │
│              │                                                         │
└──────────────┴─────────────────────────────────────────────────────────┘
```

---

## 🎨 COLOR SCHEME (Dark Terminal)

### Base Colors (from globals.css)
```css
--color-terminal-bg-primary: #0d1117;      /* Main background */
--color-terminal-bg-secondary: #161b22;    /* Card backgrounds */
--color-terminal-bg-tertiary: #21262d;     /* Elevated elements */
--color-terminal-text-primary: #ffffff;     /* Important data */
--color-terminal-text-secondary: #c9d1d9;   /* Secondary info */
```

### Trading Status Colors
```css
--color-terminal-green: #3fb950;      /* YES, Bullish, Positive */
--color-terminal-red: #f85149;        /* NO, Bearish, Negative */
--color-terminal-yellow: #d29922;     /* Warning, Resolving */
--color-terminal-blue: #58a6ff;       /* Info, Approved */
--color-terminal-purple: #bc8cff;     /* Finalized, Premium */
```

### Brand Accent
```css
--color-kek-green: #3fb8bd;           /* Primary brand color */
```

---

## 📊 COMPONENT BREAKDOWN

### 1. TerminalLayout.tsx
**Purpose**: Main layout with sidebar + content area
**Pattern**: Sidebar + SidebarInset from shadcn/ui
**File**: `components/terminal/TerminalLayout.tsx`

```tsx
<SidebarProvider>
  <TerminalSidebar />
  <SidebarInset>
    <TerminalHeader />
    <main className="@container/main flex-1 p-6">
      {children}
    </main>
  </SidebarInset>
</SidebarProvider>
```

**Features**:
- Collapsible sidebar (mobile/desktop)
- Persistent state (cookie-based)
- Smooth transitions (300ms)

---

### 2. TerminalHeader.tsx
**Purpose**: Top navigation bar
**File**: `components/terminal/TerminalHeader.tsx`

**Elements**:
- Logo (clickable, links to home)
- Search bar (fuzzy search across markets)
- Wallet display (address + balance)
- Network indicator (BasedAI mainnet)
- Connect button (RainbowKit integration)

---

### 3. TerminalSidebar.tsx
**Purpose**: Navigation + filters
**File**: `components/terminal/TerminalSidebar.tsx`

**Sections**:
1. **Navigation** (top)
   - Home, Markets, My Bets, Rewards, Admin
2. **Categories** (middle)
   - All, Trending, Hot, Closing Soon
3. **Filters** (bottom)
   - By topic: Politics, Sports, Crypto, Tech
4. **Status Filters**
   - Proposed, Active, Resolving, Finalized

**Styling**:
- Active state: `bg-terminal-bg-tertiary + border-l-2 border-kek-green`
- Hover: `hover:bg-terminal-bg-hover`
- Icons: Lucide React (24x24px)

---

### 4. MarketMetricsCards.tsx ⭐
**Purpose**: 4 key metrics at a glance
**Pattern**: Grid with metric cards (from patterns analysis)
**File**: `components/terminal/MarketMetricsCards.tsx`

**Metrics**:
1. **Active Markets** (count)
2. **Total Volume** (24h, $USD)
3. **Total Trades** (24h count)
4. **Total Liquidity** (available, $USD)

**Layout**:
```tsx
<div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
  <MetricCard
    title="Active Markets"
    value="42"
    trend="+5 today"
    icon={<TrendingUp />}
  />
  {/* ... more cards */}
</div>
```

**Features**:
- Trend indicators (up/down arrows)
- Real-time updates via WebSocket
- Smooth number transitions (CountUp.js)
- Responsive: 1→2→4 columns

---

### 5. MarketTable.tsx ⭐⭐
**Purpose**: Main market listings
**Pattern**: Responsive table with hover states
**File**: `components/terminal/MarketTable.tsx`

**Columns**:
| Market Name | YES% | NO% | Volume | Liquidity | Change (24h) | Action |
|-------------|------|-----|--------|-----------|--------------|--------|
| Bitcoin > $100k by EOY? | 65% | 35% | $120K | $45K | +2.5% | → |

**Features**:
- Sortable columns (click header)
- Color-coded odds (green/red)
- Hover row highlight
- Click row → navigate to detail page
- Mobile: horizontal scroll
- Desktop: full width table

**Styling**:
```tsx
<TableRow className="hover:bg-terminal-bg-hover cursor-pointer">
  <TableCell className="font-medium">{market.question}</TableCell>
  <TableCell className="text-terminal-green tabular-nums">{yesOdds}%</TableCell>
  <TableCell className="text-terminal-red tabular-nums">{noOdds}%</TableCell>
  {/* ... */}
</TableRow>
```

---

### 6. MarketCard.tsx
**Purpose**: Alternative to table (grid view)
**Pattern**: Card with metrics badge
**File**: `components/terminal/MarketCard.tsx`

```tsx
<Card className="hover:border-kek-green transition-colors">
  <CardHeader>
    <Badge variant="outline">Politics</Badge>
    <CardTitle className="line-clamp-2">{question}</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs text-muted">YES</p>
        <p className="text-2xl font-bold text-terminal-green">{yesOdds}%</p>
      </div>
      <div>
        <p className="text-xs text-muted">NO</p>
        <p className="text-2xl font-bold text-terminal-red">{noOdds}%</p>
      </div>
    </div>
  </CardContent>
  <CardFooter>
    <Button variant="outline" className="w-full">View Market →</Button>
  </CardFooter>
</Card>
```

---

### 7. HeroSection.tsx
**Purpose**: Animated background banner
**Pattern**: Neon trails canvas animation
**File**: `components/terminal/HeroSection.tsx`

**Features**:
- Canvas-based neon trail animation
- Gradient overlay for text readability
- Centered headline + CTA
- Height: `h-48` (192px)

---

### 8. OddsChart.tsx ⭐⭐
**Purpose**: Price/odds history visualization
**Pattern**: Recharts AreaChart + time range toggle
**File**: `components/terminal/OddsChart.tsx`

**Time Ranges**:
- 1H, 6H, 1D, 7D, 30D, All

**Chart Configuration**:
```tsx
<AreaChart data={filteredData}>
  <defs>
    <linearGradient id="yesGradient">
      <stop offset="5%" stopColor="var(--color-terminal-green)" stopOpacity={0.8} />
      <stop offset="95%" stopColor="var(--color-terminal-green)" stopOpacity={0.1} />
    </linearGradient>
  </defs>
  <Area dataKey="yesOdds" fill="url(#yesGradient)" stroke="var(--color-terminal-green)" />
  <Area dataKey="noOdds" fill="url(#noGradient)" stroke="var(--color-terminal-red)" />
</AreaChart>
```

**Features**:
- Dual series (YES vs NO odds)
- Smooth transitions (500ms)
- Tooltip with exact values
- Responsive: Toggle group (desktop) / Select (mobile)

---

## 📄 PAGE STRUCTURE

### Home Page (`app/page.tsx`)
```tsx
<TerminalLayout>
  <HeroSection />
  <MarketMetricsCards />
  <MarketTable category="all" limit={20} />
  <ProposalPreview />
</TerminalLayout>
```

### Markets Page (`app/markets/page.tsx`)
```tsx
<TerminalLayout>
  <PageHeader title="All Markets" />
  <MarketFilters /> {/* Category, Status, Sort */}
  <MarketTable /> {/* Full list, paginated */}
</TerminalLayout>
```

### Market Detail Page (`app/market/[address]/page.tsx`)
```tsx
<TerminalLayout>
  <MarketDetailHeader /> {/* Question, status badge, creator */}
  <div className="grid grid-cols-1 @5xl/main:grid-cols-3 gap-6">
    <div className="@5xl/main:col-span-2">
      <OddsChart marketAddress={address} />
      <PlaceBetCard />
      <CommentSection marketAddress={address} />
    </div>
    <div>
      <MarketInfoSidebar /> {/* Metrics, resolution criteria */}
      <UserPositionCard /> {/* Your shares */}
    </div>
  </div>
</TerminalLayout>
```

### Proposals Page (`app/proposals/page.tsx`)
```tsx
<TerminalLayout>
  <PageHeader title="Market Proposals" />
  <ProposalList />
  <ProposalVoteDialog />
</TerminalLayout>
```

### Resolutions Page (`app/resolutions/page.tsx`)
```tsx
<TerminalLayout>
  <PageHeader title="Markets in Resolution" />
  <ResolutionList />
  <ResolutionVoteDialog />
</TerminalLayout>
```

---

## 🎭 ANIMATION SPECIFICATIONS

### Micro-Interactions (< 200ms)
- Button hover: `transition-colors duration-150`
- Row hover: `hover:bg-terminal-bg-hover transition-colors`
- Icon pulse: `animate-pulse` (loading states)

### Transitions (200-500ms)
- Modal open: `transition-all duration-300 ease-out`
- Sidebar toggle: `transition-transform duration-300`
- Number updates: CountUp.js with 500ms duration

### Looping Animations (> 500ms)
- Skeleton pulse: `animate-pulse` (2s loop)
- Neon trails: Canvas animation (60fps)
- Chart updates: Recharts smooth transitions

### Real-Time Updates
- WebSocket message → State update → Smooth chart re-render
- NO jarring changes, use `react-spring` or Recharts built-in animations

---

## 📱 RESPONSIVE STRATEGY

### Breakpoints (Container Queries)
```css
/* Mobile: Default (single column) */
grid-cols-1

/* Tablet: @xl/main (≥1024px) */
@xl/main:grid-cols-2

/* Desktop: @5xl/main (≥1440px) */
@5xl/main:grid-cols-4
```

### Component-Level Responsiveness
```tsx
/* Card-level: Show toggle on wide, select on narrow */
<ToggleGroup className="@[767px]/card:flex" /> /* Desktop */
<Select className="@[767px]/card:hidden" />    /* Mobile */
```

### Mobile Optimizations
- Sidebar: Full-screen overlay on mobile
- Table: Horizontal scroll with `overflow-x-auto`
- Charts: Reduce height on mobile (`h-[200px]` → `h-[150px]`)
- Touch targets: Minimum 48x48px

---

## ♿ ACCESSIBILITY REQUIREMENTS

### Keyboard Navigation
- Tab order: Logical (header → sidebar → main content)
- Enter: Activate buttons, links, rows
- Escape: Close modals, collapse dropdowns
- Arrow keys: Navigate table rows, chart data points

### ARIA Attributes
```tsx
<button aria-label="Place bet on YES">
<table aria-label="Active prediction markets">
<div role="status" aria-live="polite"> {/* Real-time updates */}
```

### Color Contrast
- Text on dark: ≥ 4.5:1 (WCAG AA)
- Interactive elements: ≥ 3:1 (borders, icons)
- Use `text-terminal-text-primary` for critical data

### Screen Readers
- Metric cards: Announce value + context
- Tables: Proper `<th>` headers with scope
- Charts: Provide data table alternative

---

## 🔌 WEBSOCKET INTEGRATION

### Real-Time Data Flow
```tsx
useEffect(() => {
  const ws = new WebSocket('ws://your-backend:3180')

  ws.onmessage = (event) => {
    const { type, data } = JSON.parse(event.data)

    switch(type) {
      case 'ODDS_UPDATE':
        // Update chart data smoothly
        setChartData(prev => [...prev.slice(1), data])
        break
      case 'NEW_BET':
        // Update volume metric
        setMetrics(prev => ({ ...prev, volume: prev.volume + data.amount }))
        break
      case 'MARKET_RESOLVED':
        // Show notification
        toast.success(`Market resolved: ${data.question}`)
        break
    }
  }

  return () => ws.close()
}, [])
```

---

## 📦 DEPENDENCIES TO ADD

```bash
npm install recharts                    # Charts
npm install @radix-ui/react-dialog      # Modals (already installed)
npm install @radix-ui/react-sidebar     # Sidebar layout
npm install tailwindcss-animate         # Animation utilities
npm install react-countup               # Smooth number transitions (optional)
```

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Layout Foundation (Week 1)
- [x] Fix React Hooks violations
- [x] Replace inline colors with CSS variables
- [ ] Create `TerminalLayout.tsx`
- [ ] Create `TerminalSidebar.tsx`
- [ ] Create `TerminalHeader.tsx`
- [ ] Update `app/page.tsx` to use TerminalLayout

### Phase 2: Core Components (Week 2)
- [ ] Build `MarketMetricsCards.tsx`
- [ ] Build `MarketTable.tsx` with sorting
- [ ] Build `MarketCard.tsx` (grid alternative)
- [ ] Add loading skeletons for all components

### Phase 3: Detail Pages (Week 3)
- [ ] Create `app/market/[address]/page.tsx`
- [ ] Build `OddsChart.tsx` with time ranges
- [ ] Build `PlaceBetCard.tsx`
- [ ] Build `MarketInfoSidebar.tsx`

### Phase 4: Engagement Features (Week 4)
- [ ] Integrate `CommentSection` (already exists)
- [ ] Add `ProposalVoteButtons` (already exists)
- [ ] Add `ResolutionVoteForm` (already exists)
- [ ] WebSocket real-time updates

### Phase 5: Polish & Animations (Week 5)
- [ ] Add `HeroSection.tsx` with neon trails
- [ ] Add success celebration effects
- [ ] Optimize loading states
- [ ] Run Lighthouse audit
- [ ] Fix accessibility issues

---

## 📋 SUCCESS CRITERIA

- [ ] All pages load in < 2s (Lighthouse)
- [ ] Real-time updates work smoothly (no jank)
- [ ] Mobile responsive at 375px, 768px, 1440px
- [ ] Keyboard navigation complete
- [ ] WCAG AA compliant (axe-core scan)
- [ ] TypeScript strict mode (no errors)
- [ ] Test coverage ≥ 70% (Vitest)

---

**Next Step**: Start implementing `TerminalLayout.tsx` component 🚀
