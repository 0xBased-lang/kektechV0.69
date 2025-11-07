# 🎯 MASTER IMPLEMENTATION PLAN
## 10-Week Complete Transformation Roadmap
### Educational Platform + Downloadable Bot Systems with Backtesting & Optimization

**Document Status:** ⚠️ PRIMARY REFERENCE - DO NOT LOSE THIS ⚠️
**Project Start:** TBD (After bot selection)
**Target Completion:** 10 weeks from start
**Methodology:** Evidence-based, systematic, bulletproof implementation

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Phase 1: Course Platform Enhancement (Weeks 1-3)](#phase-1-course-platform-enhancement)
4. [Phase 2: Download Infrastructure (Weeks 4-5)](#phase-2-download-infrastructure)
5. [Phase 3: Pricing & Subscriptions (Weeks 6-7)](#phase-3-pricing--subscriptions)
6. [Phase 4: Bot Development (Weeks 8-9)](#phase-4-bot-development)
7. [Phase 5: Testing & Launch (Week 10)](#phase-5-testing--launch)
8. [Database Schema](#database-schema)
9. [Technical Specifications](#technical-specifications)
10. [Success Metrics](#success-metrics)
11. [Risk Management](#risk-management)

---

## 🎯 EXECUTIVE SUMMARY

### What We're Building

**Educational Platform**:
- ✅ Full course access (57 lessons)
- ✅ Individual module purchases (9 modules)
- ✅ Integrated diagrams (200+ professional visuals)
- ✅ 4-tier subscription system

**Bot Systems** (Downloadable Python Code):
- ✅ 3 professional trading bots (TBD which ones)
- ✅ Complete backtesting framework
- ✅ Strategy optimization tools
- ✅ Performance analytics
- ✅ Setup guides & documentation

**Revenue Model**:
- One-time purchases (courses, modules, bots)
- Monthly subscriptions (access to multiple products)
- Bundle packages (discounted combinations)
- Lifetime updates for purchases

### Timeline & Deliverables

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | Weeks 1-3 | Enhanced course platform with 200 diagrams |
| Phase 2 | Weeks 4-5 | Download infrastructure & product catalog |
| Phase 3 | Weeks 6-7 | Pricing system & subscription management |
| Phase 4 | Weeks 8-9 | 3 working bots with backtesting |
| Phase 5 | Week 10 | Testing, launch, documentation |

### Revenue Projections

**Year 1 (Conservative)**: $156K
**Year 1 (Optimistic)**: $400K
**Year 3 (With 17 bots)**: $1.2M - $2M

---

## 📊 PROJECT OVERVIEW

### Current State (Week 0)

**What We Have**:
- ✅ Working course platform (36% complete)
- ✅ 50/50 lessons with Mermaid diagrams
- ✅ 200 unused professional PNG diagrams
- ✅ User authentication & database
- ✅ Admin panel
- ✅ Binary pricing ($0 or $347)

**What's Missing** (FROM INVESTIGATION):
- ❌ Tiered pricing system (4 tiers planned)
- ❌ Subscription billing
- ❌ Modular course purchases
- ❌ Bot systems (0/17 planned)
- ❌ Download infrastructure
- ❌ Bundle system
- ❌ Backtesting framework

### Target State (Week 10)

**Complete Ecosystem**:
- ✅ Professional course platform (95% complete)
- ✅ 200+ diagrams integrated
- ✅ 4-tier pricing ($47-$997/month)
- ✅ Individual module purchases
- ✅ 3 working downloadable bots
- ✅ Backtesting framework
- ✅ Strategy optimizer
- ✅ Download system
- ✅ Bundle pricing
- ✅ Subscription management

---

## 🚀 PHASE 1: COURSE PLATFORM ENHANCEMENT (Weeks 1-3)

### Week 1: Diagram Integration System

**Objective**: Integrate 200 existing diagrams into lesson content

#### Day 1-2: Analysis & Mapping

**Tasks**:
1. Audit all 200 diagrams in `/visual-assets/diagrams/`
2. Map diagrams to corresponding lessons
3. Create metadata for each diagram
4. Plan integration strategy

**Deliverables**:
```json
{
  "diagram_mapping": {
    "lesson_1": ["diagram-001.png", "diagram-002.png"],
    "lesson_2": ["diagram-003.png"],
    // ... all mappings
  },
  "unmapped_diagrams": ["orphan-001.png"],
  "integration_plan": "See DIAGRAM_INTEGRATION_PLAN.md"
}
```

**Script to Create**:
```typescript
// scripts/analyze-diagrams.ts
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

interface DiagramMapping {
  filename: string;
  path: string;
  suggestedLesson: string;
  keywords: string[];
  module: string;
}

async function analyzeDiagrams() {
  const diagramsPath = './visual-assets/diagrams';
  const modules = fs.readdirSync(diagramsPath);

  const mappings: DiagramMapping[] = [];

  for (const module of modules) {
    const modulePath = path.join(diagramsPath, module);
    if (!fs.statSync(modulePath).isDirectory()) continue;

    const diagrams = fs.readdirSync(modulePath)
      .filter(f => f.endsWith('.png'));

    for (const diagram of diagrams) {
      // Extract keywords from filename
      const keywords = diagram
        .replace('.png', '')
        .split('-')
        .map(k => k.toLowerCase());

      mappings.push({
        filename: diagram,
        path: `/diagrams/${module}/${diagram}`,
        suggestedLesson: inferLesson(keywords, module),
        keywords,
        module
      });
    }
  }

  return mappings;
}

function inferLesson(keywords: string[], module: string): string {
  // Map keywords to lesson topics
  const lessonMap: Record<string, string[]> = {
    'market-microstructure': ['market', 'microstructure', 'order', 'book'],
    'hft-latency': ['hft', 'latency', 'speed', 'execution'],
    'arbitrage': ['arbitrage', 'spread', 'convergence'],
    // ... comprehensive mapping
  };

  for (const [lesson, lessonKeywords] of Object.entries(lessonMap)) {
    if (keywords.some(k => lessonKeywords.includes(k))) {
      return lesson;
    }
  }

  return 'unmapped';
}
```

#### Day 3-4: Database Integration

**Tasks**:
1. Create migration for diagram references
2. Build integration script
3. Update lesson content with diagram tags
4. Upload diagrams to public directory

**Database Changes**:
```prisma
// prisma/schema.prisma
model Lesson {
  // ... existing fields
  diagrams      Json?     // Array of diagram objects
  visualAssets  Json?     // Metadata for all visual assets
}
```

**Integration Script**:
```typescript
// scripts/integrate-diagrams.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface Diagram {
  filename: string;
  path: string;
  title: string;
  description: string;
  placement: 'top' | 'inline' | 'bottom';
}

async function integrateDiagrams() {
  const mappings = await loadDiagramMappings();

  for (const [lessonSlug, diagrams] of Object.entries(mappings)) {
    const lesson = await prisma.lesson.findUnique({
      where: { slug: lessonSlug }
    });

    if (!lesson) {
      console.warn(`Lesson not found: ${lessonSlug}`);
      continue;
    }

    // Prepare diagram data
    const diagramData = diagrams.map(d => ({
      filename: d.filename,
      path: d.path,
      title: generateTitle(d.filename),
      description: generateDescription(d.filename),
      placement: determinePlacement(lesson.content, d.keywords)
    }));

    // Update lesson with diagrams
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        diagrams: diagramData,
        visualAssets: {
          mermaid: lesson.mermaidDiagrams || [],
          images: diagramData,
          total: (lesson.mermaidDiagrams?.length || 0) + diagramData.length
        }
      }
    });

    // Copy diagrams to public directory
    for (const diagram of diagrams) {
      const sourcePath = path.join('./visual-assets/diagrams', diagram.path);
      const destPath = path.join('./public/diagrams', diagram.path);

      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(sourcePath, destPath);
    }

    console.log(`✅ Integrated ${diagrams.length} diagrams into ${lessonSlug}`);
  }
}

function generateTitle(filename: string): string {
  return filename
    .replace('.png', '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function generateDescription(filename: string): string {
  // Generate contextual description based on filename
  const descriptions: Record<string, string> = {
    'market-microstructure': 'Detailed visualization of market structure and order flow dynamics',
    'hft-latency': 'High-frequency trading latency optimization framework',
    // ... comprehensive descriptions
  };

  const key = filename.replace('.png', '');
  return descriptions[key] || `Visual representation of ${generateTitle(filename)}`;
}

function determinePlacement(content: string, keywords: string[]): 'top' | 'inline' | 'bottom' {
  // Smart placement based on content analysis
  const contentLower = content.toLowerCase();

  // Check if keywords appear in first 20% of content
  const firstSection = content.slice(0, content.length * 0.2);
  if (keywords.some(k => firstSection.toLowerCase().includes(k))) {
    return 'top';
  }

  // Check if keywords appear in last 20%
  const lastSection = content.slice(content.length * 0.8);
  if (keywords.some(k => lastSection.toLowerCase().includes(k))) {
    return 'bottom';
  }

  return 'inline';
}
```

#### Day 5: Frontend Display System

**Tasks**:
1. Create DiagramDisplay component
2. Update lesson pages to show diagrams
3. Add lightbox/zoom functionality
4. Test on all 50 lessons

**Component**:
```typescript
// src/components/lesson/DiagramDisplay.tsx
import Image from 'next/image';
import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface Diagram {
  filename: string;
  path: string;
  title: string;
  description: string;
  placement: 'top' | 'inline' | 'bottom';
}

interface DiagramDisplayProps {
  diagrams: Diagram[];
  placement: 'top' | 'inline' | 'bottom';
}

export function DiagramDisplay({ diagrams, placement }: DiagramDisplayProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredDiagrams = diagrams.filter(d => d.placement === placement);

  if (filteredDiagrams.length === 0) return null;

  return (
    <div className="my-8 space-y-6">
      {filteredDiagrams.map((diagram, index) => (
        <div key={diagram.filename} className="diagram-container">
          <div
            className="cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => {
              setSelectedIndex(index);
              setLightboxOpen(true);
            }}
          >
            <Image
              src={diagram.path}
              alt={diagram.title}
              width={800}
              height={600}
              className="rounded-lg shadow-lg"
              priority={placement === 'top' && index === 0}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <p className="font-semibold">{diagram.title}</p>
            <p className="text-xs">{diagram.description}</p>
          </div>
        </div>
      ))}

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={selectedIndex}
        slides={filteredDiagrams.map(d => ({ src: d.path, alt: d.title }))}
      />
    </div>
  );
}
```

**Updated Lesson Page**:
```typescript
// src/app/lesson/[slug]/page.tsx
import { DiagramDisplay } from '@/components/lesson/DiagramDisplay';

export default async function LessonPage({ params }: { params: { slug: string } }) {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: params.slug }
  });

  const diagrams = lesson.diagrams as Diagram[];

  return (
    <div className="lesson-container">
      {/* Top diagrams */}
      <DiagramDisplay diagrams={diagrams} placement="top" />

      {/* Lesson content */}
      <div className="prose max-w-none">
        {lesson.content}
      </div>

      {/* Inline diagrams (can be inserted via content markers) */}
      <DiagramDisplay diagrams={diagrams} placement="inline" />

      {/* Bottom diagrams */}
      <DiagramDisplay diagrams={diagrams} placement="bottom" />
    </div>
  );
}
```

**Success Criteria**:
- ✅ All 200 diagrams mapped to lessons
- ✅ Database updated with diagram references
- ✅ Diagrams display correctly on all lessons
- ✅ Lightbox zoom functionality works
- ✅ Mobile-responsive display
- ✅ Load times < 2 seconds

---

### Week 2: Modular Course Structure

**Objective**: Enable purchasing individual course modules

#### Day 1-2: Database Schema for Modules

**Tasks**:
1. Create Module model
2. Link lessons to modules
3. Define module pricing
4. Create module access control

**Database Changes**:
```prisma
// prisma/schema.prisma

model Module {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  description String
  order       Int

  // Pricing
  price       Float
  stripePriceId String?

  // Content
  lessons     Lesson[]
  totalLessons Int
  duration    Int      // minutes

  // Metadata
  difficulty  String   // "beginner" | "intermediate" | "advanced"
  topics      String[]
  learningObjectives String[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  purchases   ModulePurchase[]
  bundles     BundleModule[]
}

model Lesson {
  id        String  @id @default(cuid())
  // ... existing fields

  // Module relationship
  module    Module? @relation(fields: [moduleId], references: [id])
  moduleId  String?
  orderInModule Int?
}

model ModulePurchase {
  id         String   @id @default(cuid())

  user       User     @relation(fields: [userId], references: [id])
  userId     String

  module     Module   @relation(fields: [moduleId], references: [id])
  moduleId   String

  price      Float
  purchaseDate DateTime @default(now())

  @@unique([userId, moduleId])
}
```

**Migration**:
```bash
npx prisma migrate dev --name add_module_structure
```

#### Day 3: Create Module Seed Data

**Tasks**:
1. Define 9 course modules
2. Map lessons to modules
3. Set module pricing
4. Seed database

**Module Structure**:
```typescript
// prisma/seeds/modules.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const modules = [
  {
    title: "Market Microstructure Fundamentals",
    slug: "market-microstructure",
    description: "Deep dive into market structure, order types, and execution mechanics",
    order: 1,
    price: 47,
    difficulty: "beginner",
    topics: ["market-structure", "order-flow", "liquidity"],
    learningObjectives: [
      "Understand order book dynamics",
      "Master order types and routing",
      "Analyze bid-ask spreads and market depth"
    ],
    lessons: [1, 2, 3, 4, 5, 6]  // lesson IDs
  },
  {
    title: "Statistical Arbitrage & Pairs Trading",
    slug: "statistical-arbitrage",
    description: "Quantitative strategies for exploiting statistical relationships",
    order: 2,
    price: 67,
    difficulty: "intermediate",
    topics: ["arbitrage", "statistics", "pairs-trading"],
    learningObjectives: [
      "Build cointegration-based strategies",
      "Implement pairs trading algorithms",
      "Optimize statistical models"
    ],
    lessons: [7, 8, 9, 10, 11, 12, 13]
  },
  {
    title: "High-Frequency Trading (HFT)",
    slug: "high-frequency-trading",
    description: "Low-latency strategies and infrastructure for HFT",
    order: 3,
    price: 97,
    difficulty: "advanced",
    topics: ["hft", "latency", "market-making"],
    learningObjectives: [
      "Optimize execution speed to microseconds",
      "Build market-making algorithms",
      "Implement co-location strategies"
    ],
    lessons: [14, 15, 16, 17, 18, 19]
  },
  {
    title: "Machine Learning for Trading",
    slug: "machine-learning-trading",
    description: "Apply ML/AI to predict market movements and optimize strategies",
    order: 4,
    price: 87,
    difficulty: "advanced",
    topics: ["machine-learning", "prediction", "optimization"],
    learningObjectives: [
      "Build predictive models with scikit-learn",
      "Implement deep learning for time series",
      "Optimize strategies with reinforcement learning"
    ],
    lessons: [20, 21, 22, 23, 24, 25, 26]
  },
  {
    title: "Momentum & Trend Following",
    slug: "momentum-strategies",
    description: "Capture market trends with systematic momentum strategies",
    order: 5,
    price: 57,
    difficulty: "intermediate",
    topics: ["momentum", "trend", "technical-analysis"],
    learningObjectives: [
      "Identify and trade market trends",
      "Build momentum indicators",
      "Optimize entry and exit timing"
    ],
    lessons: [27, 28, 29, 30, 31]
  },
  {
    title: "Mean Reversion Strategies",
    slug: "mean-reversion",
    description: "Profit from price reversals and overbought/oversold conditions",
    order: 6,
    price: 57,
    difficulty: "intermediate",
    topics: ["mean-reversion", "statistics", "oscillators"],
    learningObjectives: [
      "Detect overbought/oversold conditions",
      "Build mean reversion models",
      "Optimize reversal entry points"
    ],
    lessons: [32, 33, 34, 35, 36]
  },
  {
    title: "Market Making & Liquidity Provision",
    slug: "market-making",
    description: "Generate consistent profits by providing liquidity",
    order: 7,
    price: 77,
    difficulty: "advanced",
    topics: ["market-making", "liquidity", "inventory-management"],
    learningObjectives: [
      "Build two-sided market quotes",
      "Manage inventory risk",
      "Optimize spread and sizing"
    ],
    lessons: [37, 38, 39, 40, 41]
  },
  {
    title: "Risk Management & Portfolio Construction",
    slug: "risk-management",
    description: "Protect capital with advanced risk management techniques",
    order: 8,
    price: 67,
    difficulty: "intermediate",
    topics: ["risk", "portfolio", "optimization"],
    learningObjectives: [
      "Calculate VaR and drawdowns",
      "Build optimal portfolios",
      "Implement position sizing"
    ],
    lessons: [42, 43, 44, 45, 46, 47]
  },
  {
    title: "Advanced Execution & Infrastructure",
    slug: "execution-infrastructure",
    description: "Production-grade trading systems and deployment",
    order: 9,
    price: 97,
    difficulty: "advanced",
    topics: ["execution", "infrastructure", "deployment"],
    learningObjectives: [
      "Build FIX protocol connections",
      "Deploy cloud trading infrastructure",
      "Implement monitoring and alerts"
    ],
    lessons: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57]
  }
];

async function seedModules() {
  for (const moduleData of modules) {
    const { lessons, ...data } = moduleData;

    const module = await prisma.module.create({
      data: {
        ...data,
        totalLessons: lessons.length,
        duration: lessons.length * 45  // Assume 45 min per lesson
      }
    });

    // Update lessons with moduleId
    await prisma.lesson.updateMany({
      where: { id: { in: lessons.map(String) } },
      data: {
        moduleId: module.id,
        orderInModule: /* assign sequential order */
      }
    });

    console.log(`✅ Created module: ${module.title}`);
  }
}
```

#### Day 4-5: Module Catalog Page

**Tasks**:
1. Create module catalog page
2. Build module detail pages
3. Add purchase functionality
4. Test module access control

**Catalog Page**:
```typescript
// src/app/modules/page.tsx
import { PrismaClient } from '@prisma/client';
import { ModuleCard } from '@/components/modules/ModuleCard';

const prisma = new PrismaClient();

export default async function ModulesPage() {
  const modules = await prisma.module.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: { lessons: true }
      }
    }
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">Course Modules</h1>
      <p className="text-gray-600 mb-8">
        Build your own learning path by purchasing individual modules
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(module => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </div>
  );
}
```

**Module Card Component**:
```typescript
// src/components/modules/ModuleCard.tsx
import Link from 'next/link';

interface ModuleCardProps {
  module: {
    id: string;
    title: string;
    slug: string;
    description: string;
    price: number;
    difficulty: string;
    totalLessons: number;
    duration: number;
  };
}

export function ModuleCard({ module }: ModuleCardProps) {
  return (
    <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm font-semibold text-blue-600 uppercase">
          {module.difficulty}
        </span>
        <span className="text-2xl font-bold">${module.price}</span>
      </div>

      <h3 className="text-xl font-bold mb-2">{module.title}</h3>
      <p className="text-gray-600 text-sm mb-4">{module.description}</p>

      <div className="flex gap-4 text-sm text-gray-500 mb-4">
        <div>{module.totalLessons} lessons</div>
        <div>{Math.floor(module.duration / 60)}h {module.duration % 60}m</div>
      </div>

      <Link
        href={`/modules/${module.slug}`}
        className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
      >
        View Details
      </Link>
    </div>
  );
}
```

**Success Criteria**:
- ✅ 9 modules defined and seeded
- ✅ All 57 lessons linked to modules
- ✅ Module catalog page displays all modules
- ✅ Module pricing configured ($47-$97)
- ✅ Access control prevents viewing unpurchased lessons

---

### Week 3: Subscription Tier System

**Objective**: Implement 4-tier subscription system for course access

#### Day 1-2: Subscription Database Schema

**Tasks**:
1. Create PricingTier model
2. Add subscription fields to User
3. Create SubscriptionHistory model
4. Set up tier configurations

**Database Changes**:
```prisma
// prisma/schema.prisma

enum PricingTier {
  FREE
  BASIC
  PROFESSIONAL
  ELITE
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  PAST_DUE
  PAUSED
}

model User {
  id             String    @id @default(cuid())
  // ... existing fields

  // Subscription
  tier           PricingTier @default(FREE)
  subscriptionStatus SubscriptionStatus?
  stripeCustomerId   String?
  stripeSubscriptionId String?
  subscriptionEndsAt DateTime?

  // Relations
  subscriptionHistory SubscriptionHistory[]
  modulePurchases     ModulePurchase[]
}

model SubscriptionHistory {
  id        String   @id @default(cuid())

  user      User     @relation(fields: [userId], references: [id])
  userId    String

  tier      PricingTier
  status    SubscriptionStatus
  startDate DateTime
  endDate   DateTime?
  price     Float

  stripeInvoiceId String?

  createdAt DateTime @default(now())
}

model TierConfiguration {
  id    String      @id @default(cuid())
  tier  PricingTier @unique

  // Pricing
  monthlyPrice  Float
  annualPrice   Float

  // Access limits
  moduleLimit   Int  // Number of modules accessible
  lessonLimit   Int  // Number of lessons accessible
  botLimit      Int  // Number of bots downloadable

  // Features
  features      String[]  // JSON array of feature flags

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Day 3: Seed Tier Configurations

**Tasks**:
1. Define tier benefits
2. Set pricing for each tier
3. Configure access limits
4. Seed database

**Tier Configuration**:
```typescript
// prisma/seeds/tiers.ts
import { PrismaClient, PricingTier } from '@prisma/client';

const prisma = new PrismaClient();

const tierConfigs = [
  {
    tier: PricingTier.FREE,
    monthlyPrice: 0,
    annualPrice: 0,
    moduleLimit: 0,
    lessonLimit: 3,  // First 3 lessons free
    botLimit: 0,
    features: [
      'Access to first 3 lessons',
      'Community forum access',
      'Newsletter subscription'
    ]
  },
  {
    tier: PricingTier.BASIC,
    monthlyPrice: 47,
    annualPrice: 470,  // 2 months free
    moduleLimit: 3,
    lessonLimit: 20,
    botLimit: 1,  // 1 starter bot
    features: [
      'Access to 3 beginner modules',
      '20 total lessons',
      '1 downloadable starter bot',
      'Community forum',
      'Email support'
    ]
  },
  {
    tier: PricingTier.PROFESSIONAL,
    monthlyPrice: 147,
    annualPrice: 1470,
    moduleLimit: 6,
    lessonLimit: 40,
    botLimit: 3,
    features: [
      'Access to 6 modules',
      '40 total lessons',
      '3 downloadable bots',
      'Priority email support',
      'Weekly office hours',
      'Strategy templates'
    ]
  },
  {
    tier: PricingTier.ELITE,
    monthlyPrice: 297,
    annualPrice: 2970,
    moduleLimit: 9,
    lessonLimit: 57,
    botLimit: 8,
    features: [
      'Full course access (all 9 modules)',
      'All 57 lessons',
      '8 downloadable bots',
      'Priority support',
      'Private Discord channel',
      '1-on-1 monthly mentorship',
      'Advanced strategy templates'
    ]
  },
  {
    tier: PricingTier.ENTERPRISE,
    monthlyPrice: 997,
    annualPrice: 9970,
    moduleLimit: 9,
    lessonLimit: 57,
    botLimit: 17,  // All bots (future)
    features: [
      'Full course access',
      'All lessons',
      'All 17 bots (when available)',
      'White-glove support',
      'Custom bot development',
      'Weekly 1-on-1 sessions',
      'Team collaboration tools',
      'Lifetime updates'
    ]
  }
];

async function seedTiers() {
  for (const config of tierConfigs) {
    await prisma.tierConfiguration.upsert({
      where: { tier: config.tier },
      update: config,
      create: config
    });

    console.log(`✅ Created tier: ${config.tier}`);
  }
}
```

#### Day 4-5: Access Control System

**Tasks**:
1. Build access control middleware
2. Create tier checking utilities
3. Update lesson pages with access gates
4. Test all tier combinations

**Access Control Utility**:
```typescript
// src/lib/access-control.ts
import { PrismaClient, PricingTier } from '@prisma/client';

const prisma = new PrismaClient();

export class AccessControl {
  async canAccessLesson(userId: string, lessonId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        modulePurchases: true
      }
    });

    if (!user) return false;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: true }
    });

    if (!lesson) return false;

    // Check if user purchased individual module
    if (lesson.module) {
      const hasPurchased = user.modulePurchases.some(
        p => p.moduleId === lesson.module!.id
      );
      if (hasPurchased) return true;
    }

    // Check subscription tier access
    const tierConfig = await prisma.tierConfiguration.findUnique({
      where: { tier: user.tier }
    });

    if (!tierConfig) return false;

    // Get lesson order/number
    const lessonNumber = await this.getLessonNumber(lessonId);

    return lessonNumber <= tierConfig.lessonLimit;
  }

  async canAccessModule(userId: string, moduleId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        modulePurchases: true
      }
    });

    if (!user) return false;

    // Check direct purchase
    const hasPurchased = user.modulePurchases.some(
      p => p.moduleId === moduleId
    );
    if (hasPurchased) return true;

    // Check subscription tier
    const tierConfig = await prisma.tierConfiguration.findUnique({
      where: { tier: user.tier }
    });

    const module = await prisma.module.findUnique({
      where: { id: moduleId }
    });

    if (!tierConfig || !module) return false;

    // Check if module order is within tier limit
    return module.order <= tierConfig.moduleLimit;
  }

  async getLessonNumber(lessonId: string): Promise<number> {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    return lesson?.order || 0;
  }
}
```

**Lesson Access Gate Component**:
```typescript
// src/components/lesson/AccessGate.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { AccessControl } from '@/lib/access-control';

