# Design Document - Melon Chat Improvements

## Overview

This design document outlines the technical approach for improving the Melon Chat application across performance, code quality, UI/UX, features, and infrastructure. The improvements are designed to be implemented incrementally while maintaining backward compatibility and system stability.

The design follows a layered architecture approach:
- **Presentation Layer**: React components with improved structure and performance
- **Business Logic Layer**: Services and hooks for state management and API communication
- **Data Layer**: Optimized API endpoints and database queries
- **Infrastructure Layer**: CI/CD, monitoring, and deployment automation

## Architecture

### Current Architecture Analysis

**Frontend (React + Vite):**
- Single-page application with React Router
- WebSocket integration for real-time messaging
- Polling fallback for message updates (1.2s interval)
- Context API for authentication state
- Direct API calls from components

**Backend (Spring Boot):**
- RESTful API with JWT authentication
- WebSocket support via STOMP
- JPA/Hibernate for database access
- H2 (dev) / PostgreSQL (prod)
- Service layer pattern

**Issues Identified:**
1. ChatPage.tsx is monolithic (>1000 lines)
2. Excessive polling despite WebSocket availability
3. No caching strategy
4. Missing error boundaries
5. No code splitting
6. Test infrastructure incomplete

### Proposed Architecture Improvements

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │    Hooks     │      │
│  │  (Routes)    │  │  (Atomic)    │  │  (Logic)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│  ┌──────────────────────────────────────────────────┐      │
│  │         State Management (Zustand/Jotai)         │      │
│  └──────────────────────────────────────────────────┘      │
│         │                                                    │
│  ┌──────────────────────────────────────────────────┐      │
│  │      API Layer (React Query + Axios)             │      │
│  └──────────────────────────────────────────────────┘      │
│         │                                                    │
│  ┌──────────────────────────────────────────────────┐      │
│  │      WebSocket Service (STOMP Client)            │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          │
                    HTTP/WebSocket
                          │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Spring Boot)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │  │   Services   │  │ Repositories │      │
│  │  (REST/WS)   │  │  (Business)  │  │    (JPA)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│  ┌──────────────────────────────────────────────────┐      │
│  │         Security (JWT + Spring Security)         │      │
│  └──────────────────────────────────────────────────┘      │
│         │                                                    │
│  ┌──────────────────────────────────────────────────┐      │
│  │      Caching Layer (Redis - Optional)            │      │
│  └──────────────────────────────────────────────────┘      │
│         │                                                    │
│  ┌──────────────────────────────────────────────────┐      │
│  │         Database (PostgreSQL + Indexes)          │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Component Refactoring

**Current Issue:** ChatPage.tsx is >1000 lines with multiple responsibilities

**Solution:** Break into focused components following Atomic Design

```typescript
// New component structure
apps/web/
├── pages/
│   └── ChatPage.tsx (orchestrator only, <200 lines)
├── features/
│   ├── chat/
│   │   ├── components/
│   │   │   ├── ChatHeader.tsx
│   │   │   ├── ChatMessageList.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── MessageReactions.tsx
│   │   ├── hooks/
│   │   │   ├── useMessages.ts
│   │   │   ├── useTypingIndicator.ts
│   │   │   └── useMessageReactions.ts
│   │   └── types.ts
│   ├── conversations/
│   │   ├── components/
│   │   │   ├── ConversationList.tsx
│   │   │   └── ConversationItem.tsx
│   │   └── hooks/
│   │       └── useConversations.ts
│   └── notifications/
│       ├── components/
│       │   ├── NotificationBanner.tsx
│       │   └── NotificationBadge.tsx
│       └── hooks/
│           └── useNotifications.ts
└── shared/
    ├── components/
    │   ├── ErrorBoundary.tsx
    │   ├── SkeletonLoader.tsx
    │   └── LazyImage.tsx
    └── hooks/
        ├── useWebSocket.ts
        └── useInfiniteScroll.ts
```

### State Management Strategy

**Replace Context API with Zustand for better performance:**

```typescript
// stores/chatStore.ts
interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  
  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  
  // Selectors
  getActiveConversation: () => Conversation | undefined;
  getMessages: (conversationId: string) => Message[];
}

// stores/notificationStore.ts
interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  clearAll: () => void;
}

// stores/typingStore.ts
interface TypingStore {
  typingUsers: Record<string, string[]>; // conversationId -> userIds[]
  
  setTyping: (conversationId: string, userId: string) => void;
  removeTyping: (conversationId: string, userId: string) => void;
}
```

