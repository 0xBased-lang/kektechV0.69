# KEKTECH TRADING TERMINAL - EDGE CASES & OPTIMIZATION

**Created**: 2025-11-14
**Purpose**: Comprehensive analysis of edge cases, performance optimizations, and architecture
**Status**: Ultra-think mode activated 🧠

---

## 🔴 EDGE CASES TO HANDLE

### 1. DATA EDGE CASES

#### Empty States
```tsx
// NO markets available
if (markets.length === 0) {
  return (
    <EmptyState
      icon={<TrendingDown />}
      title="No Active Markets"
      description="Be the first to create a prediction market!"
      action={<Button href="/markets/create">Create Market</Button>}
    />
  )
}

// NO hot items (left sidebar empty)
if (hotItems.length === 0) {
  return (
    <EmptyState
      variant="compact"
      message="No trending markets right now. Check back soon!"
    />
  )
}

// NO comments/social activity (right sidebar empty)
if (comments.length === 0) {
  return (
    <EmptyState
      variant="compact"
      message="Be the first to comment on this market!"
      action={<CommentButton />}
    />
  )
}

// FILTER returns zero results
if (filteredMarkets.length === 0) {
  return (
    <EmptyState
      title="No results found"
      description="Try adjusting your filters"
      action={<Button onClick={clearFilters}>Clear Filters</Button>}
    />
  )
}
```

#### Extreme Numbers
```tsx
// Very large numbers (volume > $1B)
const formatVolume = (value: number) => {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`
  return `$${value.toFixed(2)}`
}

// Very small odds (< 1%)
const formatOdds = (odds: number) => {
  if (odds < 1) return '<1%'
  if (odds > 99) return '>99%'
  return `${odds.toFixed(1)}%`
}

// Extremely long market titles
<h3 className="line-clamp-2 text-sm font-semibold">
  {market.question}
</h3>
// Tooltip on hover for full text
<Tooltip content={market.question}>
  <h3 className="line-clamp-2">...</h3>
</Tooltip>

// Very high bet counts (thousands)
if (betCount > 9999) {
  return '9999+' // Cap display
}
```

#### Invalid/Missing Data
```tsx
// Market missing image
<Avatar fallback={market.question[0]} src={market.image} />

// Missing creator address
const creator = market.creator || '0x0000...0000'

// Undefined odds (market not yet active)
const yesOdds = market.yesOdds ?? 50 // Default to 50/50
const noOdds = market.noOdds ?? 50

// Missing timestamps
const createdAt = market.createdAt || Date.now()
const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true })

// Null chart data
if (!chartData || chartData.length === 0) {
  return <div className="h-12 bg-muted rounded animate-pulse" />
}
```

---

### 2. UI EDGE CASES

#### Window Resize
```tsx
// Responsive layout breakpoints
const [layout, setLayout] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

useEffect(() => {
  const handleResize = () => {
    const width = window.innerWidth
    if (width >= 1200) setLayout('desktop')
    else if (width >= 768) setLayout('tablet')
    else setLayout('mobile')
  }

  handleResize() // Initial check
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])

// Adjust grid columns based on layout
const gridCols = {
  desktop: 'grid-cols-3',
  tablet: 'grid-cols-2',
  mobile: 'grid-cols-1'
}[layout]
```

#### Scroll Position
```tsx
// Infinite scroll for center column
const observerRef = useRef<IntersectionObserver>()
const lastCardRef = useCallback((node: HTMLDivElement) => {
  if (isLoading) return
  if (observerRef.current) observerRef.current.disconnect()

  observerRef.current = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && hasMore) {
      loadMoreMarkets()
    }
  })

  if (node) observerRef.current.observe(node)
}, [isLoading, hasMore])

// Restore scroll position on navigation
useEffect(() => {
  const savedPosition = sessionStorage.getItem('scrollPosition')
  if (savedPosition) {
    window.scrollTo(0, parseInt(savedPosition))
  }

  return () => {
    sessionStorage.setItem('scrollPosition', window.scrollY.toString())
  }
}, [])
```

#### Focus Management
```tsx
// Keyboard navigation for market cards
const handleKeyDown = (e: KeyboardEvent, marketAddress: string) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    router.push(`/market/${marketAddress}`)
  }
}

