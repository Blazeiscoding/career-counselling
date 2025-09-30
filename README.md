# Career Counseling AI Chat Application

A modern, full-stack AI-powered career counseling application built with Next.js 15, TypeScript, and PostgreSQL. This application provides personalized career guidance through an intuitive chat interface powered by Google's Generative AI (Gemini).

## Features

- **🤖 AI-Powered Career Guidance**: Get personalized career advice using Google Gemini AI
- **💬 Interactive Chat Interface**: Real-time chat with persistent conversation history
- **🔐 Secure Authentication**: User registration and login with NextAuth.js
- **📱 Responsive Design**: Modern UI built with Tailwind CSS and Radix UI components
- **⚡ Real-time Updates**: Built with tRPC for type-safe API routes
- **🗄️ Persistent Storage**: PostgreSQL database with Prisma ORM for data management

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Next.js API routes, tRPC
- **Database**: PostgreSQL, Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **AI Integration**: Google Generative AI (Gemini)
- **Development**: ESLint, TypeScript

## Prerequisites

Before running this application, make sure you have:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **PostgreSQL** database server
- **Google AI API Key** for Gemini integration

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd career-counselling
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/career_counselling"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Google AI (Gemini)
GOOGLE_AI_API_KEY="your-google-ai-api-key"
```

### 4. Set Up PostgreSQL Database

1. **Install PostgreSQL** if not already installed
2. **Create a database** named `career_counselling`
3. **Run Prisma migrations** to set up the database schema:

```bash
npx prisma migrate dev
```

This will create all necessary tables including:
- Users (authentication and profiles)
- Chat sessions (conversation threads)
- Messages (individual chat messages)
- Accounts & Sessions (NextAuth.js tables)

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Getting Started

1. **Register** a new account or **sign in** with existing credentials
2. **Start a conversation** by typing your career-related questions
3. **Get personalized advice** from the AI career counselor

### Example Queries

The AI can help with:
- Career path recommendations
- Resume reviews and improvements
- Interview preparation
- Industry transition guidance
- Skill development suggestions

## Project Structure

```
├── src/
│   ├── app/                 # Next.js 13+ app directory
│   │   ├── api/            # API routes (auth, etc.)
│   │   ├── auth/           # Authentication pages
│   │   ├── chat/           # Chat interface page
│   │   └── page.tsx        # Home page (redirects to auth/chat)
│   ├── components/         # Reusable UI components
│   │   ├── chat/          # Chat-specific components
│   │   └── ui/            # Base UI components
│   ├── server/            # Server-side utilities
│   │   ├── api/           # tRPC API routers
│   │   ├── auth.ts        # NextAuth configuration
│   │   └── db.ts          # Database connection
│   ├── trpc/              # tRPC client setup
│   └── utils/             # Utility functions
├── prisma/
│   └── schema.prisma      # Database schema
├── public/                # Static assets
└── package.json           # Dependencies and scripts
```

## API Routes

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User login

### Chat
- `GET /api/chat/sessions` - Get user's chat sessions
- `POST /api/chat/sessions` - Create new chat session
- `GET /api/chat/messages` - Get messages for a session
- `POST /api/chat/messages` - Send message and get AI response

## Development Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma migrate dev  # Run migrations in development
npx prisma generate  # Regenerate Prisma client
```

## Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Environment Variables for Production

Make sure to set these environment variables in your deployment platform:

- `DATABASE_URL` - Your production PostgreSQL connection string
- `NEXTAUTH_URL` - Your production domain
- `NEXTAUTH_SECRET` - A secure random string for JWT encryption
- `GOOGLE_AI_API_KEY` - Your Google AI API key

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Contact the development team

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
