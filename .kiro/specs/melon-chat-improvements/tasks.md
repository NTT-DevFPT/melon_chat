# Implementation Plan - Melon Chat Improvements

## Phase 1: Foundation & Code Quality

- [x] 1. Set up testing infrastructure and code quality tools





  - Install and configure Vitest for frontend testing
  - Install and configure React Testing Library
  - Install and configure fast-check for property-based testing
  - Add jqwik dependency to backend pom.xml
  - Configure TypeScript strict mode in tsconfig.json
  - Set up ESLint with recommended rules
  - Set up Prettier with project formatting rules
  - Add pre-commit hooks with Husky for linting
  - _Requirements: 2.1, 2.2, 8.3, 8.4_

- [x] 1.1 Write unit tests for existing utility functions


  - Test email validation utilities
  - Test date formatting utilities
  - Test string manipulation utilities
  - _Requirements: 2.3_

- [ ] 2. Implement error boundaries for React components
  - Create ErrorBoundary component with error logging
  - Create ErrorFallback component with retry functionality
  - Wrap main App component with ErrorBoundary
  - Wrap each major route with ErrorBoundary
  - _Requirements: 3.4_

- [ ] 2.1 Write property test for error boundary
  - **Property 4: Error boundaries catch errors**
  - **Validates: Requirements 3.4**
  - Test that ErrorBoundary catches thrown errors and renders fallback UI
  - _Requirements: 3.4_

- [ ] 3. Add skeleton loaders for loading states
  - Create SkeletonLoader component with animation
  - Create ConversationListSkeleton component
  - Create MessageListSkeleton component
  - Create ChatHeaderSkeleton component
  - Replace loading spinners with skeleton loaders
  - _Requirements: 3.2_

- [ ] 4. Refactor large components into smaller focused components
  - Extract ChatHeader from ChatPage
  - Extract ChatMessageList from ChatPage
  - Extract ChatInput from ChatPage
  - Extract ConversationList from Sidebar
  - Extract ConversationItem from ConversationList
  - Ensure each component is under 300 lines
  - _Requirements: 2.5_

- [ ] 4.1 Write unit tests for refactored components
  - Test ChatHeader component rendering and interactions
  - Test ChatInput component with various inputs
  - Test ConversationItem component display logic
  - _Requirements: 2.3_

## Phase 2: State Management & Performance

- [ ] 5. Replace Context API with Zustand for state management
  - Install Zustand dependency
  - Create chatStore for conversations and messages
  - Create notificationStore for notifications
  - Create typingStore for typing indicators
  - Create userStore for user state
  - Migrate AuthContext to Zustand authStore
  - Remove old Context providers
  - _Requirements: 1.1, 1.4_

- [ ] 5.1 Write unit tests for Zustand stores
  - Test chatStore actions and selectors
  - Test notificationStore state updates
  - Test typingStore debouncing logic
  - _Requirements: 2.3_

- [ ] 6. Implement React Query for API caching and optimistic updates
  - Install @tanstack/react-query dependency
  - Create QueryClient with configuration
  - Wrap App with QueryClientProvider
  - Create useMessages hook with React Query
  - Create useSendMessage hook with optimistic updates
  - Create useConversations hook with caching
  - Create useFriends hook with background refetch
  - Remove manual API calls from components
  - _Requirements: 1.1, 1.4_

- [ ] 6.1 Write unit tests for React Query hooks
  - Test useMessages hook data fetching
  - Test useSendMessage optimistic updates
  - Test cache invalidation logic
  - _Requirements: 2.3_

- [ ] 7. Remove polling and rely fully on WebSocket
  - Remove MESSAGE_POLL_INTERVAL_MS constant
  - Remove all setInterval polling logic
  - Enhance WebSocket service with reconnection
  - Implement exponential backoff for reconnection
  - Add heartbeat mechanism for connection health
  - Update message handling to use WebSocket only
  - _Requirements: 1.3_

- [ ] 7.1 Write example test for WebSocket without polling
  - **Example: No polling when WebSocket connected**
  - **Validates: Requirements 1.3**
  - Verify no polling intervals are active when WebSocket is connected
  - _Requirements: 1.3_

