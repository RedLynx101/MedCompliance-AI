# MedCompliance AI

## Overview

MedCompliance AI is a comprehensive medical documentation and compliance management system that assists healthcare providers with real-time encounter documentation, SOAP notes generation, and automated compliance checking. The application combines live patient encounter recording with AI-powered analysis to ensure medical documentation meets regulatory standards while reducing administrative burden on healthcare professionals.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built using React with TypeScript, utilizing Vite as the build tool and development server. The application follows a component-based architecture with:

- **UI Framework**: Custom component library built on Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with CSS variables for theming and a neutral color palette
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation through @hookform/resolvers

### Backend Architecture
The backend uses Express.js with TypeScript in ESM format, providing:

- **API Design**: RESTful API endpoints following conventional HTTP methods
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development
- **AI Integration**: OpenAI GPT-5 integration for SOAP notes generation and compliance checking
- **Session Management**: Express sessions with PostgreSQL session store

### Data Storage Solutions
The application uses a multi-layered data approach:

- **Primary Database**: PostgreSQL with Neon serverless driver for production data
- **ORM**: Drizzle ORM with type-safe queries and schema management
- **Development Storage**: In-memory storage implementation with seeded data for development/testing
- **Schema Management**: Centralized schema definitions in shared directory with Zod validation

### Database Schema Design
Core entities include:
- **Patients**: Basic patient demographics and medical record numbers
- **Encounters**: Medical visits with appointment details, status tracking, and compliance metrics
- **Compliance Flags**: Automated compliance alerts with severity levels and resolution tracking
- **Transcript Segments**: Real-time conversation recording with speaker identification
- **Analytics**: Performance metrics and compliance tracking data

### Authentication and Authorization
The application implements session-based authentication:
- Express sessions with secure cookie configuration
- PostgreSQL session storage using connect-pg-simple
- Role-based access patterns for different user types

### AI and Machine Learning Integration
OpenAI integration provides:
- **SOAP Notes Generation**: Automated medical documentation from encounter transcripts
- **Compliance Checking**: Real-time analysis of documentation for regulatory compliance
- **Risk Assessment**: Automated scoring and flagging of potential compliance issues
- **Code Suggestions**: ICD-10 and CPT code recommendations based on encounter content

### Real-time Features
The system supports live encounter documentation:
- Real-time transcript capture and processing
- Live compliance monitoring during patient encounters
- Immediate feedback and suggestions to healthcare providers
- Recording duration tracking and management

### Development and Build Process
- **Development**: tsx for TypeScript execution in development with hot reloading
- **Build**: Vite for frontend bundling, esbuild for backend compilation
- **Database Management**: Drizzle Kit for schema migrations and database operations
- **Type Safety**: Comprehensive TypeScript coverage across frontend, backend, and shared code

## External Dependencies

### Database and Storage
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and schema management
- **connect-pg-simple**: PostgreSQL session store for Express

### AI and Machine Learning
- **OpenAI API**: GPT-5 model for natural language processing, SOAP notes generation, and compliance analysis

### Frontend Dependencies
- **React Ecosystem**: React 18 with TypeScript support
- **TanStack Query**: Server state management and caching
- **Radix UI**: Accessible component primitives for complex UI elements
- **shadcn/ui**: Pre-built component library with consistent styling
- **Tailwind CSS**: Utility-first CSS framework with custom design system

### Development Tools
- **Vite**: Fast build tool and development server with HMR
- **Replit Integration**: Development environment plugins for seamless cloud development
- **TypeScript**: Full type safety across the entire application stack

### Validation and Forms
- **Zod**: Schema validation library integrated with database models and forms
- **React Hook Form**: Form management with validation integration
- **drizzle-zod**: Automatic Zod schema generation from Drizzle models