interface AccessGateProps {
  lessonId: string;
  children: React.ReactNode;
}

export async function AccessGate({ lessonId, children }: AccessGateProps) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/lesson/' + lessonId);
  }

  const accessControl = new AccessControl();
  const hasAccess = await accessControl.canAccessLesson(
    session.user.id,
    lessonId
  );

  if (!hasAccess) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">🔒 Upgrade Required</h2>
        <p className="text-gray-600 mb-6">
          This lesson is not included in your current plan.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/pricing" className="btn-primary">
            View Pricing Plans
          </a>
          <a href="/modules" className="btn-secondary">
            Buy Individual Module
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

**Success Criteria**:
- ✅ 4 tier configurations in database
- ✅ Access control correctly limits content by tier
- ✅ Users can upgrade/downgrade tiers
- ✅ Module purchases bypass tier limits
- ✅ Clear upgrade prompts for locked content

---

## 🔧 PHASE 2: DOWNLOAD INFRASTRUCTURE (Weeks 4-5)

### Week 4: Product Catalog System

**Objective**: Create unified product system for courses, modules, and bots

#### Day 1-2: Product Database Schema

**Tasks**:
1. Create Product model
2. Define product types
3. Set up versioning system
4. Create download tracking

**Database Schema**:
```prisma
// prisma/schema.prisma

enum ProductType {
  COURSE
  MODULE
  BOT
  BUNDLE
}

enum BotCategory {
  ARBITRAGE
  HFT
  MARKET_MAKING
  STATISTICAL
  ML_AI
  MOMENTUM
  MEAN_REVERSION
  RISK_MANAGEMENT
}

model Product {
  id          String      @id @default(cuid())
  name        String
  slug        String      @unique
  type        ProductType

  // Description
  shortDescription String
  fullDescription  String   @db.Text

  // Pricing
  price           Float
  stripePriceId   String?
  monthlyPrice    Float?   // For subscription option
  stripeMonthlyPriceId String?

  // Bot-specific fields
  botCategory     BotCategory?
  githubRepoUrl   String?
  version         String?
  pythonVersion   String?
  dependencies    String[]  // Python packages

  // Files
  downloadUrl     String?   // Cloudflare R2 URL
  fileSize        Int?      // Bytes
  checksumSHA256  String?

  // Metadata
  features        String[]
  requirements    String[]
  supportedExchanges String[]  // For bots
  backtestResults Json?      // Performance data

  // Status
  isActive        Boolean   @default(true)
  publishedAt     DateTime?

  // Relations
  purchases       ProductPurchase[]
  downloads       ProductDownload[]
  bundles         BundleProduct[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model ProductPurchase {
  id          String   @id @default(cuid())

  user        User     @relation(fields: [userId], references: [id])
  userId      String

  product     Product  @relation(fields: [productId], references: [id])
  productId   String

  price       Float
  isSubscription Boolean @default(false)

  stripePaymentId String?
  purchaseDate    DateTime @default(now())
  expiresAt       DateTime?  // For subscriptions

  @@unique([userId, productId])
}

model ProductDownload {
  id          String   @id @default(cuid())

  user        User     @relation(fields: [userId], references: [id])
  userId      String

  product     Product  @relation(fields: [productId], references: [id])
  productId   String

  version     String
  downloadedAt DateTime @default(now())
  ipAddress   String
  userAgent   String
}

model Bundle {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String

  price       Float
  savings     Float    // Discount amount

  products    BundleProduct[]

  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model BundleProduct {
  bundle      Bundle   @relation(fields: [bundleId], references: [id])
  bundleId    String

  product     Product  @relation(fields: [productId], references: [id])
  productId   String

  @@id([bundleId, productId])
}
```

