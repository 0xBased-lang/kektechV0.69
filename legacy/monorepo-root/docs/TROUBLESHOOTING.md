# TROUBLESHOOTING GUIDE

**Last Updated**: 2025-11-14
**Purpose**: Document critical issues and solutions to prevent future time loss

---

## 🚨 CRITICAL ISSUE: 500 Errors on Vercel (RESOLVED)

**Date Encountered**: 2025-11-14
**Time Lost**: ~8 hours
**Resolution Time**: 15 minutes (once root cause identified)

### Symptoms

- ✅ Local development working perfectly
- ❌ Production (Vercel) returning 500 errors
- ❌ Specific endpoint failing: `/api/comments/market/[marketAddress]`
- ❌ Error message: "Failed to execute 'json'"
- ❌ Build warnings about Node.js APIs in Edge Runtime

### Root Cause

**Package**: `isomorphic-dompurify` (used in `lib/utils/sanitize.ts`)

**Problem Chain**:
1. `isomorphic-dompurify` depends on `jsdom` for server-side operation
2. `jsdom` depends on `parse5` (an ESM module)
3. Vercel Edge Runtime tries to `require()` the ESM module `parse5`
4. ESM modules cannot be loaded with `require()` → Fatal error
5. Error manifests as 500 status with "Failed to execute 'json'" message

### Why This Was Hard to Debug

1. **Local vs Production**: Works locally because Node.js handles ESM/CommonJS better
2. **Build Warnings Hidden**: `ignoreBuildErrors: true` in `next.config.ts` suppressed warnings
3. **Generic Error**: "Failed to execute 'json'" didn't indicate the real problem
4. **Database Red Herring**: DATABASE_URL warnings distracted from real issue
5. **Vercel Logs**: Build warnings mentioned "Node.js API not supported in Edge Runtime" but got lost in noise

### Solution

**Remove the problematic package and replace with server-safe code**

#### Step 1: Remove Package
```bash
npm uninstall isomorphic-dompurify
```

#### Step 2: Replace with Server-Safe Sanitization

File: `lib/utils/sanitize.ts`

```typescript
/**
 * Server-safe sanitization - no DOM dependencies
 * Works in all environments (Node.js, Edge Runtime, Browser)
 */
export const sanitizeComment = (comment: string): string => {
  if (!comment || typeof comment !== 'string') {
    return '';
  }

  // Remove all HTML tags
  let sanitized = comment.replace(/<[^>]*>/g, '');

  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>"']/g, '');

  // Trim whitespace and limit length
  return sanitized.trim().slice(0, 1000);
};

export const sanitizeAddress = (address: string): string => {
  if (!address || typeof address !== 'string') {
    throw new Error('Invalid address: must be a string');
  }

  const cleaned = address.trim().toLowerCase();

  // Validate Ethereum address format (0x + 40 hex chars)
  if (!/^0x[a-f0-9]{40}$/i.test(cleaned)) {
    throw new Error('Invalid address format');
  }

  return cleaned;
};
```

#### Step 3: Update API Routes

Since `sanitizeAddress` now throws errors instead of returning null, update error handling:

```typescript
// OLD CODE (breaks with new sanitize function)
const marketAddress = sanitizeAddress(rawMarketAddress);
if (!marketAddress) {
  return NextResponse.json(
    { success: false, error: 'Invalid market address format' },
    { status: 400 }
  );
}

// NEW CODE (works with error-throwing function)
let marketAddress: string;
try {
  marketAddress = sanitizeAddress(rawMarketAddress);
} catch (error) {
  return NextResponse.json(
    { success: false, error: 'Invalid market address format' },
    { status: 400 }
  );
}
```

#### Step 4: Deploy
```bash
git add -A
git commit -m "fix: remove isomorphic-dompurify to resolve ESM error on Vercel"
vercel --prod
```

### Verification

Test all API endpoints:
```bash
# Database health
curl https://kektech-frontend.vercel.app/api/health/db

# Comments endpoint (was failing)
curl "https://kektech-frontend.vercel.app/api/comments/market/0x31d2BC49A6FD4a066F5f8AC61Acd0E6c9105DD84"

# Top comments
curl "https://kektech-frontend.vercel.app/api/comments/top?timeframe=all&limit=5"
```

All should return 200 status with valid JSON.

### Prevention for Future

1. **Never use packages with heavy dependencies for simple tasks**
   - HTML sanitization can be done with simple regex for server-side
   - Only use DOMPurify on client-side if you really need HTML rendering

2. **Check Vercel build logs carefully**
   - Look for "Node.js API not supported in Edge Runtime" warnings
   - These warnings indicate production failures

3. **Don't suppress build errors**
   - Remove `ignoreBuildErrors: true` from `next.config.ts`
   - Fix TypeScript errors as they appear

4. **Test production builds locally**
   ```bash
   npm run build
   npm start
   ```

5. **Use Vercel CLI for testing**
   ```bash
   vercel dev  # Test with production-like environment
   ```

### Key Learnings

1. ✅ **Local ≠ Production**: Just because it works locally doesn't mean it works on Vercel
2. ✅ **ESM/CommonJS**: Be careful with packages that have complex dependency trees
3. ✅ **Simple Solutions**: For basic sanitization, pure JavaScript is safer than heavy libraries
4. ✅ **Build Warnings**: Don't ignore build warnings - they indicate real problems
5. ✅ **Documentation**: Document issues immediately to save time in future

---

## 🔧 OTHER COMMON ISSUES

### Issue: Database Connection Errors

**Symptoms**: `PrismaClientInitializationError`

**Solutions**:
1. Check `DATABASE_URL` in Vercel environment variables
2. Verify Supabase connection pooling enabled
3. Use `createClient()` lazy initialization in API routes

### Issue: CORS Errors

**Symptoms**: `No 'Access-Control-Allow-Origin' header`

**Solution**: Add CORS headers in API routes:
```typescript
return NextResponse.json(data, {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }
});
```

### Issue: Contract ABI Import Errors

**Symptoms**: `Cannot find module './contracts/abis/...'`

**Solution**: Verify paths in `lib/contracts/addresses.ts` and ensure ABIs are in correct location

---

## 📚 USEFUL DEBUGGING COMMANDS

### Local Testing
```bash
# Clean build
rm -rf .next
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Test API routes locally
curl http://localhost:3000/api/[endpoint]
```

### Production Debugging
```bash
# Check Vercel logs
vercel logs

# Test production endpoint
curl https://your-domain.vercel.app/api/[endpoint]

# Check deployment status
vercel ls
```

### Database Debugging
```bash
# Test Supabase connection
npx supabase db remote status

# Check migrations
npx prisma migrate status

# Generate Prisma client
npx prisma generate
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] Run `npm run build` locally (no errors)
- [ ] Run `npx tsc --noEmit` (no TypeScript errors)
- [ ] Test all API routes locally
- [ ] Check environment variables in Vercel
- [ ] Review build logs for warnings
- [ ] Test production endpoint after deployment
- [ ] Monitor logs for 5 minutes after deployment

---

**Remember**: Time spent documenting issues = Time saved in future debugging!
