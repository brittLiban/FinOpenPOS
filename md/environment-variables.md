# 🔧 Environment Variables Configuration Guide

**Complete environment setup for production-ready multi-tenant SaaS deployment**

## 🎯 **Overview**

FinOpenPOS requires specific environment variables for **multi-tenant SaaS operation**, **Stripe Connect integration**, **Supabase authentication**, and **production deployment**. This guide covers all required variables for enterprise-grade operation.

---

## 📝 **Quick Setup Checklist**

```bash
# Create environment file
touch .env.local

# Add all required variables (see sections below)
# Deploy to production with environment variables configured
# Test with sample transactions
```

**Critical:** Never commit `.env.local` to version control. Add it to `.gitignore`.

---

## 🗃️ **Database & Authentication (Supabase)**

### **Required Variables**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Database Connection (for migrations/admin)
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

### **Where to Find These Values**
```typescript
// Supabase Dashboard Steps:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to Settings → API
4. Copy the values:
   - Project URL → NEXT_PUBLIC_SUPABASE_URL
   - anon/public key → NEXT_PUBLIC_SUPABASE_ANON_KEY  
   - service_role key → SUPABASE_SERVICE_ROLE_KEY
5. For DATABASE_URL, go to Settings → Database → Connection string
```

### **Multi-Tenant Security Configuration**
```bash
# Row-Level Security (RLS) Settings
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase
SUPABASE_AUTH_EXTERNAL_GOOGLE_ENABLED=false    # Optional: Google Auth
SUPABASE_AUTH_EXTERNAL_GITHUB_ENABLED=false    # Optional: GitHub Auth
```

---

## 💳 **Payment Processing (Stripe Connect)**

### **Required Stripe Variables**
```bash
# Stripe Connect Platform Configuration
STRIPE_SECRET_KEY=sk_live_...                   # Production: sk_live_
STRIPE_PUBLISHABLE_KEY=pk_live_...              # Production: pk_live_
STRIPE_WEBHOOK_SECRET=whsec_...                 # Webhook endpoint secret

# Platform Settings
STRIPE_PLATFORM_FEE_PERCENT=2.9                # Your revenue share (2.9%)
STRIPE_PLATFORM_FEE_FIXED=30                   # Fixed fee in cents (30¢)
STRIPE_CURRENCY=usd                             # Default currency
```

### **Development vs Production Keys**
```bash
# Development (Test Mode)
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_51...

# Production (Live Mode)  
STRIPE_SECRET_KEY=sk_live_51...
STRIPE_PUBLISHABLE_KEY=pk_live_51...
```

### **Webhook Configuration**
```typescript
// Stripe Dashboard Setup:
1. Go to https://dashboard.stripe.com/webhooks
2. Create endpoint: https://yourdomain.com/api/webhooks/stripe
3. Select events:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - account.updated
   - invoice.payment_succeeded
4. Copy webhook signing secret → STRIPE_WEBHOOK_SECRET
```

---

## 🌐 **Application Configuration**

### **Site & Business Settings**
```bash
# Application URLs
NEXT_PUBLIC_SITE_URL=https://yourdomain.com     # Production URL
NEXTAUTH_URL=https://yourdomain.com             # Authentication URL
NEXT_PUBLIC_APP_NAME=FinOpenPOS                 # Application name

# Multi-Tenant Platform Settings
NEXT_PUBLIC_PLATFORM_NAME=YourPlatform          # Your SaaS platform name
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourdomain.com
NEXT_PUBLIC_PLATFORM_FEE_DISPLAY=true          # Show fees to clients
```

### **Internationalization Settings**
```bash
# Language Support
NEXT_PUBLIC_DEFAULT_LOCALE=en                   # Default language
NEXT_PUBLIC_SUPPORTED_LOCALES=en,es,pt          # Supported languages
NEXT_PUBLIC_TIMEZONE=America/New_York           # Default timezone
```

### **Feature Toggles**
```bash
# Feature Flags
NEXT_PUBLIC_BARCODE_SCANNING_ENABLED=true      # Enable barcode features
NEXT_PUBLIC_MULTI_LOCATION_ENABLED=true        # Multi-location support
NEXT_PUBLIC_ADVANCED_ANALYTICS_ENABLED=true    # Business intelligence
NEXT_PUBLIC_API_ACCESS_ENABLED=false           # Public API access
```