#### Day 3-4: File Storage with Cloudflare R2

**Tasks**:
1. Set up Cloudflare R2 bucket
2. Create upload utility
3. Build secure download system
4. Implement version control

**Cloudflare R2 Setup**:
```typescript
// src/lib/storage.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!
  }
});

const BUCKET_NAME = 'algo-trading-platform-products';

export class ProductStorage {
  async uploadBotPackage(
    productId: string,
    version: string,
    zipBuffer: Buffer
  ): Promise<string> {
    const key = `bots/${productId}/v${version}/bot-package.zip`;

    await r2Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: zipBuffer,
      ContentType: 'application/zip',
      Metadata: {
        productId,
        version,
        uploadedAt: new Date().toISOString()
      }
    }));

    return key;
  }

  async getDownloadUrl(
    productId: string,
    version: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const key = `bots/${productId}/v${version}/bot-package.zip`;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    // Generate pre-signed URL valid for 1 hour
    return await getSignedUrl(r2Client, command, { expiresIn });
  }
}
```

**Secure Download Endpoint**:
```typescript
// src/app/api/download/[productId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { ProductStorage } from '@/lib/storage';

const prisma = new PrismaClient();
const storage = new ProductStorage();

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user owns product
  const purchase = await prisma.productPurchase.findUnique({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId: params.productId
      }
    },
    include: {
      product: true
    }
  });

  if (!purchase) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Check subscription expiry
  if (purchase.isSubscription && purchase.expiresAt) {
    if (new Date() > purchase.expiresAt) {
      return NextResponse.json({ error: 'Subscription expired' }, { status: 403 });
    }
  }

  // Log download
  await prisma.productDownload.create({
    data: {
      userId: session.user.id,
      productId: params.productId,
      version: purchase.product.version!,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    }
  });

  // Generate secure download URL
  const downloadUrl = await storage.getDownloadUrl(
    params.productId,
    purchase.product.version!
  );

  return NextResponse.json({ downloadUrl });
}
```