// Focus trap in modal
<Dialog onOpenChange={(open) => {
  if (!open) {
    // Return focus to trigger button
    document.getElementById('place-bet-trigger')?.focus()
  }
}}>
```

---

### 3. NETWORK EDGE CASES

#### Slow Connection
```tsx
// Show loading skeletons immediately
if (isLoading || !markets) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="h-60" />
      ))}
    </div>
  )
}

// Timeout for slow queries (15 seconds)
const { data, isLoading, error } = useQuery({
  queryKey: ['markets', filter],
  queryFn: fetchMarkets,
  staleTime: 30000,
  cacheTime: 300000,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  timeout: 15000 // Fail after 15s
})

// Show degraded experience message
if (isTimeout) {
  return (
    <Alert variant="warning">
      <Clock className="h-4 w-4" />
      <AlertDescription>
        Data is taking longer than usual to load. You may be experiencing network issues.
      </AlertDescription>
    </Alert>
  )
}
```

#### WebSocket Disconnect
```tsx
// Auto-reconnect with exponential backoff
const useTerminalWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const wsRef = useRef<WebSocket>()

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(WS_URL)

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setReconnectAttempts(0)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000)
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1)
          connect()
        }, delay)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        ws.close()
      }

      wsRef.current = ws
    }

    connect()

    return () => {
      wsRef.current?.close()
    }
  }, [reconnectAttempts])

  return { isConnected, ws: wsRef.current }
}

// Show connection status indicator
<ConnectionStatus isConnected={isConnected} />
```

#### API Errors
```tsx
// Graceful degradation
if (error) {
  // Try to show cached data
  if (cachedMarkets) {
    return (
      <>
        <Alert variant="warning" className="mb-4">
          Unable to fetch latest data. Showing cached results.
        </Alert>
        <MarketGrid markets={cachedMarkets} />
      </>
    )
  }

  // If no cache, show error with retry
  return (
    <ErrorState
      title="Failed to load markets"
      description={error.message}
      action={<Button onClick={refetch}>Retry</Button>}
    />
  )
}
```

---

### 4. USER INPUT EDGE CASES

#### Search Edge Cases
```tsx
// Empty search query
if (!searchTerm.trim()) {
  return allMarkets // Show all
}

// Very short query (< 2 chars)
if (searchTerm.length < 2) {
  return [] // Don't search yet
}

// Special characters
const sanitizeSearch = (query: string) =>
  query.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase()

// Too many results (> 100)
const results = filteredMarkets.slice(0, 100)
if (filteredMarkets.length > 100) {
  showToast('Showing first 100 results. Try refining your search.')
}

// No results
if (results.length === 0) {
  return (
    <EmptyState
      title="No markets found"
      description={`No results for "${searchTerm}"`}
      action={<Button onClick={clearSearch}>Clear Search</Button>}
    />
  )
}
```

#### Filter Combinations
```tsx
// Multiple active filters with zero results
const activeFilters = {
  category: 'Crypto',
  status: 'ACTIVE',
  minVolume: 100000,
  timeRange: '24h'
}

if (filteredMarkets.length === 0) {
  // Suggest relaxing filters
  return (
    <EmptyState
      title="No markets match all filters"
      suggestions={[
        'Try removing the volume filter',
        'Expand to "All Categories"',
        'Change time range to "7 days"'
      ]}
    />
  )
}
```

---

### 5. RACE CONDITIONS

#### Rapid Filter Changes
```tsx
// Debounce filter changes
const [filter, setFilter] = useState('all')
const [debouncedFilter] = useDebounce(filter, 300)

useEffect(() => {
  // Only fetch after user stops changing filter
  fetchMarkets(debouncedFilter)
}, [debouncedFilter])

// Cancel pending requests on new filter
const abortControllerRef = useRef<AbortController>()