---

## 📧 **Email & Notifications**

### **Email Service Configuration**
```bash
# Email Provider (Choose one)
# Option 1: SendGrid
SENDGRID_API_KEY=SG.xxx...
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Option 2: AWS SES
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxx...
AWS_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@yourdomain.com

# Option 3: SMTP (Generic)
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-email-password
SMTP_SECURE=true
```

### **Notification Settings**
```bash
# Alert Configuration  
ADMIN_NOTIFICATION_EMAIL=admin@yourdomain.com   # Platform admin email
LOW_STOCK_ALERT_ENABLED=true                    # Inventory alerts
PAYMENT_FAILURE_ALERTS=true                     # Payment issue notifications
SECURITY_ALERT_ENABLED=true                     # Security notifications
```

---

## 🔒 **Security & Authentication**

### **Authentication Secrets**
```bash
# Next.js Authentication
NEXTAUTH_SECRET=your-super-secret-key           # Generate: openssl rand -base64 32
JWT_SECRET=another-secret-key                   # Additional JWT signing

# Session Configuration
SESSION_TIMEOUT=7200                            # Session timeout (2 hours)
PASSWORD_MIN_LENGTH=8                           # Minimum password length
MFA_ENABLED=false                               # Multi-factor authentication
```

### **API Security**
```bash
# Rate Limiting
API_RATE_LIMIT=100                              # Requests per minute
API_RATE_WINDOW=60                              # Time window (seconds)
API_KEY_REQUIRED=false                          # Require API keys

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
```

---

## 📊 **Analytics & Monitoring**

### **Performance Monitoring**
```bash
# Analytics Services (Optional)
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX               # Google Analytics
MIXPANEL_TOKEN=your-mixpanel-token              # Mixpanel analytics
SENTRY_DSN=https://xxx@sentry.io/xxx            # Error tracking

# Performance Monitoring
NEW_RELIC_LICENSE_KEY=xxx                       # New Relic APM
DATADOG_API_KEY=xxx                             # DataDog monitoring
```

### **Business Intelligence**
```bash
# Reporting Configuration
REPORT_GENERATION_ENABLED=true                  # Enable report generation
REPORT_STORAGE_BUCKET=your-s3-bucket           # Report storage
ANALYTICS_RETENTION_DAYS=365                    # Data retention period
```

---

## ☁️ **Production Deployment**

### **Hosting Platform Variables**

#### **Vercel Deployment**
```bash
# Vercel-specific variables
VERCEL_URL=automatically-set                    # Auto-generated by Vercel
VERCEL_ENV=production                           # Environment type

# Build Configuration
NEXT_TELEMETRY_DISABLED=1                       # Disable Next.js telemetry
NODE_ENV=production                             # Production mode
```

#### **Netlify Deployment**
```bash
# Netlify-specific variables  
NETLIFY_SITE_URL=automatically-set              # Auto-generated by Netlify
BUILD_COMMAND=npm run build                     # Build command
```

#### **AWS/Docker Deployment**
```bash
# AWS Configuration
AWS_REGION=us-east-1                            # AWS region
AWS_ACCESS_KEY_ID=AKIA...                       # AWS access key
AWS_SECRET_ACCESS_KEY=xxx...                    # AWS secret

# Container Configuration
PORT=3000                                       # Application port
HOST=0.0.0.0                                    # Host binding
```

### **CDN & Storage**
```bash
# File Storage (Optional)
AWS_S3_BUCKET=your-files-bucket                 # File uploads
AWS_S3_REGION=us-east-1                         # S3 region
CLOUDFLARE_ZONE_ID=xxx                          # CloudFlare CDN
```

---

## 🔧 **Development Environment**

### **Local Development Setup**
```bash
# Development-specific variables
NODE_ENV=development                            # Development mode
NEXT_PUBLIC_DEV_MODE=true                       # Enable dev features
HOT_RELOAD=true                                 # Enable hot reload

# Debug Settings
DEBUG=true                                      # Enable debug logging
LOG_LEVEL=debug                                 # Logging verbosity
CONSOLE_LOGS=true                               # Console output
```