#### Day 5: Product Catalog Pages

**Tasks**:
1. Create bot catalog page
2. Build product detail pages
3. Add version history
4. Implement search/filter

**Bot Catalog Page**:
```typescript
// src/app/bots/page.tsx
import { PrismaClient, ProductType } from '@prisma/client';
import { ProductCard } from '@/components/products/ProductCard';

const prisma = new PrismaClient();

export default async function BotsPage() {
  const bots = await prisma.product.findMany({
    where: {
      type: ProductType.BOT,
      isActive: true,
      publishedAt: { lte: new Date() }
    },
    orderBy: { price: 'asc' }
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">Trading Bot Systems</h1>
      <p className="text-gray-600 mb-8">
        Download production-ready trading bots with backtesting and optimization
      </p>

      {/* Category filters */}
      <BotFilters />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {bots.map(bot => (
          <ProductCard key={bot.id} product={bot} />
        ))}
      </div>
    </div>
  );
}
```

**Success Criteria**:
- ✅ Product database schema implemented
- ✅ Cloudflare R2 storage configured
- ✅ Secure download system working
- ✅ Product catalog pages functional
- ✅ Version control system in place

---

### Week 5: Download Dashboard & Updates

**Objective**: Build user dashboard for managing downloads

#### Day 1-3: My Downloads Dashboard

**Tasks**:
1. Create downloads dashboard
2. Show purchase history
3. Display available updates
4. Add re-download capability

**Dashboard Component**:
```typescript
// src/app/dashboard/downloads/page.tsx
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { DownloadCard } from '@/components/dashboard/DownloadCard';

const prisma = new PrismaClient();

export default async function DownloadsPage() {
  const session = await getServerSession();

  const purchases = await prisma.productPurchase.findMany({
    where: { userId: session!.user.id },
    include: {
      product: true
    },
    orderBy: { purchaseDate: 'desc' }
  });

  const downloads = await prisma.productDownload.findMany({
    where: { userId: session!.user.id },
    include: { product: true },
    orderBy: { downloadedAt: 'desc' },
    take: 10
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">My Downloads</h1>

      {/* Active products */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Your Products</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.map(purchase => (
            <DownloadCard
              key={purchase.id}
              purchase={purchase}
              hasUpdate={checkForUpdate(purchase)}
            />
          ))}
        </div>
      </section>

      {/* Download history */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recent Downloads</h2>
        <DownloadHistory downloads={downloads} />
      </section>
    </div>
  );
}
```

**Download Card**:
```typescript
// src/components/dashboard/DownloadCard.tsx
'use client';

import { useState } from 'react';

interface DownloadCardProps {
  purchase: {
    product: {
      id: string;
      name: string;
      version: string;
      fileSize: number;
    };
    purchaseDate: Date;
  };
  hasUpdate: boolean;
}

export function DownloadCard({ purchase, hasUpdate }: DownloadCardProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);

    try {
      const response = await fetch(`/api/download/${purchase.product.id}`);
      const { downloadUrl } = await response.json();

      // Trigger download
      window.location.href = downloadUrl;
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="border rounded-lg p-6">
      {hasUpdate && (
        <div className="mb-2 text-sm font-semibold text-green-600">
          ✨ Update Available
        </div>
      )}

      <h3 className="text-xl font-bold mb-2">{purchase.product.name}</h3>

      <div className="text-sm text-gray-600 mb-4">
        <div>Version: {purchase.product.version}</div>
        <div>Size: {(purchase.product.fileSize / 1024 / 1024).toFixed(2)} MB</div>
        <div>Purchased: {new Date(purchase.purchaseDate).toLocaleDateString()}</div>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {downloading ? 'Generating Download...' : hasUpdate ? 'Download Update' : 'Download'}
      </button>
    </div>
  );
}
```

#### Day 4-5: Update Notification System

**Tasks**:
1. Build update checker
2. Create notification system
3. Add changelog display
4. Test update flow

**Update Checker**:
```typescript
// src/lib/updates.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkForUpdates(userId: string) {
  const purchases = await prisma.productPurchase.findMany({
    where: { userId },
    include: { product: true }
  });

  const updates = [];

  for (const purchase of purchases) {
    const lastDownload = await prisma.productDownload.findFirst({
      where: {
        userId,
        productId: purchase.productId
      },
      orderBy: { downloadedAt: 'desc' }
    });

    const downloadedVersion = lastDownload?.version || '0.0.0';
    const currentVersion = purchase.product.version || '1.0.0';

    if (isNewerVersion(currentVersion, downloadedVersion)) {
      updates.push({
        product: purchase.product,
        currentVersion,
        downloadedVersion
      });
    }
  }

  return updates;
}

function isNewerVersion(current: string, downloaded: string): boolean {
  const [cMajor, cMinor, cPatch] = current.split('.').map(Number);
  const [dMajor, dMinor, dPatch] = downloaded.split('.').map(Number);

  if (cMajor > dMajor) return true;
  if (cMajor === dMajor && cMinor > dMinor) return true;
  if (cMajor === dMajor && cMinor === dMinor && cPatch > dPatch) return true;

  return false;
}
```

**Success Criteria**:
- ✅ Downloads dashboard functional
- ✅ Users can re-download products
- ✅ Update notifications working
- ✅ Download history tracked
- ✅ Version comparison accurate

---

## 💰 PHASE 3: PRICING & SUBSCRIPTIONS (Weeks 6-7)

### Week 6: Stripe Integration

**Objective**: Implement Stripe for payments and subscriptions

#### Day 1-2: Stripe Configuration

**Tasks**:
1. Set up Stripe products
2. Create price IDs
3. Configure webhooks
4. Test payment flow

**Stripe Setup Script**:
```typescript
// scripts/setup-stripe-products.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

async function setupStripeProducts() {
  // 1. Create subscription products for tiers
  const tiers = [
    { name: 'Basic Tier', monthlyPrice: 47, annualPrice: 470 },
    { name: 'Professional Tier', monthlyPrice: 147, annualPrice: 1470 },
    { name: 'Elite Tier', monthlyPrice: 297, annualPrice: 2970 },
    { name: 'Enterprise Tier', monthlyPrice: 997, annualPrice: 9970 }
  ];

  for (const tier of tiers) {
    const product = await stripe.products.create({
      name: tier.name,
      description: `${tier.name} subscription access`
    });

    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: tier.monthlyPrice * 100,
      currency: 'usd',
      recurring: { interval: 'month' }
    });

    const annualPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: tier.annualPrice * 100,
      currency: 'usd',
      recurring: { interval: 'year' }
    });

    console.log(`✅ Created ${tier.name}:`, {
      productId: product.id,
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id
    });
  }

  // 2. Create one-time products for modules
  // 3. Create one-time products for bots
  // ... (similar pattern)
}
```

#### Day 3-4: Webhook Handler

**Tasks**:
1. Create webhook endpoint
2. Handle subscription events
3. Update user tiers
4. Test webhook flow

**Webhook Handler**:
```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient, PricingTier, SubscriptionStatus } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionCancellation(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailure(event.data.object as Stripe.Invoice);
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: subscription.customer as string }
  });

  if (!user) return;

  const tier = mapStripePriceToTier(subscription.items.data[0].price.id);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      tier,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      stripeSubscriptionId: subscription.id,
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
    }
  });

  await prisma.subscriptionHistory.create({
    data: {
      userId: user.id,
      tier,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(subscription.current_period_start * 1000),
      price: subscription.items.data[0].price.unit_amount! / 100
    }
  });
}

function mapStripePriceToTier(priceId: string): PricingTier {
  const tierMap: Record<string, PricingTier> = {
    [process.env.STRIPE_BASIC_MONTHLY_PRICE_ID!]: PricingTier.BASIC,
    [process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID!]: PricingTier.PROFESSIONAL,
    // ... complete mapping
  };

  return tierMap[priceId] || PricingTier.FREE;
}
```

#### Day 5: Checkout Flow

**Tasks**:
1. Create checkout pages
2. Build Stripe Checkout integration
3. Add success/cancel pages
4. Test full purchase flow

**Checkout API**:
```typescript
// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { priceId, mode } = await request.json();

  const checkoutSession = await stripe.checkout.sessions.create({
    customer_email: session.user.email,
    mode: mode as 'subscription' | 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    metadata: {
      userId: session.user.id
    }
  });

  return NextResponse.json({ url: checkoutSession.url });
}
```

**Success Criteria**:
- ✅ Stripe products configured
- ✅ Webhook handler processing events
- ✅ User tiers update automatically
- ✅ Checkout flow working end-to-end
- ✅ Subscription management functional

---

### Week 7: Pricing Page & Bundle System

**Objective**: Create pricing page and bundle offerings

#### Day 1-3: Pricing Page UI

**Tasks**:
1. Design 4-tier comparison table
2. Add monthly/annual toggle
3. Implement feature comparison
4. Add "Most Popular" badge

