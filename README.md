# CSO Self Assessment Tool

A comprehensive self-assessment tool for Civil Society Organizations (CSOs) to evaluate their practices, identify strengths, and discover areas for improvement.

## 🌟 Features

### For Organizations
- **Comprehensive Assessment**: Multi-section questionnaires covering various aspects of CSO operations
- **Automated Scoring**: Real-time calculation of assessment scores with detailed analytics
- **Custom PDF Reports**: Professional reports with personalized recommendations
- **Progress Tracking**: Monitor improvement over time with historical data
- **Shareable Assessment Links**: Easy distribution of assessments to stakeholders
- **Embeddable Assessment Widget**: Integrate assessments into your own website

### For Administrators
- **Admin Dashboard**: Comprehensive overview of all organizations and assessments
- **Question Management**: Create, edit, and organize assessment questions
- **Section Management**: Organize questions into logical sections with custom weighting
- **Report Generation**: Download detailed reports for individual organizations or aggregate data
- **User Management**: Manage organization accounts and permissions

## 🛠 Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, NextAuth.js for authentication
- **Database**: MySQL with Prisma ORM
- **Forms**: React Hook Form with Zod validation
- **PDF Generation**: @react-pdf/renderer
- **Styling**: TailwindCSS with custom components
- **Icons**: Lucide React
- **Animations**: Framer Motion

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or later
- MySQL 8.0 or later (or MariaDB 10.3+)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/cropper-cso-self-assessment-tool.git
   cd cropper-cso-self-assessment-tool
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="mysql://root:password@localhost:3306/cropper_cso_assessment"
   
   # Authentication
   NEXTAUTH_SECRET="your-super-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Application
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # CSO Go WordPress SSO
   CSOGO_SSO_AUTH_URL="https://csogo.org/sso/authenticate"
   CSOGO_SSO_SHARED_SECRET="replace-with-wordpress-sso-shared-secret"
   CSOGO_PASSWORD_RESET_URL="https://csogo.org/wp-login.php?action=lostpassword"
   NEXT_PUBLIC_CSOGO_PASSWORD_RESET_URL="https://csogo.org/wp-login.php?action=lostpassword"
   ```

4. **Database Setup:**
   ```bash
   # If converting from PostgreSQL, you'll need to reset migrations
   # ⚠️ This will delete existing migrations - backup your data first!
   # Option 1: Delete migrations folder and create fresh migration
   rm -rf prisma/migrations
   npx prisma migrate dev --name init
   
   # Option 2: If starting fresh, just run migrations
   npx prisma migrate dev
   
   # (Optional) Seed the database with sample data
   npm run db:seed
   ```
   
   **Note:** If you're converting from PostgreSQL to MySQL, the existing migrations in `prisma/migrations/` are PostgreSQL-specific and won't work with MySQL. You'll need to create a fresh migration after updating the schema provider to `mysql`.

5. **Create an Admin User:**
   ```bash
   npm run create-admin
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## 📱 Usage

### For Organizations
1. Navigate to `/organization/login` to access the organization portal
2. Complete the assessment by answering questions in each section
3. View your results and download the PDF report
4. Track your progress over time through the dashboard

### For Administrators
1. Access the admin panel at `/admin/login`
2. Use the dashboard to view all organizations and assessments
3. Manage questions and sections through the admin interface
4. Generate and download comprehensive reports

## 🏗 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin panel pages
│   ├── api/               # API routes
│   ├── assessment/        # Assessment pages
│   ├── organization/      # Organization portal
│   └── about/             # Public pages
├── components/            # React components
│   ├── forms/            # Form components
│   ├── providers/        # Context providers
│   └── ui/               # Reusable UI components
├── lib/                  # Utility functions and shared logic
│   └── utils/            # Helper utilities
├── types/                # TypeScript type definitions
├── hooks/                # Custom React hooks
└── generated/            # Generated files (Prisma, etc.)

prisma/
├── migrations/           # Database migrations
└── schema.prisma        # Database schema

scripts/
└── create-admin.ts      # Admin user creation script
```

## 📊 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with sample data
- `npm run create-admin` - Create an admin user

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL connection string | ✅ |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | ✅ |
| `NEXTAUTH_URL` | Base URL for NextAuth.js | ✅ |
| `NEXT_PUBLIC_APP_URL` | Public app URL | ✅ |
| `CSOGO_SSO_AUTH_URL` | WordPress SSO entry endpoint (ex: `https://csogo.org/sso/authenticate`) | For SSO |
| `CSOGO_SSO_SHARED_SECRET` | Shared HS256 secret used to verify WordPress SSO JWTs | For SSO |
| `CSOGO_PASSWORD_RESET_URL` | Server-side fallback URL for CSO Go password reset guidance | Optional |
| `NEXT_PUBLIC_CSOGO_PASSWORD_RESET_URL` | Client-side CSO Go reset link shown on login page | Optional |
| `EMAIL_HOST` | SMTP server host | ✅ |
| `EMAIL_PORT` | SMTP server port | ✅ |
| `EMAIL_SECURE` | Whether to use TLS/SSL (`true`/`false`) | ✅ |
| `EMAIL_USER` | SMTP username (email address) | ✅ |
| `EMAIL_PASS` | SMTP password | ✅ |
| `EMAIL_FROM_EMAIL` | Sender email address | ✅ |
| `EMAIL_FROM_NAME` | Sender display name | ✅ |

## 🗄 Database Schema

The application uses MySQL with the following main entities:
- **Organizations**: CSO organizations taking assessments
- **Assessments**: Individual assessment instances
- **Sections**: Assessment categories (e.g., Governance, Finance)
- **Questions**: Individual assessment questions
- **Responses**: Organization answers to questions
- **Admins**: Administrative users

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check if MySQL is running
brew services start mysql

# Verify database exists
mysql -u root -p
CREATE DATABASE cropper_cso_assessment;
```

**Migration Issues**
```bash
# Reset database (⚠️ This will delete all data)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

**Environment Variables Not Loading**
- Ensure `.env.local` is in the root directory
- Restart the development server after changing environment variables

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use TailwindCSS for styling
- Write descriptive commit messages
- Add appropriate error handling
- Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support

If you encounter any issues or have questions, please [open an issue](https://github.com/your-username/cropper-cso-self-assessment-tool/issues) on GitHub.