- [ ] 8. Implement code splitting and lazy loading
  - Convert route components to lazy imports
  - Add Suspense boundaries with loading fallbacks
  - Split large feature modules into separate chunks
  - Configure Vite for optimal code splitting
  - Verify bundle sizes are under 500KB gzipped
  - _Requirements: 1.5_

- [ ] 8.1 Write example test for bundle size
  - **Example: Bundle size under limit**
  - **Validates: Requirements 1.5**
  - Verify main bundle is under 500KB gzipped after build
  - _Requirements: 1.5_

- [ ] 9. Implement virtual scrolling for message lists
  - Install react-window dependency
  - Create VirtualizedMessageList component
  - Replace standard message list with virtualized version
  - Handle dynamic message heights
  - Implement scroll-to-bottom functionality
  - _Requirements: 1.1, 1.4_

- [ ] 9.1 Write unit tests for virtual scrolling
  - Test VirtualizedMessageList rendering
  - Test scroll-to-bottom behavior
  - Test dynamic height calculations
  - _Requirements: 2.3_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Real-time Features

- [ ] 11. Implement typing indicators
  - Create TypingIndicator component
  - Add typing event to WebSocket service
  - Implement debounced typing broadcast (3 second timeout)
  - Subscribe to typing events in conversations
  - Display typing indicators in chat UI
  - _Requirements: 4.1, 4.2_

- [ ] 11.1 Write example test for typing indicator broadcast
  - **Example: Typing indicator sent on input**
  - **Validates: Requirements 4.1**
  - Verify typing event is sent when user types
  - _Requirements: 4.1_

- [ ] 11.2 Write example test for typing indicator removal
  - **Example: Typing indicator removed after timeout**
  - **Validates: Requirements 4.2**
  - Verify typing indicator is removed after 3 seconds of inactivity
  - _Requirements: 4.2_

- [ ] 12. Implement message reactions
  - Create MessageReaction entity in backend
  - Create MessageReaction repository
  - Add reaction endpoints to MessageController
  - Create ReactionPicker component
  - Create ReactionDisplay component
  - Implement add/remove reaction functionality
  - Update message model to include reactions
  - _Requirements: 5.2, 5.3_

- [ ] 12.1 Write property test for reaction persistence
  - **Property 2: Reaction persistence**
  - **Validates: Requirements 5.3**
  - Test that added reactions are persisted and retrievable
  - _Requirements: 5.3_

- [ ] 12.2 Write example test for reaction UI
  - **Example: Reaction picker displayed on click**
  - **Validates: Requirements 5.2**
  - Verify reaction options are shown when message is clicked
  - _Requirements: 5.2_

- [ ] 12.3 Write unit tests for reaction components
  - Test ReactionPicker component interactions
  - Test ReactionDisplay component rendering
  - Test reaction count updates
  - _Requirements: 2.3_

- [ ] 13. Implement message editing
  - Add isEdited and editedAt fields to Message entity
  - Create edit message endpoint in backend
  - Add edit functionality to MessageBubble component
  - Implement 15-minute edit time limit
  - Display "edited" indicator on edited messages
  - _Requirements: 5.4_

- [ ] 13.1 Write property test for message edit marking
  - **Property 3: Message edit marks as edited**
  - **Validates: Requirements 5.4**
  - Test that edited messages have isEdited=true and editedAt timestamp
  - _Requirements: 5.4_

- [ ] 13.2 Write unit tests for message editing
  - Test edit UI component
  - Test edit time limit enforcement
  - Test edited indicator display
  - _Requirements: 2.3_

- [ ] 14. Implement message deletion
  - Create delete message endpoint in backend
  - Add delete functionality to MessageBubble component
  - Replace content with deletion placeholder
  - Prevent retrieval of deleted content
  - _Requirements: 5.5_

- [ ] 14.1 Write property test for message deletion
  - **Property 4: Message deletion removes content**
  - **Validates: Requirements 5.5**
  - Test that deleted messages have content replaced with placeholder
  - _Requirements: 5.5_

- [ ] 14.2 Write unit tests for message deletion
  - Test delete UI component
  - Test deletion placeholder display
  - Test permission checks for deletion
  - _Requirements: 2.3_

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Notification System

- [ ] 16. Create notification data model and backend
  - Create Notification entity with type enum
  - Create NotificationRepository
  - Create NotificationService with CRUD operations
  - Add notification endpoints to controller
  - Create database indexes for notifications
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 16.1 Write unit tests for notification service
  - Test notification creation
  - Test notification retrieval by user
  - Test mark as read functionality
  - _Requirements: 2.3_