**Pricing Page**:
```typescript
// src/app/pricing/page.tsx
'use client';

import { useState } from 'react';
import { PricingCard } from '@/components/pricing/PricingCard';

const tiers = [
  {
    name: 'Basic',
    monthlyPrice: 47,
    annualPrice: 470,
    features: [
      '3 beginner modules',
      '20 total lessons',
      '1 starter bot',
      'Community support',
      'Email support'
    ],
    stripePriceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY!,
      annual: process.env.NEXT_PUBLIC_STRIPE_BASIC_ANNUAL!
    }
  },
  {
    name: 'Professional',
    monthlyPrice: 147,
    annualPrice: 1470,
    popular: true,
    features: [
      '6 modules',
      '40 lessons',
      '3 bots',
      'Priority support',
      'Weekly office hours',
      'Strategy templates'
    ],
    stripePriceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY!,
      annual: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL!
    }
  },
  // ... Elite and Enterprise tiers
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-4">
        Choose Your Plan
      </h1>

      <p className="text-center text-gray-600 mb-8">
        Access world-class algorithmic trading education and bot systems
      </p>

      {/* Billing toggle */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex rounded-lg border p-1">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 rounded-lg ${
              billingPeriod === 'monthly' ? 'bg-blue-600 text-white' : ''
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-4 py-2 rounded-lg ${
              billingPeriod === 'annual' ? 'bg-blue-600 text-white' : ''
            }`}
          >
            Annual (Save 17%)
          </button>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map(tier => (
          <PricingCard
            key={tier.name}
            tier={tier}
            billingPeriod={billingPeriod}
          />
        ))}
      </div>
    </div>
  );
}
```

#### Day 4-5: Bundle System

**Tasks**:
1. Define bundle packages
2. Seed bundle data
3. Create bundle pages
4. Test bundle purchases

**Bundle Definitions**:
```typescript
// prisma/seeds/bundles.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const bundles = [
  {
    name: 'Beginner Bundle',
    slug: 'beginner-bundle',
    description: 'Perfect starting package for new algorithmic traders',
    price: 197,
    savings: 62,
    products: [
      'market-microstructure-module',
      'simple-arbitrage-bot',
      'sentiment-analysis-bot'
    ]
  },
  {
    name: 'Professional Trader Bundle',
    slug: 'professional-bundle',
    description: 'Complete toolkit for serious algorithmic traders',
    price: 1997,
    savings: 1200,
    products: [
      'full-course',
      'arbitrage-bot',
      'hft-bot',
      'ml-bot',
      'market-making-bot',
      'grid-trading-bot',
      'sentiment-bot'
    ]
  }
  // ... more bundles
];

async function seedBundles() {
  for (const bundleData of bundles) {
    const { products, ...data } = bundleData;

    const bundle = await prisma.bundle.create({
      data
    });

    // Link products
    for (const productSlug of products) {
      const product = await prisma.product.findUnique({
        where: { slug: productSlug }
      });

      if (product) {
        await prisma.bundleProduct.create({
          data: {
            bundleId: bundle.id,
            productId: product.id
          }
        });
      }
    }

    console.log(`✅ Created bundle: ${bundle.name}`);
  }
}
```

**Success Criteria**:
- ✅ Pricing page displays all tiers
- ✅ Monthly/annual toggle working
- ✅ Bundle packages defined
- ✅ Bundle checkout functional
- ✅ Savings calculations correct

---

## 🤖 PHASE 4: BOT DEVELOPMENT (Weeks 8-9)

### Bot Development Framework

**Note**: You will select which 3 bots to build initially. Here's the framework for ANY bot we build.

### Week 8: Bot Development Infrastructure

**Objective**: Create reusable bot framework and backtesting system

#### Day 1-2: Base Bot Framework

**Tasks**:
1. Create Python bot template
2. Build backtesting engine
3. Add strategy optimizer
4. Create configuration system

**Base Bot Template**:
```python
# bot_framework/base_bot.py
from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import ccxt
import pandas as pd
import logging

class BaseTradingBot(ABC):
    """
    Base class for all trading bots

    Provides:
    - Exchange connection management
    - Data fetching utilities
    - Position management
    - Risk management
    - Performance tracking
    """

    def __init__(self, config: Dict):
        self.config = config
        self.exchange = self._init_exchange()
        self.positions = {}
        self.trades = []
        self.performance = {
            'total_return': 0.0,
            'sharpe_ratio': 0.0,
            'max_drawdown': 0.0,
            'win_rate': 0.0,
            'total_trades': 0
        }

        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(self.__class__.__name__)

    def _init_exchange(self) -> ccxt.Exchange:
        """Initialize exchange connection with user credentials"""
        exchange_id = self.config.get('exchange', 'binance')

        ExchangeClass = getattr(ccxt, exchange_id)

        exchange = ExchangeClass({
            'apiKey': self.config.get('api_key'),
            'secret': self.config.get('api_secret'),
            'enableRateLimit': True,
            'options': {'defaultType': 'future'}  # spot/future
        })

        return exchange

    @abstractmethod
    def generate_signals(self, data: pd.DataFrame) -> pd.Series:
        """
        Generate trading signals from market data

        Returns:
            pd.Series with values: 1 (buy), -1 (sell), 0 (hold)
        """
        pass

    @abstractmethod
    def calculate_position_size(
        self,
        signal: int,
        price: float,
        volatility: float
    ) -> float:
        """Calculate position size based on signal and risk parameters"""
        pass

    def fetch_ohlcv(
        self,
        symbol: str,
        timeframe: str = '1m',
        limit: int = 1000
    ) -> pd.DataFrame:
        """Fetch OHLCV data from exchange"""
        try:
            ohlcv = self.exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
            df = pd.DataFrame(
                ohlcv,
                columns=['timestamp', 'open', 'high', 'low', 'close', 'volume']
            )
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            return df
        except Exception as e:
            self.logger.error(f"Error fetching OHLCV: {e}")
            raise

    def execute_trade(
        self,
        symbol: str,
        side: str,
        amount: float,
        price: Optional[float] = None
    ) -> Dict:
        """Execute trade on exchange"""
        try:
            if price:
                order = self.exchange.create_limit_order(
                    symbol, side, amount, price
                )
            else:
                order = self.exchange.create_market_order(
                    symbol, side, amount
                )

            self.trades.append(order)
            self.logger.info(f"Executed {side} order: {amount} {symbol}")

            return order
        except Exception as e:
            self.logger.error(f"Error executing trade: {e}")
            raise

    def run_backtest(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        initial_capital: float = 10000
    ) -> Dict:
        """Run backtest on historical data"""
        from bot_framework.backtester import Backtester

        backtester = Backtester(self, initial_capital)
        results = backtester.run(symbol, start_date, end_date)

        return results

    def optimize_parameters(
        self,
        symbol: str,
        param_grid: Dict,
        start_date: str,
        end_date: str
    ) -> Dict:
        """Optimize strategy parameters using grid search"""
        from bot_framework.optimizer import StrategyOptimizer

        optimizer = StrategyOptimizer(self)
        best_params = optimizer.grid_search(
            symbol, param_grid, start_date, end_date
        )

        return best_params
```

**Backtesting Engine**:
```python
# bot_framework/backtester.py
import pandas as pd
import numpy as np
from typing import Dict
import matplotlib.pyplot as plt

class Backtester:
    """
    Backtesting engine for trading strategies

    Features:
    - Realistic slippage and commission modeling
    - Position tracking
    - Performance metrics calculation
    - Equity curve visualization
    """

    def __init__(self, bot, initial_capital: float = 10000):
        self.bot = bot
        self.initial_capital = initial_capital
        self.capital = initial_capital
        self.positions = {}
        self.trades = []
        self.equity_curve = []

        # Trading costs
        self.commission_rate = 0.001  # 0.1%
        self.slippage_rate = 0.0005   # 0.05%

    def run(
        self,
        symbol: str,
        start_date: str,
        end_date: str
    ) -> Dict:
        """Run backtest"""
        # Fetch historical data
        data = self._fetch_historical_data(symbol, start_date, end_date)

        # Generate signals
        signals = self.bot.generate_signals(data)

        # Execute trades based on signals
        for i in range(len(data)):
            row = data.iloc[i]
            signal = signals.iloc[i]

            if signal != 0:
                self._execute_backtest_trade(
                    symbol, signal, row['close'], row['timestamp']
                )

            # Update equity
            self._update_equity(row['close'])

        # Calculate performance metrics
        performance = self._calculate_performance()

        # Generate visualizations
        self._plot_results(data, signals)

        return performance

    def _execute_backtest_trade(
        self,
        symbol: str,
        signal: int,
        price: float,
        timestamp: pd.Timestamp
    ):
        """Execute trade in backtest (paper trading)"""
        # Calculate position size
        volatility = self._calculate_volatility()
        position_size = self.bot.calculate_position_size(
            signal, price, volatility
        )

        # Apply slippage
        execution_price = price * (1 + signal * self.slippage_rate)

        # Calculate commission
        commission = position_size * execution_price * self.commission_rate

        # Update capital and positions
        trade_cost = position_size * execution_price + commission

        if signal == 1:  # Buy
            if self.capital >= trade_cost:
                self.capital -= trade_cost
                self.positions[symbol] = self.positions.get(symbol, 0) + position_size

                self.trades.append({
                    'timestamp': timestamp,
                    'symbol': symbol,
                    'side': 'buy',
                    'price': execution_price,
                    'amount': position_size,
                    'commission': commission
                })
        elif signal == -1:  # Sell
            if self.positions.get(symbol, 0) > 0:
                sell_amount = min(position_size, self.positions[symbol])
                self.capital += sell_amount * execution_price - commission
                self.positions[symbol] -= sell_amount

                self.trades.append({
                    'timestamp': timestamp,
                    'symbol': symbol,
                    'side': 'sell',
                    'price': execution_price,
                    'amount': sell_amount,
                    'commission': commission
                })

    def _calculate_performance(self) -> Dict:
        """Calculate performance metrics"""
        equity = np.array(self.equity_curve)
        returns = np.diff(equity) / equity[:-1]

        total_return = (equity[-1] - self.initial_capital) / self.initial_capital

        sharpe_ratio = np.sqrt(252) * np.mean(returns) / np.std(returns) if len(returns) > 0 else 0

        cumulative = np.maximum.accumulate(equity)
        drawdown = (equity - cumulative) / cumulative
        max_drawdown = np.min(drawdown)

        winning_trades = [t for t in self.trades if self._is_winning_trade(t)]
        win_rate = len(winning_trades) / len(self.trades) if self.trades else 0

        return {
            'total_return': total_return,
            'sharpe_ratio': sharpe_ratio,
            'max_drawdown': max_drawdown,
            'win_rate': win_rate,
            'total_trades': len(self.trades),
            'final_capital': equity[-1]
        }

    def _plot_results(self, data: pd.DataFrame, signals: pd.Series):
        """Generate performance visualizations"""
        fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(14, 10))

        # Price and signals
        ax1.plot(data['timestamp'], data['close'], label='Price')
        buy_signals = data[signals == 1]
        sell_signals = data[signals == -1]
        ax1.scatter(buy_signals['timestamp'], buy_signals['close'],
                   color='green', marker='^', label='Buy', s=100)
        ax1.scatter(sell_signals['timestamp'], sell_signals['close'],
                   color='red', marker='v', label='Sell', s=100)
        ax1.set_title('Price and Trading Signals')
        ax1.legend()

        # Equity curve
        ax2.plot(self.equity_curve)
        ax2.set_title('Equity Curve')
        ax2.set_ylabel('Capital ($)')

        # Drawdown
        equity = np.array(self.equity_curve)
        cumulative = np.maximum.accumulate(equity)
        drawdown = (equity - cumulative) / cumulative * 100
        ax3.fill_between(range(len(drawdown)), drawdown, 0, alpha=0.3, color='red')
        ax3.set_title('Drawdown')
        ax3.set_ylabel('Drawdown (%)')

        plt.tight_layout()
        plt.savefig('backtest_results.png')
        plt.close()