### API Layer with React Query

**Implement React Query for caching and optimistic updates:**

```typescript
// hooks/api/useMessages.ts
export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessages(conversationId),
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (message: SendMessageRequest) => 
      client.post(`/chats/${conversationId}/messages`, message),
    onMutate: async (newMessage) => {
      // Optimistic update
      await queryClient.cancelQueries(['messages', conversationId]);
      const previousMessages = queryClient.getQueryData(['messages', conversationId]);
      
      queryClient.setQueryData(['messages', conversationId], (old: Message[]) => [
        ...old,
        { ...newMessage, id: 'temp-' + Date.now(), status: 'sending' }
      ]);
      
      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      // Rollback on error
      queryClient.setQueryData(['messages', conversationId], context.previousMessages);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['messages', conversationId]);
    },
  });
}
```

### WebSocket Service Enhancement

**Remove polling, rely fully on WebSocket with reconnection:**

```typescript
// services/WebSocketService.ts
class WebSocketService {
  private client: Client | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  connect(token: string, onConnect: () => void) {
    this.client = new Client({
      brokerURL: `ws://localhost:8080/ws`,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.reconnectAttempts = 0;
        onConnect();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this.handleReconnect();
      },
      onWebSocketClose: () => {
        this.handleReconnect();
      }
    });
    
    this.client.activate();
  }
  
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      setTimeout(() => this.client?.activate(), delay);
    }
  }
  
  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    return this.client?.subscribe(`/topic/chat/${conversationId}`, (frame) => {
      const message = JSON.parse(frame.body);
      callback(message);
    });
  }
  
  subscribeToTyping(conversationId: string, callback: (event: TypingEvent) => void) {
    return this.client?.subscribe(`/topic/typing/${conversationId}`, (frame) => {
      const event = JSON.parse(frame.body);
      callback(event);
    });
  }
  
  sendTypingIndicator(conversationId: string, isTyping: boolean) {
    this.client?.publish({
      destination: `/app/typing/${conversationId}`,
      body: JSON.stringify({ isTyping })
    });
  }
}
```

## Data Models

### Message Reactions

```typescript
// Frontend
interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string; // '👍', '❤️', '😂', '😢', '😠'
  createdAt: string;
}

interface Message {
  // ... existing fields
  reactions: MessageReaction[];
  reactionCounts: Record<string, number>; // emoji -> count
  isEdited: boolean;
  editedAt?: string;
}
```

```java
// Backend
@Entity
@Table(name = "message_reactions")
public class MessageReaction extends BaseEntity {
    @ManyToOne
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false, length = 10)
    private String emoji;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
```

### Typing Indicators

```typescript
// Frontend
interface TypingEvent {
  conversationId: string;
  userId: string;
  username: string;
  isTyping: boolean;
  timestamp: number;
}
```

```java
// Backend - No persistence needed, WebSocket only
public class TypingEvent {
    private String conversationId;
    private String userId;
    private String username;
    private boolean isTyping;
    private long timestamp;
}
```

### Notifications

```typescript
// Frontend
interface Notification {
  id: string;
  type: 'message' | 'friend_request' | 'mention' | 'reaction';
  title: string;
  body: string;
  conversationId?: string;
  senderId?: string;
  isRead: boolean;
  createdAt: string;
}
```

```java
// Backend
@Entity
@Table(name = "notifications")
public class Notification extends BaseEntity {
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;
    
    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false, length = 500)
    private String body;
    
    @Column(name = "conversation_id")
    private UUID conversationId;
    
    @Column(name = "sender_id")
    private UUID senderId;
    
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
```

### Database Indexes

```sql
-- Messages table indexes
CREATE INDEX idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

CREATE INDEX idx_messages_sender 
ON messages(sender_id);

-- Full-text search index for message content
CREATE INDEX idx_messages_content_fulltext 
ON messages USING GIN(to_tsvector('english', content));

-- Conversations table indexes
CREATE INDEX idx_conversations_updated 
ON chat_rooms(updated_at DESC);

CREATE INDEX idx_room_members_user 
ON room_members(user_id);

-- Notifications table indexes
CREATE INDEX idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC);