- [ ] 17. Implement in-app notification system
  - Create NotificationBanner component
  - Create NotificationBadge component
  - Create useNotifications hook
  - Subscribe to notification events via WebSocket
  - Display notification banners for new messages
  - Display badge counts on navigation items
  - _Requirements: 6.1, 6.3_

- [ ] 17.1 Write example test for in-app notifications
  - **Example: Notification banner shown for inactive conversation**
  - **Validates: Requirements 6.1**
  - Verify notification banner appears for messages in inactive conversations
  - _Requirements: 6.1_

- [ ] 17.2 Write example test for notification badges
  - **Example: Badge displayed for friend requests**
  - **Validates: Requirements 6.3**
  - Verify badge appears on friends icon when request received
  - _Requirements: 6.3_

- [ ] 18. Implement browser notifications
  - Request notification permissions on login
  - Create notification utility functions
  - Send browser notifications for new messages
  - Handle notification click to navigate to conversation
  - Respect user notification preferences
  - _Requirements: 6.2, 6.4_

- [ ] 18.1 Write example test for browser notifications
  - **Example: Browser notification sent when permitted**
  - **Validates: Requirements 6.2**
  - Verify browser notification is sent when permissions granted
  - _Requirements: 6.2_

- [ ] 18.2 Write example test for notification navigation
  - **Example: Clicking notification navigates to conversation**
  - **Validates: Requirements 6.4**
  - Verify clicking notification navigates to relevant conversation
  - _Requirements: 6.4_

- [ ] 19. Implement unread badge clearing
  - Update conversation read status on view
  - Clear unread count in UI immediately
  - Sync read status with backend
  - _Requirements: 6.5_

- [ ] 19.1 Write property test for unread badge clearing
  - **Property 5: Unread badge clears on read**
  - **Validates: Requirements 6.5**
  - Test that marking conversation as read sets unread count to zero
  - _Requirements: 6.5_

- [ ] 19.2 Write unit tests for unread badge logic
  - Test badge count calculations
  - Test badge clearing on conversation view
  - Test badge updates on new messages
  - _Requirements: 2.3_

## Phase 5: Message Search & File Upload

- [ ] 20. Implement message search functionality
  - Add full-text search index to messages table
  - Create search endpoint in backend
  - Create SearchBar component
  - Create SearchResults component
  - Implement search with highlighting
  - Add search to chat interface
  - _Requirements: 5.1_

- [ ] 20.1 Write property test for search results
  - **Property 1: Search returns only matching messages**
  - **Validates: Requirements 5.1**
  - Test that all search results contain the query string
  - _Requirements: 5.1_

- [ ] 20.2 Write unit tests for search components
  - Test SearchBar component input handling
  - Test SearchResults component rendering
  - Test search result highlighting
  - _Requirements: 2.3_

- [ ] 21. Enhance file upload with progress and validation
  - Create FileValidationService in backend
  - Implement file type validation
  - Implement file size validation (10MB limit)
  - Add progress bar to file upload UI
  - Add thumbnail preview for images
  - Add error handling with retry option
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 21.1 Write property test for file size validation
  - **Property 6: File size validation**
  - **Validates: Requirements 7.4**
  - Test that files over 10MB are rejected
  - _Requirements: 7.4_

- [ ] 21.2 Write example test for upload progress
  - **Example: Progress bar displayed during upload**
  - **Validates: Requirements 7.1**
  - Verify progress bar is shown during file upload
  - _Requirements: 7.1_

- [ ] 21.3 Write example test for image preview
  - **Example: Thumbnail preview shown for images**
  - **Validates: Requirements 7.2**
  - Verify thumbnail preview is displayed before sending image
  - _Requirements: 7.2_

- [ ] 21.4 Write example test for upload error handling
  - **Example: Error message and retry on upload failure**
  - **Validates: Requirements 7.3**
  - Verify error message and retry option on upload failure
  - _Requirements: 7.3_

- [ ] 22. Implement multi-file upload
  - Support multiple file selection
  - Upload files sequentially
  - Display individual progress for each file
  - Handle partial failures gracefully
  - _Requirements: 7.5_