```

**Strategy Optimizer**:
```python
# bot_framework/optimizer.py
from typing import Dict
import itertools
import pandas as pd
from tqdm import tqdm

class StrategyOptimizer:
    """
    Optimize strategy parameters using grid search

    Example:
        param_grid = {
            'short_window': [5, 10, 20],
            'long_window': [50, 100, 200],
            'threshold': [0.01, 0.02, 0.03]
        }

        best_params = optimizer.grid_search(
            'BTC/USDT', param_grid, '2023-01-01', '2023-12-31'
        )
    """

    def __init__(self, bot):
        self.bot = bot

    def grid_search(
        self,
        symbol: str,
        param_grid: Dict,
        start_date: str,
        end_date: str,
        metric: str = 'sharpe_ratio'
    ) -> Dict:
        """Perform grid search optimization"""
        # Generate all parameter combinations
        param_names = list(param_grid.keys())
        param_values = list(param_grid.values())
        combinations = list(itertools.product(*param_values))

        results = []

        print(f"Testing {len(combinations)} parameter combinations...")

        for combo in tqdm(combinations):
            # Set parameters
            params = dict(zip(param_names, combo))
            self._set_bot_parameters(params)

            # Run backtest
            performance = self.bot.run_backtest(
                symbol, start_date, end_date
            )

            results.append({
                'params': params,
                'performance': performance
            })

        # Find best parameters
        best_result = max(results, key=lambda x: x['performance'][metric])

        print(f"\nBest parameters (by {metric}):")
        print(best_result['params'])
        print(f"Performance: {best_result['performance']}")

        return best_result

    def _set_bot_parameters(self, params: Dict):
        """Update bot configuration with new parameters"""
        for key, value in params.items():
            if hasattr(self.bot, key):
                setattr(self.bot, key, value)
            elif key in self.bot.config:
                self.bot.config[key] = value
```

#### Day 3-5: Documentation Template

**Tasks**:
1. Create bot documentation template
2. Write setup guides
3. Add troubleshooting section
4. Create video tutorials outline

**Documentation Template**:
```markdown
# [BOT_NAME] Trading Bot

## Overview
[Brief description of what the bot does and its strategy]

## Strategy Description
[Detailed explanation of the trading strategy]

### Signal Generation
[How trading signals are generated]

### Position Sizing
[Risk management and position sizing rules]

### Entry/Exit Rules
[Specific entry and exit conditions]

## Installation

### Requirements
- Python 3.9 or higher
- Exchange API credentials (Binance, Coinbase, etc.)
- Minimum $1,000 trading capital recommended

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Configure Credentials
Create a `config.json` file:
```json
{
  "exchange": "binance",
  "api_key": "YOUR_API_KEY",
  "api_secret": "YOUR_API_SECRET",
  "trading_symbol": "BTC/USDT",
  "initial_capital": 10000,
  "risk_per_trade": 0.02
}
```

### Step 3: Run Backtest
```bash
python backtest.py --symbol BTC/USDT --start 2023-01-01 --end 2023-12-31
```

### Step 4: Optimize Parameters
```bash
python optimize.py --symbol BTC/USDT
```

### Step 5: Run Live Trading
```bash
python run_bot.py --mode live
```

## Configuration Options

| Parameter | Description | Default | Range |
|-----------|-------------|---------|-------|
| `risk_per_trade` | % of capital to risk per trade | 0.02 | 0.01-0.05 |
| `stop_loss` | Stop loss % from entry | 0.02 | 0.01-0.05 |
| `take_profit` | Take profit % from entry | 0.04 | 0.02-0.10 |

## Backtesting Results

### Performance Summary (BTC/USDT, 2023)
- **Total Return**: +47.3%
- **Sharpe Ratio**: 2.14
- **Max Drawdown**: -12.5%
- **Win Rate**: 58.3%
- **Total Trades**: 243

### Equity Curve
![Equity Curve](backtest_results/equity_curve.png)

### Monthly Returns
![Monthly Returns](backtest_results/monthly_returns.png)

## Risk Management

### Stop Loss
[Explain stop loss mechanism]

### Position Sizing
[Explain position sizing calculation]

### Maximum Drawdown Controls
[Explain drawdown limits and circuit breakers]

## Troubleshooting

### Common Issues

**Issue**: API Authentication Error
**Solution**: Verify API keys and enable trading permissions

**Issue**: Insufficient Balance
**Solution**: Ensure minimum capital requirements are met

**Issue**: Rate Limit Exceeded
**Solution**: Reduce trading frequency or enable rate limiting

## Support

- Email: support@yourplatform.com
- Discord: [Join our community]
- Documentation: [Full docs link]

## Disclaimer

This bot is provided for educational purposes. Cryptocurrency trading carries substantial risk. Never trade with money you cannot afford to lose. Past performance does not guarantee future results.
```

**Success Criteria**:
- ✅ Base bot framework complete
- ✅ Backtesting engine functional
- ✅ Strategy optimizer working
- ✅ Documentation template ready
- ✅ All components tested

---

### Week 9: Bot Implementation

**Objective**: Build 3 complete trading bots (TBD which ones)

**Note**: You will select 3 bots from the list below. Here are implementation guides for potential options:

#### Bot Option 1: Simple Arbitrage Bot

**Strategy**: Exploit price differences across exchanges

```python
# bots/simple_arbitrage/arbitrage_bot.py
from bot_framework.base_bot import BaseTradingBot
import pandas as pd

class SimpleArbitrageBot(BaseTradingBot):
    """
    Simple inter-exchange arbitrage bot

    Strategy:
    - Monitor price differences across 2+ exchanges
    - Execute buy on cheaper exchange, sell on expensive exchange
    - Account for fees and slippage
    """

    def __init__(self, config):
        super().__init__(config)
        self.secondary_exchange = self._init_secondary_exchange()
        self.min_profit_threshold = config.get('min_profit_threshold', 0.005)  # 0.5%

    def _init_secondary_exchange(self):
        """Initialize second exchange for arbitrage"""
        import ccxt
        exchange_id = self.config.get('secondary_exchange', 'coinbase')
        ExchangeClass = getattr(ccxt, exchange_id)

        return ExchangeClass({
            'apiKey': self.config.get('secondary_api_key'),
            'secret': self.config.get('secondary_api_secret'),
            'enableRateLimit': True
        })

    def find_arbitrage_opportunities(self, symbol: str):
        """Find profitable arbitrage opportunities"""
        # Get prices from both exchanges
        primary_ticker = self.exchange.fetch_ticker(symbol)
        secondary_ticker = self.secondary_exchange.fetch_ticker(symbol)

        primary_bid = primary_ticker['bid']
        primary_ask = primary_ticker['ask']
        secondary_bid = secondary_ticker['bid']
        secondary_ask = secondary_ticker['ask']

        # Calculate arbitrage opportunity
        # Scenario 1: Buy on primary, sell on secondary
        profit_1 = (secondary_bid - primary_ask) / primary_ask

        # Scenario 2: Buy on secondary, sell on primary
        profit_2 = (primary_bid - secondary_ask) / secondary_ask

        # Account for fees (0.1% per trade = 0.2% round trip)
        total_fees = 0.002

        profit_1_net = profit_1 - total_fees
        profit_2_net = profit_2 - total_fees

        if profit_1_net > self.min_profit_threshold:
            return {
                'opportunity': True,
                'buy_exchange': 'primary',
                'sell_exchange': 'secondary',
                'profit': profit_1_net,
                'buy_price': primary_ask,
                'sell_price': secondary_bid
            }
        elif profit_2_net > self.min_profit_threshold:
            return {
                'opportunity': True,
                'buy_exchange': 'secondary',
                'sell_exchange': 'primary',
                'profit': profit_2_net,
                'buy_price': secondary_ask,
                'sell_price': primary_bid
            }
        else:
            return {'opportunity': False}

    def execute_arbitrage(self, opportunity, symbol, amount):
        """Execute arbitrage trade"""
        if opportunity['buy_exchange'] == 'primary':
            buy_exchange = self.exchange
            sell_exchange = self.secondary_exchange
        else:
            buy_exchange = self.secondary_exchange
            sell_exchange = self.exchange

        try:
            # Execute buy order
            buy_order = buy_exchange.create_market_order(
                symbol, 'buy', amount
            )

            # Execute sell order
            sell_order = sell_exchange.create_market_order(
                symbol, 'sell', amount
            )

            self.logger.info(f"Arbitrage executed: {opportunity['profit']*100:.2f}% profit")

            return {
                'success': True,
                'buy_order': buy_order,
                'sell_order': sell_order,
                'profit': opportunity['profit']
            }
        except Exception as e:
            self.logger.error(f"Arbitrage execution failed: {e}")
            return {'success': False, 'error': str(e)}