-- Message reactions table indexes
CREATE INDEX idx_reactions_message 
ON message_reactions(message_id);

CREATE UNIQUE INDEX idx_reactions_unique 
ON message_reactions(message_id, user_id, emoji);
```

## Correctn
ess Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Search returns only matching messages
*For any* search query and conversation, all returned messages should contain the search query as a substring (case-insensitive)
**Validates: Requirements 5.1**

### Property 2: Reaction persistence
*For any* message and user, when a reaction is added, querying the message should return the reaction in the reactions list
**Validates: Requirements 5.3**

### Property 3: Message edit marks as edited
*For any* message edited by its owner, the message should have isEdited set to true and editedAt timestamp populated
**Validates: Requirements 5.4**

### Property 4: Message deletion removes content
*For any* message deleted by its owner, the message content should be replaced with a deletion placeholder and original content should not be retrievable
**Validates: Requirements 5.5**

### Property 5: Unread badge clears on read
*For any* conversation marked as read, the unread count should be set to zero
**Validates: Requirements 6.5**

### Property 6: File size validation
*For any* file upload, if the file size exceeds 10MB, the upload should be rejected with an appropriate error
**Validates: Requirements 7.4**

### Property 7: Error logging completeness
*For any* error that occurs in the backend, the log entry should contain error message, stack trace, and contextual information (user ID, request path, timestamp)
**Validates: Requirements 10.1**

### Property 8: Request logging completeness
*For any* API request, the log entry should contain HTTP method, path, status code, and duration
**Validates: Requirements 10.2**

### Property 9: WebSocket connection logging
*For any* WebSocket connection or disconnection event, the log entry should contain event type, user ID, and timestamp
**Validates: Requirements 10.3**

### Property 10: JWT token expiration
*For any* issued JWT access token, the expiration time should be exactly 1 hour from issuance, and for refresh tokens, exactly 7 days
**Validates: Requirements 11.2**

### Property 11: File type validation
*For any* file upload, the system should validate that the file type is in the allowed list before processing
**Validates: Requirements 11.3**

### Property 12: Rate limiting enforcement
*For any* user making API requests, if they exceed 100 requests in a 1-minute window, subsequent requests should be rejected with a 429 status code
**Validates: Requirements 11.4**

### Property 13: Pagination page size
*For any* message query without explicit page size, the returned result should contain at most 50 messages
**Validates: Requirements 12.1**

### Property 14: Slow query logging
*For any* database query that takes longer than 100ms, a log entry should be created with the query details and execution time
**Validates: Requirements 12.5**

## Error Handling

### Frontend Error Handling Strategy

**Error Boundaries:**
```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to monitoring service
    logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          resetError={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
```

**API Error Handling:**
```typescript
// utils/errorHandler.ts
export function handleApiError(error: AxiosError) {
  if (error.response) {
    // Server responded with error status
    switch (error.response.status) {
      case 401:
        // Redirect to login
        window.location.href = '/login';
        break;
      case 403:
        toast.error('You do not have permission to perform this action');
        break;
      case 404:
        toast.error('Resource not found');
        break;
      case 429:
        toast.error('Too many requests. Please slow down.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error(error.response.data?.message || 'An error occurred');
    }
  } else if (error.request) {
    // Request made but no response
    toast.error('Network error. Please check your connection.');
  } else {
    // Error in request setup
    toast.error('An unexpected error occurred');
  }
}
```

**WebSocket Error Handling:**
```typescript
// services/WebSocketService.ts
onStompError: (frame) => {
  console.error('STOMP error:', frame);
  toast.error('Connection error. Attempting to reconnect...');
  
  // Attempt exponential backoff reconnection
  this.handleReconnect();
},

onWebSocketClose: (event) => {
  if (event.code === 1000) {
    // Normal closure
    console.log('WebSocket closed normally');
  } else {
    // Abnormal closure
    console.error('WebSocket closed unexpectedly:', event);
    toast.error('Connection lost. Reconnecting...');
    this.handleReconnect();
  }
}
```

### Backend Error Handling

**Global Exception Handler Enhancement:**
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException ex, WebRequest request) {
        logger.warn("Resource not found: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage(),
            request.getDescription(false)
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleRateLimitExceeded(
            RateLimitExceededException ex, WebRequest request) {
        logger.warn("Rate limit exceeded: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
            HttpStatus.TOO_MANY_REQUESTS.value(),
            "Too many requests. Please try again later.",
            request.getDescription(false)
        );
        return new ResponseEntity<>(error, HttpStatus.TOO_MANY_REQUESTS);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, WebRequest request) {
        logger.error("Unexpected error occurred", ex);
        ErrorResponse error = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "An unexpected error occurred. Please try again later.",
            request.getDescription(false)
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

**Validation Error Handling:**
```java
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<ValidationErrorResponse> handleValidationErrors(
        MethodArgumentNotValidException ex) {
    List<String> errors = ex.getBindingResult()
        .getFieldErrors()
        .stream()
        .map(error -> error.getField() + ": " + error.getDefaultMessage())
        .collect(Collectors.toList());
    
    ValidationErrorResponse response = new ValidationErrorResponse(
        HttpStatus.BAD_REQUEST.value(),
        "Validation failed",
        errors
    );
    
    return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
}
```

## Testing Strategy

### Unit Testing

**Frontend Unit Tests (Vitest + React Testing Library):**
- Test individual components in isolation
- Mock external dependencies (API calls, WebSocket)
- Focus on component behavior and user interactions
- Test custom hooks independently

Example:
```typescript
// components/ChatInput.test.tsx
describe('ChatInput', () => {
  it('should call onSend when Enter is pressed', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 13 });
    
    expect(onSend).toHaveBeenCalledWith('Hello');
  });
  
  it('should not send empty messages', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.keyPress(input, { key: 'Enter', code: 13 });
    
    expect(onSend).not.toHaveBeenCalled();
  });
});
```

**Backend Unit Tests (JUnit 5 + Mockito):**
- Test service layer methods
- Mock repository dependencies
- Test business logic in isolation
- Verify exception handling

Example:
```java
@ExtendWith(MockitoExtension.class)
class MessageServiceTest {
    
