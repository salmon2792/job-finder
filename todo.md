# Job Finder - Project TODO

## Phase 1: Database Schema & Design
- [x] Design database schema with jobs, skills, and bookmarks tables
- [x] Create Drizzle schema file with proper relationships
- [x] Generate and apply database migrations

## Phase 2: Backend Implementation
- [x] Implement database query helpers for jobs, skills, and bookmarks
- [x] Create tRPC procedures for jobs (list, get, create, update, delete)
- [x] Create tRPC procedures for skills (list, create, update, delete)
- [x] Create tRPC procedures for bookmarks (list, add, remove)
- [x] Implement owner-only access control on all procedures
- [x] Add automatic 1-3 years experience filtering for job queries

## Phase 3: Frontend Layout & Navigation
- [x] Design and implement dashboard layout with sidebar
- [x] Create sidebar navigation with Jobs, Skills, and Bookmarks sections
- [x] Set up global theme and design tokens for elegant, polished look
- [x] Implement responsive mobile-first design

## Phase 4: Job Feed Page
- [x] Create job feed page with card-based UI
- [x] Display job cards with title, company, location, and experience level
- [x] Implement automatic 1-3 years experience filtering
- [x] Add loading and empty states
- [x] Integrate with tRPC job queries
- [x] Implement bookmark toggle functionality

## Phase 5: Skills Management
- [x] Create skills management page
- [x] Implement add skill form
- [x] Implement edit skill functionality
- [x] Implement delete skill functionality
- [x] Add loading and empty states

## Phase 6: Bookmarks & Job Details
- [x] Create bookmarks listing page with saved jobs
- [x] Display full job details and information
- [x] Implement bookmark toggle functionality
- [x] Add bookmark management (remove bookmarks)
- [x] Implement notes feature for bookmarked jobs

## Phase 7: Testing
- [x] Write vitest tests for all tRPC procedures
- [x] Test owner-only access control
- [x] Test experience filtering logic
- [x] Test CRUD operations for jobs, skills, and bookmarks

## Phase 8: Polish & Delivery
- [x] Review design consistency and polish
- [x] Test responsive design on mobile
- [x] Verify all features work end-to-end
- [x] Create checkpoint and deliver project