- [ ] 22.1 Write example test for multi-file upload
  - **Example: Sequential upload with individual progress**
  - **Validates: Requirements 7.5**
  - Verify multiple files are uploaded sequentially with progress indicators
  - _Requirements: 7.5_

- [ ] 22.2 Write unit tests for multi-file upload
  - Test file queue management
  - Test individual progress tracking
  - Test partial failure handling
  - _Requirements: 2.3_

- [ ] 23. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Security & Performance

- [ ] 24. Implement rate limiting
  - Create RateLimitingFilter in backend
  - Configure rate limit of 100 requests per minute per user
  - Add rate limit headers to responses
  - Handle rate limit exceeded errors in frontend
  - _Requirements: 11.4_

- [ ] 24.1 Write property test for rate limiting
  - **Property 12: Rate limiting enforcement**
  - **Validates: Requirements 11.4**
  - Test that requests exceeding 100/minute are rejected with 429 status
  - _Requirements: 11.4_

- [ ] 24.2 Write integration tests for rate limiting
  - Test rate limit enforcement across multiple requests
  - Test rate limit reset after time window
  - Test rate limit headers in responses
  - _Requirements: 2.3_

- [ ] 25. Enhance JWT token management
  - Configure access token expiration to 1 hour
  - Configure refresh token expiration to 7 days
  - Implement token refresh endpoint
  - Add automatic token refresh in frontend
  - _Requirements: 11.2_

- [ ] 25.1 Write property test for token expiration
  - **Property 10: JWT token expiration**
  - **Validates: Requirements 11.2**
  - Test that access tokens expire in 1 hour and refresh tokens in 7 days
  - _Requirements: 11.2_

- [ ] 25.2 Write unit tests for token management
  - Test token generation with correct expiration
  - Test token refresh logic
  - Test expired token handling
  - _Requirements: 2.3_

- [ ] 26. Implement file upload security
  - Validate file types against whitelist
  - Verify file content matches extension
  - Sanitize file names
  - Scan for malicious content (basic checks)
  - _Requirements: 11.3_

- [ ] 26.1 Write property test for file type validation
  - **Property 11: File type validation**
  - **Validates: Requirements 11.3**
  - Test that only allowed file types are accepted
  - _Requirements: 11.3_

- [ ] 26.2 Write unit tests for file security
  - Test file type whitelist enforcement
  - Test file name sanitization
  - Test content type verification
  - _Requirements: 2.3_

- [ ] 27. Implement password hashing with BCrypt cost factor 12
  - Update BCryptPasswordEncoder configuration
  - Set cost factor to 12
  - Verify existing passwords still work
  - _Requirements: 11.1_

- [ ] 27.1 Write example test for password hashing
  - **Example: BCrypt cost factor 12**
  - **Validates: Requirements 11.1**
  - Verify passwords are hashed with BCrypt cost factor 12
  - _Requirements: 11.1_

- [ ] 28. Implement HTTPS enforcement for production
  - Configure HTTPS redirect in Spring Boot
  - Add HSTS headers
  - Update frontend API client for HTTPS
  - _Requirements: 11.5_

- [ ] 28.1 Write example test for HTTPS enforcement
  - **Example: HTTPS enforced in production**
  - **Validates: Requirements 11.5**
  - Verify HTTP requests are redirected to HTTPS in production
  - _Requirements: 11.5_

- [ ] 29. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Database Optimization

- [ ] 30. Implement message pagination
  - Add pagination to message queries
  - Set default page size to 50 messages
  - Implement infinite scroll in frontend
  - Add "load more" functionality
  - _Requirements: 12.1_

- [ ] 30.1 Write property test for pagination page size
  - **Property 13: Pagination page size**
  - **Validates: Requirements 12.1**
  - Test that queries without explicit page size return at most 50 messages
  - _Requirements: 12.1_

- [ ] 30.2 Write unit tests for pagination
  - Test pagination logic in service layer
  - Test infinite scroll component
  - Test load more functionality
  - _Requirements: 2.3_

- [ ] 31. Add database indexes for performance
  - Create index on messages(conversation_id, created_at)
  - Create index on messages(sender_id)
  - Create index on conversations(updated_at)
  - Create index on room_members(user_id)
  - Create index on notifications(user_id, is_read, created_at)
  - Create unique index on message_reactions(message_id, user_id, emoji)
  - _Requirements: 12.2_