    @Mock
    private MessageRepository messageRepository;
    
    @Mock
    private ChatRoomRepository chatRoomRepository;
    
    @InjectMocks
    private MessageService messageService;
    
    @Test
    void shouldCreateMessage() {
        // Given
        UUID roomId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        SendMessageRequest request = new SendMessageRequest("Hello", MessageType.TEXT);
        
        ChatRoom room = new ChatRoom();
        room.setId(roomId);
        
        when(chatRoomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(messageRepository.save(any(Message.class))).thenAnswer(i -> i.getArgument(0));
        
        // When
        Message message = messageService.createMessage(roomId, userId, request);
        
        // Then
        assertNotNull(message);
        assertEquals("Hello", message.getContent());
        assertEquals(MessageType.TEXT, message.getType());
        verify(messageRepository).save(any(Message.class));
    }
}
```

### Property-Based Testing

**Frontend Property Tests (fast-check):**

We will use fast-check for JavaScript/TypeScript property-based testing.

Example:
```typescript
// utils/search.test.ts
import fc from 'fast-check';

describe('Message Search Properties', () => {
  it('Property 1: Search returns only matching messages', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.uuid(),
          content: fc.string(),
          senderId: fc.uuid(),
        })),
        fc.string(),
        (messages, query) => {
          const results = searchMessages(messages, query);
          
          // All results should contain the query (case-insensitive)
          return results.every(msg => 
            msg.content.toLowerCase().includes(query.toLowerCase())
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Backend Property Tests (jqwik):**

We will use jqwik for Java property-based testing.

Example:
```java
class MessageServicePropertyTest {
    
    @Property
    void property13_paginationPageSize(@ForAll @IntRange(min = 0, max = 1000) int totalMessages) {
        // **Feature: melon-chat-improvements, Property 13: Pagination page size**
        
        // Given: A conversation with random number of messages
        UUID conversationId = UUID.randomUUID();
        List<Message> allMessages = generateMessages(conversationId, totalMessages);
        
        // When: Querying without explicit page size
        Page<Message> result = messageService.getMessages(conversationId, Pageable.unpaged());
        
        // Then: Result should contain at most 50 messages
        assertTrue(result.getContent().size() <= 50);
    }
    
    @Property
    void property6_fileSizeValidation(@ForAll @LongRange(min = 0, max = 20_000_000) long fileSize) {
        // **Feature: melon-chat-improvements, Property 6: File size validation**
        
        // Given: A file with random size
        MockMultipartFile file = new MockMultipartFile(
            "file", "test.jpg", "image/jpeg", new byte[(int) fileSize]
        );
        
        // When: Attempting to upload
        if (fileSize > 10_000_000) {
            // Then: Should reject files over 10MB
            assertThrows(FileSizeExceededException.class, () -> {
                fileUploadService.uploadFile(file);
            });
        } else {
            // Then: Should accept files under 10MB
            assertDoesNotThrow(() -> {
                fileUploadService.uploadFile(file);
            });
        }
    }
}
```

### Integration Testing

**API Integration Tests:**
- Test complete request/response cycles
- Use test database (H2 or Testcontainers)
- Verify authentication and authorization
- Test WebSocket connections

Example:
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class ChatControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private JwtTokenProvider tokenProvider;
    
    @Test
    void shouldSendMessage() throws Exception {
        // Given
        String token = generateTestToken();
        UUID roomId = createTestRoom();
        
        SendMessageRequest request = new SendMessageRequest("Hello", MessageType.TEXT);
        
        // When/Then
        mockMvc.perform(post("/api/chats/{roomId}/messages", roomId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").value("Hello"))
            .andExpect(jsonPath("$.type").value("TEXT"));
    }
}
```

### End-to-End Testing

**Playwright for E2E Tests:**
- Test critical user flows
- Test across different browsers
- Verify real-time features
- Test responsive design

Example:
```typescript
// e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test('should send and receive messages', async ({ page, context }) => {
  // Open two browser contexts (two users)
  const page1 = page;
  const page2 = await context.newPage();
  
  // User 1 logs in
  await page1.goto('/login');
  await page1.fill('[name="username"]', 'user1');
  await page1.fill('[name="password"]', 'password1');
  await page1.click('button[type="submit"]');
  
  // User 2 logs in
  await page2.goto('/login');
  await page2.fill('[name="username"]', 'user2');
  await page2.fill('[name="password"]', 'password2');
  await page2.click('button[type="submit"]');
  
  // User 1 sends message
  await page1.fill('[data-testid="message-input"]', 'Hello from User 1');
  await page1.press('[data-testid="message-input"]', 'Enter');
  
  // User 2 should receive message
  await expect(page2.locator('text=Hello from User 1')).toBeVisible({ timeout: 5000 });
});
```

## Performance Optimization

### Code Splitting Strategy

```typescript
// App.tsx - Lazy load routes
const ChatPage = lazy(() => import('./pages/ChatPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ChatPage />} />
      </Routes>
    </Suspense>
  );
}
```

### Image Optimization

```typescript
// components/LazyImage.tsx
export function LazyImage({ src, alt, ...props }: ImageProps) {
  const [imageSrc, setImageSrc] = useState<string | undefined>();
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, [src]);
  
  return (
    <img
      ref={imgRef}
      src={imageSrc || 'data:image/svg+xml,...'} // placeholder
      alt={alt}
      loading="lazy"
      {...props}
    />
  );
}
```

### Memoization Strategy

```typescript
// Memoize expensive computations
const sortedMessages = useMemo(() => {
  return messages.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}, [messages]);

// Memoize callbacks to prevent re-renders
const handleSendMessage = useCallback((content: string) => {
  sendMessage.mutate({ content, type: MessageType.TEXT });
}, [sendMessage]);

// Memoize components
const MessageItem = memo(({ message }: { message: Message }) => {
  return <div>{message.content}</div>;
}, (prev, next) => prev.message.id === next.message.id);
```

### Virtual Scrolling for Long Lists

```typescript
// Use react-window for virtualized message list
import { FixedSizeList } from 'react-window';

function MessageList({ messages }: { messages: Message[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <MessageBubble message={messages[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={messages.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

## Security Considerations

### Rate Limiting Implementation

```java
// RateLimitingFilter.java
@Component
public class RateLimitingFilter extends OncePerRequestFilter {
    
    private final Map<String, RateLimiter> limiters = new ConcurrentHashMap<>();
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain) throws ServletException, IOException {
        String userId = extractUserId(request);
        
        RateLimiter limiter = limiters.computeIfAbsent(userId, 
            k -> RateLimiter.create(100.0 / 60.0)); // 100 requests per minute
        
        if (!limiter.tryAcquire()) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Rate limit exceeded");
            return;
        }
        
        filterChain.doFilter(request, response);
    }
}
```

### File Upload Security

```java
// FileValidationService.java
@Service
public class FileValidationService {
    
    private static final List<String> ALLOWED_TYPES = Arrays.asList(
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "video/mp4", "video/webm",
        "application/pdf", "application/msword"
    );
    
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    
    public void validateFile(MultipartFile file) {
        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FileSizeExceededException("File size exceeds 10MB limit");
        }
        
        // Check file type
        String contentType = file.getContentType();
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new InvalidFileTypeException("File type not allowed: " + contentType);
        }
        
        // Verify file content matches extension
        try {
            String detectedType = Files.probeContentType(
                Paths.get(file.getOriginalFilename())
            );
            if (!contentType.equals(detectedType)) {
                throw new InvalidFileTypeException("File content does not match extension");
            }
        } catch (IOException e) {
            throw new FileValidationException("Failed to validate file", e);
        }
    }
}
```

## Deployment Strategy

### Docker Optimization

```dockerfile
# Multi-stage build for frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY apps/web/package*.json ./
RUN npm ci --only=production
COPY apps/web ./
RUN npm run build

# Multi-stage build for backend
FROM maven:3.8-openjdk-17 AS backend-build
WORKDIR /app
COPY apps/backend/pom.xml ./
RUN mvn dependency:go-offline
COPY apps/backend/src ./src
RUN mvn clean package -DskipTests

# Final image
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=backend-build /app/target/*.jar app.jar
COPY --from=frontend-build /app/dist ./static
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd apps/web && npm ci
      - run: cd apps/web && npm run test
      - run: cd apps/web && npm run build
      
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      - run: cd apps/backend && mvn test
      - run: cd apps/backend && mvn package
      
  build-and-push:
    needs: [test-frontend, test-backend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      - uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            myapp/melon-chat:latest
            myapp/melon-chat:${{ github.sha }}
```

## Monitoring and Observability

### Logging Configuration

```java
// application.yml
logging:
  level:
    root: INFO
    com.chat: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: logs/melon-chat.log
    max-size: 10MB
    max-history: 30
```

### Health Check Endpoints

```java
// HealthController.java
@RestController
@RequestMapping("/api/health")
public class HealthController {
    
    @Autowired
    private DataSource dataSource;
    
    @GetMapping
    public ResponseEntity<HealthStatus> health() {
        HealthStatus status = new HealthStatus();
        status.setStatus("UP");
        status.setTimestamp(LocalDateTime.now());
        
        // Check database
        try (Connection conn = dataSource.getConnection()) {
            status.setDatabase("UP");
        } catch (SQLException e) {
            status.setDatabase("DOWN");
            status.setStatus("DEGRADED");
        }
        
        return ResponseEntity.ok(status);
    }
    
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> metrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("uptime", ManagementFactory.getRuntimeMXBean().getUptime());
        metrics.put("memory", getMemoryMetrics());
        metrics.put("threads", Thread.activeCount());
        return ResponseEntity.ok(metrics);
    }
}
```

## Migration Strategy

### Phase 1: Foundation (Weeks 1-2)
- Set up testing infrastructure
- Configure ESLint, Prettier, TypeScript strict mode
- Implement error boundaries
- Add skeleton loaders

### Phase 2: Performance (Weeks 3-4)
- Remove polling, rely on WebSocket
- Implement code splitting
- Add React Query for caching
- Optimize bundle size

### Phase 3: Features (Weeks 5-7)
- Implement typing indicators
- Add message reactions
- Build notification system
- Implement message search

### Phase 4: Quality (Weeks 8-9)
- Write unit tests (target 70% coverage)
- Write property-based tests
- Write integration tests
- Refactor large components

### Phase 5: Infrastructure (Weeks 10-11)
- Set up CI/CD pipeline
- Implement monitoring and logging
- Add rate limiting
- Optimize database queries

### Phase 6: Polish (Week 12)
- Performance testing and optimization
- Security audit
- Documentation
- Final bug fixes

## Conclusion

This design provides a comprehensive roadmap for improving the Melon Chat application. The improvements are structured to be implemented incrementally, allowing for continuous delivery of value while maintaining system stability. Each phase builds upon the previous one, ensuring a solid foundation before adding new features.

The focus on testing, particularly property-based testing, ensures that the system maintains correctness as it evolves. The performance optimizations will provide a smooth user experience, while the infrastructure improvements will enable reliable deployment and monitoring in production.
