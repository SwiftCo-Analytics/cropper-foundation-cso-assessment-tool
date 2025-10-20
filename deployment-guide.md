# CSO Self-Assessment Tool - cPanel Deployment Guide

## Overview
This guide will help you deploy your Next.js CSO Self-Assessment Tool to cPanel hosting.

## Prerequisites
- cPanel access with Node.js support
- PostgreSQL database access
- SFTP/FTP access to upload files

## Step 1: Database Setup

### Create PostgreSQL Database in cPanel
1. Log into cPanel
2. Navigate to "PostgreSQL Databases" (or contact hosting provider if not available)
3. Create a new database: `thecrop_csoapp`
4. Create a new PostgreSQL user with a strong password
5. Grant full privileges to the user on the database
6. Note the connection details:
   - Host: localhost (usually)
   - Port: 5432 (default PostgreSQL port)
   - Database name: `thecrop_csoapp`
   - Username and password

## Step 2: Prepare Environment Variables

Create a `.env.production` file with the following variables:

```bash
NODE_ENV=production
DATABASE_URL="postgresql://username:password@localhost:5432/thecrop_csoapp"
NEXTAUTH_SECRET="your-super-secret-key-here-generate-a-random-string"
NEXTAUTH_URL="https://selfassess.csogo.org"
PORT=3000
```

**Important:** Replace the values with your actual database credentials and generate a secure NEXTAUTH_SECRET.

## Step 3: Build Your Application Locally

Run these commands in your project directory:

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build the application
npm run build

# Create production directory
mkdir production-build
```

## Step 4: Prepare Files for Upload

Create a deployment package with these files and directories:

### Essential Files to Upload:
```
production-build/
├── .next/                    # Built Next.js application
├── public/                   # Static assets
├── src/generated/prisma/     # Generated Prisma client
├── prisma/                   # Prisma schema and migrations
├── server.js                 # Custom server file
├── package.json              # Dependencies
├── .env.production           # Environment variables
└── app.js                    # cPanel entry point (see below)
```

### Create app.js for cPanel
Create an `app.js` file in your production-build directory:

```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.production' })

const dev = false // Always false for production
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })
  
  const port = process.env.PORT || 3000
  server.listen(port, (err) => {
    if (err) throw err
    console.log(`Server running on port ${port}`)
  })
})
```

## Step 5: Upload to cPanel

1. **Create SFTP Account:**
   - In cPanel, go to "FTP Accounts"
   - Create a new FTP account for your subdomain
   - Note the credentials

2. **Upload Files:**
   - Use an SFTP client (FileZilla, WinSCP, etc.)
   - Connect to your server
   - Navigate to `/home/thecrop/public_html/selfassess.csogo.org/`
   - Upload all files from your `production-build` directory

3. **Set Permissions:**
   - Ensure `app.js` has execute permissions (755)
   - Ensure `.env.production` has read permissions (644)

## Step 6: Install Dependencies on Server

You have two options:

### Option A: SSH Access (Recommended)
If you have SSH access:
```bash
cd /home/thecrop/public_html/selfassess.csogo.org/
npm install --production
npx prisma migrate deploy
npx prisma generate
```

### Option B: cPanel Terminal
Use cPanel's Terminal feature:
```bash
cd public_html/selfassess.csogo.org/
npm install --production
npx prisma migrate deploy
npx prisma generate
```

## Step 7: Register Node.js Application in cPanel

1. **Access Application Manager:**
   - In cPanel, go to "Software" → "Application Manager"
   - Click "Register Application"

2. **Configure Application:**
   - **Application Name:** cso-self-assessment
   - **Application Root:** `/selfassess.csogo.org`
   - **Application URL:** `selfassess.csogo.org`
   - **Application Startup File:** `app.js`
   - **Application Mode:** Production

3. **Environment Variables:**
   - Add your environment variables from `.env.production`
   - Or reference the `.env.production` file

## Step 8: Database Migration

Run the Prisma migrations to set up your database:

```bash
npx prisma migrate deploy
```

## Step 9: Seed Database (Optional)

If you have seed data:
```bash
npm run db:seed
```

## Step 10: Test Your Application

1. **Check Application Status:**
   - In cPanel Application Manager, ensure your app is running
   - Check the logs for any errors

2. **Test Access:**
   - Visit `https://selfassess.csogo.org`
   - Test the application functionality

## Troubleshooting

### Common Issues:

1. **Application Won't Start:**
   - Check the application logs in cPanel
   - Verify all dependencies are installed
   - Ensure environment variables are correct

2. **Database Connection Issues:**
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure database exists and user has permissions

3. **Port Issues:**
   - cPanel manages ports automatically
   - Don't hardcode ports in your application
   - Use `process.env.PORT` or let cPanel assign

4. **File Permissions:**
   - Ensure `app.js` is executable
   - Check that all files have proper read permissions

### Logs Location:
- Application logs: `/home/thecrop/public_html/selfassess.csogo.org/logs/`
- cPanel error logs: Available in cPanel Error Logs section

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env.production` to version control
   - Use strong, unique secrets
   - Regularly rotate secrets

2. **Database Security:**
   - Use strong database passwords
   - Limit database user privileges
   - Enable SSL for database connections if available

3. **Application Security:**
   - Keep dependencies updated
   - Use HTTPS (SSL certificate is already configured)
   - Implement proper authentication

## Maintenance

### Regular Tasks:
1. **Update Dependencies:**
   ```bash
   npm update
   npm run build
   ```

2. **Database Backups:**
   - Set up regular database backups in cPanel
   - Test backup restoration procedures

3. **Application Monitoring:**
   - Monitor application logs
   - Check application status regularly
   - Monitor database performance

## Support

If you encounter issues:
1. Check cPanel application logs
2. Verify all environment variables
3. Ensure database connectivity
4. Contact hosting provider for Node.js/PostgreSQL support