- [ ] 31.1 Write example test for database indexes
  - **Example: Indexes exist on frequently queried fields**
  - **Validates: Requirements 12.2**
  - Verify required indexes exist in database schema
  - _Requirements: 12.2_

- [ ] 32. Implement full-text search indexes
  - Add full-text search index to messages.content
  - Update search queries to use full-text search
  - Test search performance with large datasets
  - _Requirements: 12.3_

- [ ] 32.1 Write example test for full-text search
  - **Example: Full-text search index used**
  - **Validates: Requirements 12.3**
  - Verify search queries use full-text search index
  - _Requirements: 12.3_

- [ ] 33. Implement data retention policy
  - Create archive_messages table for old messages
  - Create scheduled job to archive messages older than 1 year
  - Update queries to check both active and archived messages
  - _Requirements: 12.4_

- [ ] 33.1 Write example test for data archival
  - **Example: Old messages moved to archive**
  - **Validates: Requirements 12.4**
  - Verify messages older than 1 year are moved to archive table
  - _Requirements: 12.4_

- [ ] 34. Implement slow query logging
  - Configure query logging for queries over 100ms
  - Add query execution time to logs
  - Create monitoring dashboard for slow queries
  - _Requirements: 12.5_

- [ ] 34.1 Write property test for slow query logging
  - **Property 14: Slow query logging**
  - **Validates: Requirements 12.5**
  - Test that queries over 100ms are logged with execution time
  - _Requirements: 12.5_

## Phase 8: Logging & Monitoring

- [ ] 35. Implement comprehensive error logging
  - Configure structured logging format
  - Add error details, stack traces, and context to logs
  - Implement log rotation and retention
  - _Requirements: 10.1_

- [ ] 35.1 Write property test for error logging
  - **Property 7: Error logging completeness**
  - **Validates: Requirements 10.1**
  - Test that error logs contain message, stack trace, and context
  - _Requirements: 10.1_

- [ ] 36. Implement request logging
  - Create request logging filter
  - Log HTTP method, path, status code, and duration
  - Add correlation IDs for request tracing
  - _Requirements: 10.2_

- [ ] 36.1 Write property test for request logging
  - **Property 8: Request logging completeness**
  - **Validates: Requirements 10.2**
  - Test that request logs contain method, path, status, and duration
  - _Requirements: 10.2_

- [ ] 37. Implement WebSocket connection logging
  - Log connection establishment events
  - Log disconnection events
  - Include user information in connection logs
  - _Requirements: 10.3_

- [ ] 37.1 Write property test for WebSocket logging
  - **Property 9: WebSocket connection logging**
  - **Validates: Requirements 10.3**
  - Test that connection events are logged with user information
  - _Requirements: 10.3_

- [ ] 38. Create health check endpoints
  - Implement /health endpoint with system status
  - Implement /health/metrics endpoint with metrics
  - Check database connectivity in health check
  - Include memory and thread metrics
  - _Requirements: 10.4_

- [ ] 38.1 Write example test for health check
  - **Example: Health check returns status and metrics**
  - **Validates: Requirements 10.4**
  - Verify health check endpoint returns correct status and metrics
  - _Requirements: 10.4_

- [ ] 39. Implement alerting for critical errors
  - Configure error threshold for alerts
  - Integrate with monitoring service (e.g., Sentry)
  - Set up email/Slack notifications for critical errors
  - _Requirements: 10.5_

- [ ] 39.1 Write example test for alerting
  - **Example: Alerts sent for critical errors**
  - **Validates: Requirements 10.5**
  - Verify alerts are sent when critical errors occur
  - _Requirements: 10.5_

- [ ] 40. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: CI/CD & Infrastructure

- [ ] 41. Set up GitHub Actions CI pipeline
  - Create workflow file for CI
  - Add frontend test job
  - Add backend test job
  - Add linting and formatting checks
  - Configure test coverage reporting
  - _Requirements: 9.1_

- [ ] 41.1 Write example test for CI pipeline
  - **Example: Tests run automatically on push**
  - **Validates: Requirements 9.1**
  - Verify CI pipeline runs tests on code push
  - _Requirements: 9.1_

- [ ] 42. Set up Docker image building
  - Create multi-stage Dockerfile for frontend
  - Create multi-stage Dockerfile for backend
  - Configure Docker build in CI pipeline
  - Build images on successful tests
  - _Requirements: 9.2_