const fetchMarkets = async (filter: string) => {
  // Cancel previous request
  abortControllerRef.current?.abort()
  abortControllerRef.current = new AbortController()

  try {
    const data = await fetch(`/api/markets?filter=${filter}`, {
      signal: abortControllerRef.current.signal
    })
    // Process data
  } catch (err) {
    if (err.name === 'AbortError') {
      // Ignore, new request in progress
    } else {
      // Handle error
    }
  }
}
```

#### Concurrent Updates
```tsx
// Use optimistic updates with rollback
const placeBet = useMutation({
  mutationFn: async (bet: Bet) => {
    // Optimistically update UI
    const previousMarket = queryClient.getQueryData(['market', bet.marketAddress])

    queryClient.setQueryData(['market', bet.marketAddress], (old: Market) => ({
      ...old,
      yesOdds: bet.outcome === 'YES' ? old.yesOdds + 1 : old.yesOdds,
      noOdds: bet.outcome === 'NO' ? old.noOdds + 1 : old.noOdds,
      volume: old.volume + bet.amount
    }))

    // Send to server
    const result = await api.placeBet(bet)

    return result
  },
  onError: (err, bet, context) => {
    // Rollback on error
    queryClient.setQueryData(['market', bet.marketAddress], context.previousMarket)
    toast.error('Failed to place bet. Please try again.')
  },
  onSuccess: () => {
    // Refetch to get accurate server data
    queryClient.invalidateQueries(['market', bet.marketAddress])
  }
})
```

---

## ⚡ PERFORMANCE OPTIMIZATIONS

### 1. RENDERING OPTIMIZATIONS

#### Virtual Scrolling (for long lists)
```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function MarketList({ markets }: { markets: Market[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: markets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 240, // Card height
    overscan: 5 // Render 5 extra items above/below
  })

  return (
    <div ref={parentRef} className="h-[800px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <MarketCard market={markets[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### Memoization
```tsx
// Memoize expensive card renders
const MarketCard = React.memo(({ market }: { market: Market }) => {
  return (
    <Card>...</Card>
  )
}, (prevProps, nextProps) => {
  // Only re-render if these change
  return (
    prevProps.market.yesOdds === nextProps.market.yesOdds &&
    prevProps.market.noOdds === nextProps.market.noOdds &&
    prevProps.market.volume === nextProps.market.volume
  )
})

// Memoize chart data transformation
const chartData = useMemo(() => {
  return transformOddsToChartData(market.history)
}, [market.history])

// Memoize filter logic
const filteredMarkets = useMemo(() => {
  return markets.filter(m =>
    m.category === filter.category &&
    m.volume >= filter.minVolume
  )
}, [markets, filter])
```

#### Code Splitting
```tsx
// Lazy load heavy components
const OddsChart = dynamic(() => import('./OddsChart'), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false // Don't render on server
})

const PlaceBetDialog = dynamic(() => import('./PlaceBetDialog'), {
  loading: () => <div>Loading...</div>
})

// Only load when needed
{isChartVisible && <OddsChart data={market.history} />}
```

---

### 2. DATA FETCHING OPTIMIZATIONS

#### Pagination
```tsx
// Infinite scroll with cursor-based pagination
const useInfiniteMarkets = (filter: string) => {
  return useInfiniteQuery({
    queryKey: ['markets', filter],
    queryFn: ({ pageParam = 0 }) =>
      fetch(`/api/markets?filter=${filter}&cursor=${pageParam}&limit=20`),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30000, // Data stays fresh for 30s
    cacheTime: 300000, // Cache for 5min
  })
}

// Prefetch next page on scroll
const { data, fetchNextPage, hasNextPage } = useInfiniteMarkets(filter)

useEffect(() => {
  if (scrollPosition > 80% && hasNextPage) {
    fetchNextPage()
  }
}, [scrollPosition, hasNextPage])
```

#### Parallel Requests
```tsx
// Fetch multiple endpoints in parallel
const useTerminalData = () => {
  const [markets, hotItems, stats, comments] = useQueries([
    { queryKey: ['markets'], queryFn: fetchMarkets },
    { queryKey: ['hot-items'], queryFn: fetchHotItems },
    { queryKey: ['stats'], queryFn: fetchStats },
    { queryKey: ['comments'], queryFn: fetchComments }
  ])

  return {
    markets: markets.data,
    hotItems: hotItems.data,
    stats: stats.data,
    comments: comments.data,
    isLoading: markets.isLoading || hotItems.isLoading || stats.isLoading || comments.isLoading
  }
}
```

#### Request Deduplication
```tsx
// React Query automatically deduplicates identical requests
// But for manual fetching:
const requestCache = new Map<string, Promise<any>>()

const fetchWithDedup = async (url: string) => {
  if (requestCache.has(url)) {
    return requestCache.get(url) // Return existing promise
  }

  const promise = fetch(url).then(r => r.json())
  requestCache.set(url, promise)

  promise.finally(() => {
    // Clear cache after 5s
    setTimeout(() => requestCache.delete(url), 5000)
  })

  return promise
}
```

---

### 3. CACHING STRATEGIES

#### Multi-Layer Caching
```tsx
// Layer 1: React Query (in-memory, 5min)
const { data: markets } = useQuery({
  queryKey: ['markets', filter],
  queryFn: fetchMarkets,
  staleTime: 30000,
  cacheTime: 300000
})

// Layer 2: SessionStorage (session-scoped)
const getCachedMarkets = () => {
  const cached = sessionStorage.getItem('markets')
  if (!cached) return null

  const { data, timestamp } = JSON.parse(cached)
  const age = Date.now() - timestamp

  // Cache valid for 5 minutes
  if (age < 300000) {
    return data
  }

  return null
}

const setCachedMarkets = (markets: Market[]) => {
  sessionStorage.setItem('markets', JSON.stringify({
    data: markets,
    timestamp: Date.now()
  }))
}

// Layer 3: IndexedDB (persistent, for offline)
const saveToIndexedDB = async (markets: Market[]) => {
  const db = await openDB('kektech', 1)
  await db.put('markets', markets, 'latest')
}

const getFromIndexedDB = async () => {
  const db = await openDB('kektech', 1)
  return db.get('markets', 'latest')
}
```

#### Cache Invalidation
```tsx
// Invalidate on user action
const placeBet = useMutation({
  mutationFn: api.placeBet,
  onSuccess: () => {
    // Invalidate affected queries
    queryClient.invalidateQueries(['market', marketAddress])
    queryClient.invalidateQueries(['markets']) // Refresh list
    queryClient.invalidateQueries(['hot-items']) // May affect hot list
  }
})

// Invalidate on WebSocket event
ws.onmessage = (event) => {
  const { type, marketAddress } = JSON.parse(event.data)

  if (type === 'ODDS_UPDATE') {
    queryClient.invalidateQueries(['market', marketAddress])
  }

  if (type === 'NEW_MARKET') {
    queryClient.invalidateQueries(['markets'])
  }
}

// Time-based invalidation
queryClient.setQueryDefaults(['markets'], {
  staleTime: 30000, // Fresh for 30s
  cacheTime: 300000, // Keep in cache for 5min
  refetchOnWindowFocus: true,
  refetchOnReconnect: true
})
```

---

### 4. BUNDLE SIZE OPTIMIZATIONS

#### Tree Shaking
```tsx
// Import only what you need
import { formatDistance } from 'date-fns/formatDistance' // ✅ 2KB
// NOT: import { formatDistance } from 'date-fns' // ❌ 200KB

import { AreaChart } from 'recharts' // ✅ Specific component
// NOT: import * as Recharts from 'recharts' // ❌ Entire library

// Dynamic imports for icons
const Icon = lazy(() => import(`lucide-react/${iconName}`))
```

#### Image Optimization
```tsx
// Use Next.js Image component
<Image
  src={market.image}
  alt={market.question}
  width={48}
  height={48}
  quality={75} // Good balance
  placeholder="blur"
  blurDataURL={market.blurHash} // Generate on backend
/>

// Lazy load images below fold
<Image
  src={market.image}
  loading="lazy"
  decoding="async"
/>
```

#### Font Optimization
```tsx
// Only load used font weights
import { Geist } from 'next/font/google'

const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '600'], // Only regular + semibold
  display: 'swap',
  preload: true
})
```

---

## 🏗️ ARCHITECTURE & INFRASTRUCTURE

### 1. STATE MANAGEMENT

#### Global State (Zustand)
```tsx
// stores/terminalStore.ts
import create from 'zustand'
import { persist } from 'zustand/middleware'

interface TerminalStore {
  // UI State
  filter: 'all' | 'trading' | 'proposals' | 'resolutions'
  setFilter: (filter: TerminalStore['filter']) => void

  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // User Preferences
  defaultView: 'grid' | 'list'
  chartTimeRange: '1H' | '6H' | '1D' | '7D' | '30D'
  setChartTimeRange: (range: TerminalStore['chartTimeRange']) => void

  // Watchlist
  watchlist: string[] // Market addresses
  addToWatchlist: (address: string) => void
  removeFromWatchlist: (address: string) => void
}

export const useTerminalStore = create<TerminalStore>()(
  persist(
    (set) => ({
      filter: 'all',
      setFilter: (filter) => set({ filter }),

      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      defaultView: 'grid',
      chartTimeRange: '1D',
      setChartTimeRange: (chartTimeRange) => set({ chartTimeRange }),

      watchlist: [],
      addToWatchlist: (address) => set((state) => ({
        watchlist: [...state.watchlist, address]
      })),
      removeFromWatchlist: (address) => set((state) => ({
        watchlist: state.watchlist.filter(a => a !== address)
      }))
    }),
    { name: 'terminal-storage' } // Persist to localStorage
  )
)
```

#### Server State (React Query)
```tsx
// All server data via React Query
// Separation of concerns: Zustand = UI state, React Query = server state

// Don't duplicate server data in Zustand!
// ❌ BAD
const [markets, setMarkets] = useState([])

// ✅ GOOD
const { data: markets } = useQuery(['markets'])
```

---

### 2. WEBSOCKET ARCHITECTURE

#### Connection Management
```tsx
// lib/websocket/TerminalWebSocket.ts
class TerminalWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private listeners: Map<string, Set<Function>> = new Map()
  private heartbeatInterval: NodeJS.Timer | null = null

  connect() {
    this.ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!)

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected')
      this.reconnectAttempts = 0
      this.startHeartbeat()
      this.emit('connected')
    }

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      this.emit(message.type, message.data)
    }

    this.ws.onclose = () => {
      console.log('❌ WebSocket disconnected')
      this.stopHeartbeat()
      this.reconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('max-reconnect-attempts')
      return
    }

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000)
    setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping' })
    }, 30000) // Ping every 30s
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback)
  }

  private emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach(callback => callback(data))
  }

  disconnect() {
    this.stopHeartbeat()
    this.ws?.close()
  }
}

export const terminalWS = new TerminalWebSocket()
```

#### React Hook Wrapper
```tsx
// hooks/useTerminalWebSocket.ts
export function useTerminalWebSocket() {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Connect on mount
    terminalWS.connect()

    // Listen for events
    terminalWS.on('connected', () => setIsConnected(true))
    terminalWS.on('disconnected', () => setIsConnected(false))

    terminalWS.on('ODDS_UPDATE', (data: { marketAddress: string, yesOdds: number, noOdds: number }) => {
      // Update React Query cache
      queryClient.setQueryData(['market', data.marketAddress], (old: Market) => ({
        ...old,
        yesOdds: data.yesOdds,
        noOdds: data.noOdds
      }))
    })

    terminalWS.on('NEW_BET', (data) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries(['market', data.marketAddress])
      queryClient.invalidateQueries(['markets'])
    })

    terminalWS.on('NEW_MARKET', () => {
      queryClient.invalidateQueries(['markets'])
      queryClient.invalidateQueries(['hot-items'])
    })

    // Cleanup on unmount
    return () => {
      terminalWS.disconnect()
    }
  }, [queryClient])

  return { isConnected }
}
```

---

### 3. ERROR HANDLING ARCHITECTURE

#### Error Boundary
```tsx
// components/ErrorBoundary.tsx
class TerminalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    console.error('Terminal error:', error, errorInfo)

    // Send to Sentry/monitoring
    if (process.env.NODE_ENV === 'production') {
      // trackError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          reset={() => this.setState({ hasError: false, error: null })}
        />
      )
    }

    return this.props.children
  }
}
```

#### API Error Handling
```tsx
// lib/api/errorHandler.ts
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public data?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      const error = await response.json()
      throw new APIError(
        error.message || 'API request failed',
        response.status,
        error.code || 'UNKNOWN_ERROR',
        error.data
      )
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }

    // Network error
    throw new APIError(
      'Network error. Please check your connection.',
      0,
      'NETWORK_ERROR'
    )
  }
}

// Usage with error handling
const { data, error } = useQuery({
  queryKey: ['markets'],
  queryFn: () => fetchAPI<Market[]>('/api/markets'),
  onError: (error: APIError) => {
    if (error.code === 'RATE_LIMIT') {
      toast.error('Too many requests. Please wait a moment.')
    } else if (error.status >= 500) {
      toast.error('Server error. Please try again later.')
    } else {
      toast.error(error.message)
    }
  }
})
```

---

### 4. MONITORING & ANALYTICS

#### Performance Monitoring
```tsx
// lib/monitoring/performance.ts
export function measureRender(componentName: string) {
  if (typeof window === 'undefined') return

  const start = performance.now()

  return () => {
    const end = performance.now()
    const duration = end - start

    // Log slow renders (> 16ms = 60fps)
    if (duration > 16) {
      console.warn(`Slow render: ${componentName} took ${duration.toFixed(2)}ms`)

      // Track in analytics
      // analytics.track('slow_render', { component: componentName, duration })
    }
  }
}

// Usage
function MarketCard({ market }: Props) {
  const endMeasure = measureRender('MarketCard')

  useEffect(() => {
    return endMeasure
  })

  return <Card>...</Card>
}
```

#### User Analytics
```tsx
// Track user interactions
const { filter } = useTerminalStore()

useEffect(() => {
  analytics.track('filter_changed', { filter })
}, [filter])

const handleBetPlaced = (bet: Bet) => {
  analytics.track('bet_placed', {
    marketAddress: bet.marketAddress,
    outcome: bet.outcome,
    amount: bet.amount,
    odds: bet.odds
  })
}

// Track errors
queryClient.setDefaultOptions({
  queries: {
    onError: (error) => {
      analytics.track('query_error', {
        message: error.message,
        query: error.meta?.queryKey
      })
    }
  }
})
```

---

## 🎯 IMPLEMENTATION CHECKLIST

### Phase 1: Edge Case Handling
- [ ] Empty states for all sections
- [ ] Loading skeletons everywhere
- [ ] Error boundaries at route level
- [ ] Network error handling
- [ ] Input validation

### Phase 2: Performance
- [ ] Code splitting for heavy components
- [ ] Memoization of expensive operations
- [ ] Virtual scrolling for long lists
- [ ] Image optimization
- [ ] Bundle size < 500KB

### Phase 3: Caching
- [ ] React Query setup
- [ ] SessionStorage for persistence
- [ ] IndexedDB for offline
- [ ] Cache invalidation strategy

### Phase 4: Infrastructure
- [ ] WebSocket connection manager
- [ ] State management (Zustand)
- [ ] Error tracking integration
- [ ] Performance monitoring

### Phase 5: Testing
- [ ] Unit tests for edge cases
- [ ] E2E tests for critical flows
- [ ] Performance testing
- [ ] Load testing (stress test)

---

**This document covers all critical edge cases and optimizations!** 🚀

Ready to implement these patterns?
