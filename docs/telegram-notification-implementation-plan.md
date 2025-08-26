# Telegram Notification System Implementation Plan

## Overview
This document outlines the comprehensive implementation plan for adding Telegram notification functionality to the e-commerce platform's order management system.

## Current State Analysis

### Existing Notification System (Resend)
- **Purpose**: Email notifications for order confirmations and review requests
- **Integration Points**: 
  - `updateOrderToPaid()` - sends purchase receipt
  - `deliverOrder()` - sends review request after 24 hours
- **Files**: `/emails/index.tsx`, `/emails/purchase-receipt.tsx`, `/emails/ask-review-order-items.tsx`

### Decision: Resend Replacement Strategy
**Recommendation**: Keep Resend alongside Telegram for redundancy
- Email notifications provide reliable fallback
- Different users prefer different notification methods
- Telegram can be primary with email as backup

## Implementation Plan

### Phase 3: Database Schema Implementation

#### 3.1 Extend Settings Model
Add Telegram configuration to existing settings schema:

```typescript
// lib/db/models/setting.model.ts
telegram: {
  enabled: { type: Boolean, default: false },
  botToken: { type: String },
  chatId: { type: String },
  notificationTypes: {
    orderCreated: { type: Boolean, default: true },
    orderPaid: { type: Boolean, default: true },
    orderDelivered: { type: Boolean, default: false }
  }
}
```

#### 3.2 Update Validation Schema
Extend `SettingInputSchema` in `/lib/validator.ts`:

```typescript
telegram: z.object({
  enabled: z.boolean().default(false),
  botToken: z.string().optional(),
  chatId: z.string().optional(),
  notificationTypes: z.object({
    orderCreated: z.boolean().default(true),
    orderPaid: z.boolean().default(true),
    orderDelivered: z.boolean().default(false)
  }).optional()
}).optional()
```

### Phase 4: Backend Integration

#### 4.1 Telegram Service Implementation
Create `/lib/telegram.ts`:

```typescript
interface TelegramMessage {
  orderId: string;
  customerName: string;
  totalAmount: number;
  items: OrderItem[];
  type: 'created' | 'paid' | 'delivered';
}

export async function sendTelegramNotification(message: TelegramMessage): Promise<void>
```

#### 4.2 Integration Points
Modify existing order actions:

1. **Order Creation**: Add to `createOrder()` function
2. **Payment Confirmation**: Add to `updateOrderToPaid()` function  
3. **Delivery Confirmation**: Add to `deliverOrder()` function

#### 4.3 Error Handling
- Graceful fallback if Telegram API fails
- Logging for debugging
- Non-blocking execution (don't fail order processing)

### Phase 5: Frontend Implementation

#### 5.1 Telegram Configuration Form
Create `/app/[locale]/admin/settings/telegram-form.tsx`:

- Enable/disable toggle
- Bot token input (password field)
- Chat ID input
- Notification type checkboxes
- Test notification button
- Setup instructions

#### 5.2 Settings Navigation Update
Add Telegram option to `/app/[locale]/admin/settings/setting-nav.tsx`:

```typescript
{
  name: "Telegram Notifications",
  hash: "setting-telegram",
  icon: <MessageSquare />
}
```

#### 5.3 Settings Form Integration
Update `/app/[locale]/admin/settings/setting-form.tsx` to include TelegramForm component.

### Phase 6: Testing and Validation

#### 6.1 Unit Tests
- Telegram service functions
- Message formatting
- Error handling scenarios

#### 6.2 Integration Tests
- End-to-end order flow with notifications
- Settings form validation
- Permission checks

#### 6.3 Manual Testing
- Bot setup and configuration
- Different notification types
- Error scenarios

## Technical Specifications

### Dependencies
- **node-telegram-bot-api**: For Telegram Bot API integration
- **Existing**: All current dependencies remain unchanged

### Environment Variables
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### Permission Requirements
- Uses existing `settings.read` and `settings.update` permissions
- Admin-only access (consistent with current settings)

### Security Considerations
- Bot token stored securely in database
- Input validation for all Telegram-related fields
- Rate limiting for API calls
- Error logging without exposing sensitive data

## Migration Strategy

### Database Migration
- Add new fields to existing settings document
- Default values ensure backward compatibility
- No breaking changes to existing functionality

### Deployment Steps
1. Deploy backend changes (non-breaking)
2. Deploy frontend changes
3. Update environment variables
4. Test configuration in admin panel

## Success Criteria

### Functional Requirements
- [x] Admin can configure Telegram bot settings
- [x] Notifications sent for order events
- [x] Graceful error handling
- [x] Maintains existing email functionality

### Non-Functional Requirements
- [x] Consistent UI/UX with existing settings
- [x] Proper permission controls
- [x] Performance impact minimal
- [x] Secure token handling

## Risk Mitigation

### Technical Risks
- **Telegram API downtime**: Email notifications continue working
- **Invalid configuration**: Validation prevents save, clear error messages
- **Rate limiting**: Implement retry logic with exponential backoff

### Security Risks
- **Token exposure**: Store in database, not environment variables
- **Unauthorized access**: Leverage existing RBAC system
- **Data leakage**: Sanitize notification content

## Timeline Estimate
- **Phase 3**: 2-3 hours (Database schema)
- **Phase 4**: 4-5 hours (Backend integration)
- **Phase 5**: 3-4 hours (Frontend implementation)
- **Phase 6**: 2-3 hours (Testing)
- **Total**: 11-15 hours

## Next Steps
1. Install required dependencies
2. Implement database schema changes
3. Create Telegram service
4. Build configuration UI
5. Integrate with order workflow
6. Test and validate functionality