- [ ] 42.1 Write example test for Docker builds
  - **Example: Docker images built on test pass**
  - **Validates: Requirements 9.2**
  - Verify Docker images are built when tests pass
  - _Requirements: 9.2_

- [ ] 43. Implement Docker image tagging
  - Tag images with version numbers
  - Tag images with commit SHA
  - Tag images with "latest" for main branch
  - Push tagged images to registry
  - _Requirements: 9.3_

- [ ] 43.1 Write example test for image tagging
  - **Example: Images tagged with version and SHA**
  - **Validates: Requirements 9.3**
  - Verify Docker images are tagged correctly
  - _Requirements: 9.3_

- [ ] 44. Set up staging deployment
  - Configure staging environment
  - Create deployment workflow for staging
  - Deploy to staging on main branch updates
  - Add smoke tests for staging validation
  - _Requirements: 9.4_

- [ ] 44.1 Write example test for staging deployment
  - **Example: Staging deployed before production**
  - **Validates: Requirements 9.4**
  - Verify deployment goes to staging first
  - _Requirements: 9.4_

- [ ] 45. Optimize Docker images
  - Use multi-stage builds to reduce image size
  - Remove unnecessary dependencies
  - Use Alpine base images where possible
  - Verify final image sizes are optimized
  - _Requirements: 1.1_

- [ ] 45.1 Write unit tests for Docker configuration
  - Test Dockerfile syntax and structure
  - Verify required dependencies are included
  - Test image build process
  - _Requirements: 2.3_

## Phase 10: Final Polish & Documentation

- [ ] 46. Implement responsive design improvements
  - Test and fix layout on mobile devices (320px+)
  - Optimize touch interactions for mobile
  - Add mobile-specific navigation
  - Test on various screen sizes
  - _Requirements: 3.1_

- [ ] 47. Add loading state improvements
  - Replace all loading spinners with skeleton loaders
  - Add smooth transitions between loading and loaded states
  - Implement progressive loading for images
  - _Requirements: 3.2_

- [ ] 48. Enhance error messages
  - Review all error messages for user-friendliness
  - Add recovery options to error states
  - Implement contextual help for common errors
  - _Requirements: 3.3_

- [ ] 49. Performance testing and optimization
  - Run Lighthouse audits
  - Optimize bundle sizes
  - Optimize image loading
  - Test WebSocket performance under load
  - Verify all performance requirements are met
  - _Requirements: 1.1, 1.2, 1.4_

- [ ] 50. Security audit
  - Review all authentication flows
  - Test rate limiting under load
  - Verify file upload security
  - Test for common vulnerabilities (XSS, CSRF, SQL injection)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 51. Create comprehensive documentation
  - Document API endpoints
  - Document component architecture
  - Create developer setup guide
  - Create deployment guide
  - Document testing strategy
  - _Requirements: 2.3_

- [ ] 52. Final checkpoint - Ensure all tests pass
  - Run full test suite
  - Verify test coverage meets 70% target
  - Fix any remaining test failures
  - Ensure all property-based tests pass with 100+ iterations
  - _Requirements: 2.3, 8.5_

## Summary

This implementation plan provides a structured approach to improving the Melon Chat application over approximately 12 weeks. The plan is organized into 10 phases, each building upon the previous one:

1. **Foundation & Code Quality** - Set up testing infrastructure and refactor large components
2. **State Management & Performance** - Implement Zustand, React Query, and remove polling
3. **Real-time Features** - Add typing indicators, reactions, editing, and deletion
4. **Notification System** - Implement in-app and browser notifications
5. **Message Search & File Upload** - Add search functionality and enhance file uploads
6. **Security & Performance** - Implement rate limiting, token management, and file security
7. **Database Optimization** - Add pagination, indexes, and query optimization
8. **Logging & Monitoring** - Implement comprehensive logging and health checks
9. **CI/CD & Infrastructure** - Set up automated testing and deployment
10. **Final Polish & Documentation** - Responsive design, performance testing, and documentation

Each phase includes checkpoints to ensure tests pass before proceeding. Optional tasks (marked with *) focus on comprehensive testing and can be skipped for faster MVP delivery. Property-based tests are included throughout to verify correctness properties from the design document.