### **Testing Configuration**
```bash
# Test Environment
NEXT_PUBLIC_TEST_MODE=true                      # Test mode indicator
TEST_DATABASE_URL=postgresql://...              # Test database
STRIPE_TEST_MODE=true                           # Use Stripe test keys
```

---

## 📋 **Complete .env.local Template**

```bash
# ==============================================
# FinOpenPOS Environment Configuration
# ==============================================

# Supabase Database & Authentication
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Stripe Connect Payment Processing
STRIPE_SECRET_KEY=sk_live_51...                 # Use sk_test_ for development
STRIPE_PUBLISHABLE_KEY=pk_live_51...            # Use pk_test_ for development  
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLATFORM_FEE_PERCENT=2.9
STRIPE_PLATFORM_FEE_FIXED=30

# Application Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secret-key-here
NEXT_PUBLIC_APP_NAME=FinOpenPOS
NEXT_PUBLIC_PLATFORM_NAME=YourPlatform

# Feature Toggles
NEXT_PUBLIC_BARCODE_SCANNING_ENABLED=true
NEXT_PUBLIC_MULTI_LOCATION_ENABLED=true
NEXT_PUBLIC_ADVANCED_ANALYTICS_ENABLED=true

# Email Configuration (Choose one provider)
SENDGRID_API_KEY=SG.xxx...
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Security & Performance
API_RATE_LIMIT=100
SESSION_TIMEOUT=7200
ALLOWED_ORIGINS=https://yourdomain.com

# Analytics (Optional)
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
SENTRY_DSN=https://xxx@sentry.io/xxx

# Production Settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

---

## ✅ **Environment Validation**

### **Startup Validation Script**
```bash
# Run environment check
npm run env:check

# Test database connection
npm run db:test

# Verify Stripe configuration  
npm run stripe:test

# Validate all integrations
npm run test:integrations
```

### **Required Variables Checklist**
```typescript
// Environment validation
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_SITE_URL',
  'NEXTAUTH_SECRET'
];

// Check all required variables are set
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

---

## 🚨 **Security Best Practices**

### **Environment Security**
```bash
# ❌ NEVER do this:
git add .env.local                              # Don't commit secrets

# ✅ Always do this:
echo ".env.local" >> .gitignore                 # Ignore env files
chmod 600 .env.local                            # Restrict file permissions
```

### **Production Security Checklist**
- [ ] All secrets use production values (not test/dev)
- [ ] Environment variables are not exposed in client-side code
- [ ] `.env.local` is added to `.gitignore`
- [ ] Database connection uses SSL (`?sslmode=require`)
- [ ] Stripe webhook secrets are correctly configured
- [ ] CORS settings restrict to your domain only

---

## 🎯 **Summary**

**Environment configuration is critical for:**

✅ **Multi-Tenant Security**: Proper database isolation and authentication  
✅ **Payment Processing**: Stripe Connect with platform fee collection  
✅ **Production Deployment**: Scalable hosting and performance optimization  
✅ **Business Operations**: Email notifications, analytics, and monitoring  
✅ **Feature Control**: Toggle advanced features based on deployment  

**Result:** Enterprise-grade SaaS platform ready for production deployment and unlimited client scaling! 🚀

---

*For deployment-specific environment setup, refer to your hosting provider's documentation or contact the development team for assistance.*  
  *Business address for receipts/UI*  
  **Set in:** `.env.local`
- `NEXT_PUBLIC_BUSINESS_PHONE`  
  *Business phone for receipts/UI*  
  **Set in:** `.env.local`
- `NEXT_PUBLIC_BUSINESS_EMAIL`  
  *Business email for receipts/UI*  
  **Set in:** `.env.local`

---

## Example `.env.local` File

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BUSINESS_NAME=Your Business Name
NEXT_PUBLIC_BUSINESS_ADDRESS=123 Main St, City, Country
NEXT_PUBLIC_BUSINESS_PHONE=123-456-7890
NEXT_PUBLIC_BUSINESS_EMAIL=info@yourbusiness.com
```

---

**Note:** Never commit your `.env.local` file to version control. Keep your secrets safe!