```

#### Bot Option 2: Sentiment Analysis Bot

**Strategy**: Trade based on social media sentiment

```python
# bots/sentiment_analysis/sentiment_bot.py
from bot_framework.base_bot import BaseTradingBot
import pandas as pd
from textblob import TextBlob
import tweepy

class SentimentAnalysisBot(BaseTradingBot):
    """
    Sentiment-based trading bot

    Strategy:
    - Analyze Twitter/Reddit sentiment for crypto mentions
    - Generate buy/sell signals based on sentiment score
    - Combine with price action for confirmation
    """

    def __init__(self, config):
        super().__init__(config)
        self.twitter_api = self._init_twitter()
        self.sentiment_threshold = config.get('sentiment_threshold', 0.3)

    def _init_twitter(self):
        """Initialize Twitter API"""
        auth = tweepy.OAuthHandler(
            self.config['twitter_api_key'],
            self.config['twitter_api_secret']
        )
        auth.set_access_token(
            self.config['twitter_access_token'],
            self.config['twitter_access_secret']
        )

        return tweepy.API(auth)

    def fetch_sentiment(self, keyword: str, count: int = 100) -> float:
        """Fetch and analyze sentiment from Twitter"""
        tweets = self.twitter_api.search_tweets(
            q=keyword,
            count=count,
            lang='en',
            result_type='recent'
        )

        sentiments = []

        for tweet in tweets:
            analysis = TextBlob(tweet.text)
            sentiments.append(analysis.sentiment.polarity)

        avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0

        self.logger.info(f"Average sentiment for {keyword}: {avg_sentiment:.3f}")

        return avg_sentiment

    def generate_signals(self, data: pd.DataFrame) -> pd.Series:
        """Generate trading signals based on sentiment"""
        signals = pd.Series(0, index=data.index)

        # Fetch current sentiment
        sentiment = self.fetch_sentiment('Bitcoin')

        # Generate signals
        if sentiment > self.sentiment_threshold:
            # Positive sentiment -> Buy signal
            signals.iloc[-1] = 1
        elif sentiment < -self.sentiment_threshold:
            # Negative sentiment -> Sell signal
            signals.iloc[-1] = -1

        return signals

    def calculate_position_size(self, signal, price, volatility):
        """Calculate position size based on signal strength and volatility"""
        base_position = self.config.get('base_position_size', 0.1)

        # Adjust by signal strength
        sentiment = self.fetch_sentiment('Bitcoin')
        signal_strength = abs(sentiment)

        position_size = base_position * signal_strength

        # Adjust for volatility
        if volatility > 0.02:  # High volatility
            position_size *= 0.5

        return position_size
```

#### Bot Option 3: Grid Trading Bot

**Strategy**: Profit from range-bound markets with grid orders

```python
# bots/grid_trading/grid_bot.py
from bot_framework.base_bot import BaseTradingBot
import pandas as pd
import numpy as np

class GridTradingBot(BaseTradingBot):
    """
    Grid trading bot for range-bound markets

    Strategy:
    - Create grid of buy/sell orders
    - Buy at lower grid levels, sell at higher levels
    - Profit from price oscillations within range
    """

    def __init__(self, config):
        super().__init__(config)
        self.grid_levels = config.get('grid_levels', 10)
        self.grid_spacing = config.get('grid_spacing', 0.01)  # 1%
        self.grid_orders = []

    def create_grid(self, symbol: str, center_price: float):
        """Create grid of limit orders"""
        self.grid_orders = []

        # Calculate grid boundaries
        lower_bound = center_price * (1 - self.grid_spacing * self.grid_levels / 2)
        upper_bound = center_price * (1 + self.grid_spacing * self.grid_levels / 2)

        # Create grid levels
        levels = np.linspace(lower_bound, upper_bound, self.grid_levels)

        # Place orders at each grid level
        for i, price in enumerate(levels):
            if price < center_price:
                # Buy orders below current price
                order = self.exchange.create_limit_order(
                    symbol, 'buy', self._calculate_order_size(price), price
                )
                self.grid_orders.append(order)
            elif price > center_price:
                # Sell orders above current price
                order = self.exchange.create_limit_order(
                    symbol, 'sell', self._calculate_order_size(price), price
                )
                self.grid_orders.append(order)

        self.logger.info(f"Created grid with {len(self.grid_orders)} orders")

    def _calculate_order_size(self, price: float) -> float:
        """Calculate order size for grid level"""
        total_capital = self.config.get('total_capital', 10000)
        per_order_capital = total_capital / self.grid_levels

        return per_order_capital / price

    def manage_grid(self, symbol: str, current_price: float):
        """Monitor and rebalance grid"""
        # Check for filled orders
        for order in self.grid_orders:
            order_status = self.exchange.fetch_order(order['id'], symbol)

            if order_status['status'] == 'closed':
                # Order filled - place opposite order
                if order['side'] == 'buy':
                    # Place sell order above
                    new_price = order['price'] * (1 + self.grid_spacing)
                    new_order = self.exchange.create_limit_order(
                        symbol, 'sell', order['amount'], new_price
                    )
                else:
                    # Place buy order below
                    new_price = order['price'] * (1 - self.grid_spacing)
                    new_order = self.exchange.create_limit_order(
                        symbol, 'buy', order['amount'], new_price
                    )

                # Remove filled order and add new one
                self.grid_orders.remove(order)
                self.grid_orders.append(new_order)

                self.logger.info(f"Grid rebalanced: {order['side']} filled at {order['price']}")
```

**Bot Selection Process**:
1. Review available bot strategies
2. Analyze market conditions and viability
3. Select 3 bots based on:
   - Complexity (mix of beginner/advanced)
   - Market conditions (trending vs range-bound)
   - User demand/interest
4. Implement selected bots
5. Run comprehensive backtests
6. Optimize parameters
7. Create documentation
8. Package for distribution

**Success Criteria** (for each bot):
- ✅ Complete implementation with base framework
- ✅ Backtesting shows positive expected returns
- ✅ Parameter optimization completed
- ✅ Documentation written
- ✅ ZIP package created
- ✅ Uploaded to Cloudflare R2
- ✅ Product entry created in database

---

## ✅ PHASE 5: TESTING & LAUNCH (Week 10)

### Week 10: Comprehensive Testing & Launch

**Objective**: Test all components and launch platform

#### Day 1-2: Integration Testing

**Tasks**:
1. Test full user journeys
2. Verify all payment flows
3. Test bot downloads
4. Check access control

**Test Scenarios**:
```typescript
// tests/integration/user-journey.test.ts
describe('Complete User Journey', () => {
  test('New user signup → course purchase → lesson access', async () => {
    // 1. Sign up
    const user = await createTestUser();

    // 2. Browse pricing page
    const pricingPage = await render(<PricingPage />);

    // 3. Purchase Basic tier
    const checkoutSession = await createCheckoutSession('BASIC', 'monthly');
    await completeStripePayment(checkoutSession);

    // 4. Verify tier upgrade
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    expect(updatedUser.tier).toBe('BASIC');

    // 5. Access lessons within tier limit
    const lesson = await prisma.lesson.findFirst({ where: { order: 15 } });
    const hasAccess = await accessControl.canAccessLesson(user.id, lesson.id);
    expect(hasAccess).toBe(true);

    // 6. Verify locked lesson
    const lockedLesson = await prisma.lesson.findFirst({ where: { order: 25 } });
    const hasAccessLocked = await accessControl.canAccessLesson(user.id, lockedLesson.id);
    expect(hasAccessLocked).toBe(false);
  });

  test('Bot purchase → download → version update', async () => {
    // 1. User with Pro tier
    const user = await createTestUser({ tier: 'PROFESSIONAL' });

    // 2. Purchase individual bot
    const bot = await prisma.product.findFirst({ where: { type: 'BOT' } });
    await purchaseProduct(user.id, bot.id);

    // 3. Download bot
    const downloadUrl = await generateDownloadUrl(user.id, bot.id);
    expect(downloadUrl).toBeDefined();

    // 4. Verify download logged
    const downloadLog = await prisma.productDownload.findFirst({
      where: { userId: user.id, productId: bot.id }
    });
    expect(downloadLog).toBeDefined();

    // 5. Update bot version
    await prisma.product.update({
      where: { id: bot.id },
      data: { version: '1.1.0' }
    });

    // 6. Check for update notification
    const updates = await checkForUpdates(user.id);
    expect(updates.length).toBe(1);
  });
});
```

#### Day 3-4: Performance Testing

**Tasks**:
1. Load testing (100+ concurrent users)
2. Database query optimization
3. CDN caching verification
4. Bot download speed testing

**Performance Benchmarks**:
- Page load time: <2 seconds
- API response time: <200ms
- Download generation: <5 seconds
- Checkout completion: <10 seconds
- Database queries: <50ms

#### Day 5: Launch Preparation

**Tasks**:
1. Final bug fixes
2. Deploy to production
3. Configure monitoring
4. Create launch checklist

**Launch Checklist**:
```markdown
# Production Launch Checklist

## Pre-Launch (24 hours before)
- [ ] All tests passing (unit, integration, E2E)
- [ ] Database migrations tested
- [ ] Stripe webhooks configured
- [ ] Cloudflare R2 configured
- [ ] Email templates finalized
- [ ] Error monitoring (Sentry) active
- [ ] Performance monitoring (Vercel Analytics) active
- [ ] Backup strategy in place

## Launch Day (Go-Live)
- [ ] Deploy to production
- [ ] Verify database connections
- [ ] Test Stripe payments (real transactions)
- [ ] Verify bot downloads work
- [ ] Check email notifications
- [ ] Monitor error logs
- [ ] Test all user flows

## Post-Launch (First 48 hours)
- [ ] Monitor user signups
- [ ] Track conversion rates
- [ ] Check payment processing
- [ ] Verify bot downloads
- [ ] Address any bugs immediately
- [ ] Collect user feedback
- [ ] Monitor performance metrics

