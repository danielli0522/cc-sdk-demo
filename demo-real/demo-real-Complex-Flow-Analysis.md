# Complex Flow Analysis - demo-real

## Email Validation Flow

### Flow Overview
- **Business Goal**: Provide robust email validation with detailed error feedback
- **Trigger Condition**: Function call to validateEmailDetailed()
- **Core Concerns**: 
  - Email format correctness
  - Length constraints
  - Special character handling
- **Key Non-functional Points**:
  - Input validation
  - Detailed error reporting
  - Performance (regex optimization)

### Sequence Diagram
```mermaid
sequenceDiagram
    participant C as Client
    participant V as ValidateEmailDetailed
    participant R as RegexValidator
    
    C->>V: validateEmailDetailed(email)
    V->>V: Check type
    alt email not string
        V-->>C: return {isValid: false, error: 'Email must be a string'}
    end
    V->>V: Check empty
    alt email empty
        V-->>C: return {isValid: false, error: 'Email cannot be empty'}
    end
    V->>V: Check length
    alt length > 254
        V-->>C: return {isValid: false, error: 'Email is too long'}
    end
    V->>V: Check @ symbol
    alt no @ symbol
        V-->>C: return {isValid: false, error: 'Email must contain @ symbol'}
    end
    V->>V: Check consecutive dots
    alt has consecutive dots
        V-->>C: return {isValid: false, error: 'Cannot contain consecutive dots'}
    end
    V->>V: Check dots around @
    alt dots adjacent to @
        V-->>C: return {isValid: false, error: 'Cannot have dots adjacent to @'}
    end
    V->>R: emailRegex.test(email)
    alt regex test fails
        V-->>C: return {isValid: false, error: 'Invalid email format'}
    end
    V-->>C: return {isValid: true, error: null}
```

### Key Configuration Items
- Email regex pattern: `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`
- Maximum email length: 254 characters

### Detailed Step Analysis
1. **Type Validation**
   - Checks if input is string type
   - Returns early with error for non-string input

2. **Empty Check**
   - Validates email string is not empty
   - Returns specific error message for empty input

3. **Length Validation**
   - Enforces 254 character limit
   - Industry standard maximum length enforcement

4. **Special Character Checks**
   - Validates @ symbol presence
   - Checks for invalid dot patterns
   - Prevents consecutive dots
   - Prevents dots adjacent to @ symbol

5. **Regex Pattern Validation**
   - Final comprehensive format check
   - Validates local part and domain format
   - Ensures valid TLD length

## Real-time Streaming Query Flow

### Flow Overview
- **Business Goal**: Provide real-time streaming responses for Claude Code SDK queries
- **Trigger Condition**: HTTP POST/GET to /api/streaming-query
- **Core Concerns**: 
  - Real-time data streaming
  - Connection management
  - Error handling
- **Key Non-functional Points**:
  - Connection stability
  - Response latency
  - Resource management

### Sequence Diagram
```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant SDK as Claude SDK
    participant SSE as SSE Stream
    
    C->>S: POST /api/streaming-query
    activate S
    S-->>C: SSE Connection Established
    S->>S: Setup Heartbeat
    
    S->>SDK: Initialize SDK Query
    activate SDK
    
    loop For each SDK message
        SDK-->>S: Stream Message
        S->>S: Process Message
        alt assistant message
            S->>S: Extract Text Content
        else result message
            S->>S: Append Final Result
        end
    end
    deactivate SDK
    
    loop For each character
        S->>SSE: Send Character
        SSE-->>C: Stream Character
        S->>S: Add Delay (50ms)
    end
    
    S->>SSE: Send Complete Event
    SSE-->>C: Complete
    deactivate S
```

### Key Configuration Items
- Server Port: `process.env.PORT || 3002`
- Streaming delay: 50ms per character
- Heartbeat interval: 30,000ms (30 seconds)
- Message types: 'assistant', 'result', 'error', 'heartbeat'

### Detailed Step Analysis
1. **Connection Initialization**
   - Sets SSE headers
   - Establishes persistent connection
   - Sends initial connection confirmation
   - Starts heartbeat interval

2. **Query Configuration**
   - Validates required prompt parameter
   - Processes optional parameters:
     - allowedTools
     - permissionMode
     - cwd

3. **Claude SDK Integration**
   - Initializes SDK with configuration
   - Processes messages asynchronously
   - Handles different message types:
     - Assistant messages: extracts text content
     - Result messages: appends final content

4. **Streaming Response**
   - Character-by-character transmission
   - Includes position and metadata
   - Implements artificial delay for readability
   - Maintains connection with heartbeat

5. **Error Handling & Cleanup**
   - Catches and processes SDK errors
   - Cleans up heartbeat interval
   - Sends detailed error information
   - Ensures proper connection closure