## Week 1
- [ ] Analyze user behavior
- [ ] Optimize conversion funnels
- [ ] Fix any edge case bugs
- [ ] Improve documentation based on support questions
- [ ] Plan next iterations
```

**Success Criteria**:
- ✅ All integration tests passing
- ✅ Performance benchmarks met
- ✅ Zero critical bugs
- ✅ Monitoring systems active
- ✅ Platform deployed to production
- ✅ First paying customers successfully onboarded

---

## 🗄️ COMPLETE DATABASE SCHEMA

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ====== USERS & AUTH ======

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?

  // Subscription
  tier                   PricingTier         @default(FREE)
  subscriptionStatus     SubscriptionStatus?
  stripeCustomerId       String?
  stripeSubscriptionId   String?
  subscriptionEndsAt     DateTime?

  // Relations
  accounts             Account[]
  sessions             Session[]
  subscriptionHistory  SubscriptionHistory[]
  modulePurchases      ModulePurchase[]
  productPurchases     ProductPurchase[]
  productDownloads     ProductDownload[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ====== ENUMS ======

enum PricingTier {
  FREE
  BASIC
  PROFESSIONAL
  ELITE
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  PAST_DUE
  PAUSED
}

enum ProductType {
  COURSE
  MODULE
  BOT
  BUNDLE
}

enum BotCategory {
  ARBITRAGE
  HFT
  MARKET_MAKING
  STATISTICAL
  ML_AI
  MOMENTUM
  MEAN_REVERSION
  RISK_MANAGEMENT
}

// ====== COURSE CONTENT ======

model Module {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  description String
  order       Int

  // Pricing
  price         Float
  stripePriceId String?

  // Content
  lessons       Lesson[]
  totalLessons  Int
  duration      Int  // minutes

  // Metadata
  difficulty         String  // "beginner" | "intermediate" | "advanced"
  topics             String[]
  learningObjectives String[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  purchases ModulePurchase[]
}

model Lesson {
  id       String  @id @default(cuid())
  title    String
  slug     String  @unique
  content  String  @db.Text
  order    Int

  // Module relationship
  module        Module? @relation(fields: [moduleId], references: [id])
  moduleId      String?
  orderInModule Int?

  // Visual assets
  diagrams      Json?  // Array of diagram objects
  visualAssets  Json?  // Metadata for all visual assets
  mermaidDiagrams Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ModulePurchase {
  id       String   @id @default(cuid())

  user     User     @relation(fields: [userId], references: [id])
  userId   String

  module   Module   @relation(fields: [moduleId], references: [id])
  moduleId String

  price        Float
  purchaseDate DateTime @default(now())

  @@unique([userId, moduleId])
}

// ====== SUBSCRIPTIONS ======

model TierConfiguration {
  id   String      @id @default(cuid())
  tier PricingTier @unique

  // Pricing
  monthlyPrice Float
  annualPrice  Float

  // Access limits
  moduleLimit Int  // Number of modules accessible
  lessonLimit Int  // Number of lessons accessible
  botLimit    Int  // Number of bots downloadable

  // Features
  features String[]  // JSON array of feature flags

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model SubscriptionHistory {
  id        String   @id @default(cuid())

  user      User     @relation(fields: [userId], references: [id])
  userId    String

  tier      PricingTier
  status    SubscriptionStatus
  startDate DateTime
  endDate   DateTime?
  price     Float

  stripeInvoiceId String?

  createdAt DateTime @default(now())
}

// ====== PRODUCTS (Bots, Bundles) ======

model Product {
  id   String      @id @default(cuid())
  name String
  slug String      @unique
  type ProductType

  // Description
  shortDescription String
  fullDescription  String   @db.Text

  // Pricing
  price                Float
  stripePriceId        String?
  monthlyPrice         Float?   // For subscription option
  stripeMonthlyPriceId String?

  // Bot-specific fields
  botCategory        BotCategory?
  githubRepoUrl      String?
  version            String?
  pythonVersion      String?
  dependencies       String[]  // Python packages

  // Files
  downloadUrl    String?   // Cloudflare R2 URL
  fileSize       Int?      // Bytes
  checksumSHA256 String?

  // Metadata
  features           String[]
  requirements       String[]
  supportedExchanges String[]  // For bots
  backtestResults    Json?     // Performance data

  // Status
  isActive    Boolean   @default(true)
  publishedAt DateTime?

  // Relations
  purchases ProductPurchase[]
  downloads ProductDownload[]
  bundles   BundleProduct[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ProductPurchase {
  id String @id @default(cuid())

  user   User   @relation(fields: [userId], references: [id])
  userId String

  product   Product @relation(fields: [productId], references: [id])
  productId String

  price          Float
  isSubscription Boolean  @default(false)

  stripePaymentId String?
  purchaseDate    DateTime @default(now())
  expiresAt       DateTime?  // For subscriptions

  @@unique([userId, productId])
}

model ProductDownload {
  id String @id @default(cuid())

  user   User   @relation(fields: [userId], references: [id])
  userId String

  product   Product @relation(fields: [productId], references: [id])
  productId String

  version      String
  downloadedAt DateTime @default(now())
  ipAddress    String
  userAgent    String
}

model Bundle {
  id          String @id @default(cuid())
  name        String
  slug        String @unique
  description String

  price   Float
  savings Float  // Discount amount

  products BundleProduct[]

  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}

model BundleProduct {
  bundle    Bundle  @relation(fields: [bundleId], references: [id])
  bundleId  String

  product   Product @relation(fields: [productId], references: [id])
  productId String

  @@id([bundleId, productId])
}
```

---

## 📈 SUCCESS METRICS

### Phase 1 Metrics (Weeks 1-3)
- ✅ 200 diagrams integrated
- ✅ 9 modules defined
- ✅ 4 pricing tiers configured
- ✅ Visual content on 100% of lessons

### Phase 2 Metrics (Weeks 4-5)
- ✅ Product catalog operational
- ✅ Download system functional
- ✅ Version control working
- ✅ Average download time <5s

### Phase 3 Metrics (Weeks 6-7)
- ✅ Stripe integration complete
- ✅ Payment success rate >99%
- ✅ Subscription webhooks working
- ✅ Pricing page conversion rate >5%

### Phase 4 Metrics (Weeks 8-9)
- ✅ 3 bots developed and tested
- ✅ All bots show positive backtest results
- ✅ Documentation completion 100%
- ✅ Bot download success rate >99%

### Phase 5 Metrics (Week 10)
- ✅ Zero critical bugs
- ✅ Page load times <2s
- ✅ API response times <200ms
- ✅ First 10 paying customers onboarded

### Revenue Metrics (Year 1)
- **Conservative**: $156K
- **Optimistic**: $400K
- **Conversion Rates**:
  - Visitor → Free signup: 10%
  - Free → Paid: 15%
  - Course purchaser → Bot buyer: 30%

---

## 🚨 RISK MANAGEMENT

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Stripe integration issues | Medium | High | Thorough testing, backup payment processor |
| Bot performance poor | Medium | Critical | Extensive backtesting, parameter optimization |
| Download system failures | Low | High | Cloudflare R2 redundancy, fallback CDN |
| Database performance | Low | Medium | Proper indexing, caching, query optimization |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Low conversion rates | Medium | High | A/B testing, pricing optimization |
| High refund rates | Medium | High | Clear documentation, support system |
| Bot legal issues | Low | Critical | Proper disclaimers, terms of service |
| Competition | High | Medium | Unique value proposition, quality focus |

### Contingency Plans

**Plan A - On Track**: Execute 10-week plan as designed
**Plan B - Behind Schedule**: Skip bundle system, focus on core tiers + 3 bots
**Plan C - Major Issues**: Launch course platform only (6-week plan), add bots later
**Plan D - Emergency**: Launch with existing features, minimal new development

---

## 📁 DELIVERABLES SUMMARY

### Documentation
- ✅ MASTER_IMPLEMENTATION_PLAN.md (This document)
- ✅ ULTRATHINK_INVESTIGATION_REPORT.md
- ✅ COMPLETE_TRANSFORMATION_PLAN.md
- ✅ FINAL_SIMPLIFIED_ARCHITECTURE.md
- ✅ COMPREHENSIVE_GAP_ANALYSIS_REPORT.json

### Code & Infrastructure
- Database schema (10 tables, 8 enums)
- Bot framework (base classes, backtester, optimizer)
- 3 complete trading bots (TBD which ones)
- Download system (Cloudflare R2)
- Pricing system (4 tiers, bundles)
- Access control system
- Stripe integration

### Content
- 200 diagrams integrated
- 9 modules defined
- 57 lessons enhanced
- Bot documentation (3 bots)
- Setup guides

---

## 🎯 NEXT STEPS - IMMEDIATE ACTIONS

### Action 1: Bot Selection
**YOU DECIDE** which 3 bots to build from these options:
1. Simple Arbitrage Bot
2. Sentiment Analysis Bot
3. Grid Trading Bot
4. HFT Market Making Bot
5. Machine Learning Prediction Bot
6. Mean Reversion Bot
7. Momentum Trading Bot
8. Statistical Arbitrage Bot

**Selection Criteria**:
- Beginner-friendly (at least 1)
- Market viability
- Backtesting feasibility
- Unique value proposition

### Action 2: Timeline Commitment
**SET START DATE** for Week 1 execution

### Action 3: Resource Allocation
**CONFIRM** you have:
- Stripe account configured
- Cloudflare R2 account ready
- Exchange API access for backtesting
- Time commitment for 10-week project

---

## ✅ THIS IS THE MASTER PLAN

**Status**: READY TO EXECUTE
**Confidence**: BULLETPROOF
**Next Step**: YOUR DECISION on bot selection

Reply with:
- **"SELECT BOTS"** → We'll discuss and finalize the 3 bots
- **"START WEEK 1"** → Begin Phase 1 immediately (after bot selection)
- **"REVIEW"** → Discuss any questions or modifications
- **"CUSTOM"** → Adjust the plan based on your preferences

This plan is committed to your repository and will be the single source of truth for the next 10 weeks! 🚀
