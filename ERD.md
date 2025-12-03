# Entity Relationship Diagram (ERD) - Hotel Management System

## Complete System ERD

```mermaid
erDiagram
    USER ||--o{ ACTIVITY_LOG : "logs"
    USER {
        string _id PK
        string username UK "unique"
        string email UK "unique"
        string password
        enum role "restaurantAdmin, hotelAdmin"
        date createdAt
    }

    CUSTOMER ||--|| ROOM : "occupies"
    CUSTOMER {
        objectid _id PK
        string name
        string contactNumber
        string roomNumber FK
        date checkinDate
        string checkinTime
        string checkoutDate
        string updatedCheckoutDate
        enum status "checked in, checked out"
    }

    ROOM ||--o{ BOOKING : "has"
    ROOM ||--o| CART : "contains"
    ROOM ||--o{ ORDER : "generates"
    ROOM ||--o{ REQUEST : "receives"
    ROOM ||--o{ CONTACT_MESSAGE : "receives"
    ROOM ||--o{ HOTEL_AD_NOTIF : "triggers"
    ROOM {
        objectid _id PK
        string roomNumber UK "unique"
        enum roomType "Standard, Deluxe, Economy, Suite"
        string description
        number price
        array facilities
        enum status "available, booked, under maintenance"
        string guestName
        string guestContact
        date createdAt
        objectid cart FK "ref: Cart"
    }

    BOOKING {
        objectid _id PK
        objectid room FK
        string customerName
        string customerEmail
        date checkInDate
        date checkOutDate
        string specialId
        number partialPayment
        string paymentStatus
        object paymentDetails
        string bookingStatus
        number totalAmount
        date bookedAt
    }

    CART {
        objectid _id PK
        string roomNumber UK "unique"
        array items
        date updatedAt
    }

    ORDER ||--o{ BILLING : "generates"
    ORDER {
        objectid _id PK
        string roomNumber FK
        array items
        date checkedOutAt
        enum status "pending, acknowledged, preparing, on the way, delivered"
    }

    CANCELLED_ORDER {
        objectid _id PK
        string roomNumber
        array items
        date checkedOutAt
        objectid originalOrderId FK
        date cancelledAt
        string cancellationReason
        string statusAtCancellation
        number totalPrice
    }

    BILLING {
        objectid _id PK
        objectid orderId FK
        string roomNumber
        array items
        date checkedOutAt
        date deliveredAt
        number totalPrice
    }

    FOOD {
        objectid _id PK
        string name
        number price
        string category
        string img
        string details
        boolean available
    }

    CAROUSEL_COMBO {
        objectid _id PK
        string title
        string description
        number price
        string img
        array items
        boolean active
        date createdAt
        date updatedAt
    }

    EMPLOYEE ||--o{ TASK : "assigned"
    EMPLOYEE {
        objectid _id PK
        string name
        string employeeCode UK "unique"
        string role
        string department
        string jobTitle
    }

    TASK ||--o{ HOTEL_AD_NOTIF : "triggers"
    TASK {
        objectid _id PK
        string taskId
        objectid assignedTo FK
        string employeeId
        string room
        string type
        string status
        string priority
        string description
        string jobTitle
        number estimatedDuration
        date createdAt
        date updatedAt
        date dueDate
        array notes
    }

    REQUEST {
        objectid _id PK
        string taskId UK "unique"
        string roomNumber FK
        enum jobType "cleaning, maintenance"
        date date
        string priority
    }

    ACTIVITY_LOG {
        objectid _id PK
        string actionType
        string collection
        objectid documentId
        string user
        date timestamp
        object details
        object change
    }

    HOTEL_AD_NOTIF {
        objectid _id PK
        string bookingId "sparse index"
        string taskId "sparse index"
        string roomNumber
        string roomType
        string employeeId
        string taskType
        string oldStatus
        string newStatus
        boolean isRoomNotification
        boolean isTaskNotification
        mixed raw
        date timestamp
        boolean read
    }

    CONTACT_MESSAGE {
        objectid _id PK
        string name
        string roomNumber FK
        string message
        date createdAt
    }
```

## Entity Summary

### Core Entities

#### **User**
- Administrative users (restaurantAdmin, hotelAdmin)
- Manages authentication and authorization
- Logs all activities

#### **Customer**
- Hotel guests checking in/out
- Linked to room numbers
- Tracks stay duration and status

#### **Room**
- Core hotel resource
- Multiple types (Standard, Deluxe, Economy, Suite)
- Status tracking (available, booked, maintenance)
- Associated with bookings, carts, orders, and requests

#### **Booking**
- Room reservations
- Payment tracking
- Check-in/check-out management
- Special identifiers and discount tracking

### Food & Beverage Module

#### **Food**
- Menu items catalog
- Categories for organization
- Pricing and availability

#### **Cart**
- Per-room order staging
- Adds items before checkout
- Tracks item details and combo contents

#### **Order**
- Checked-out carts
- Status workflow (pending → delivered)
- Analytics tracking with combo contents

#### **CancelledOrder**
- Archived cancelled orders
- References original order
- Captures cancellation reason and original status

#### **Billing**
- Final invoice generation
- References orders
- Room-specific billing per order

#### **CarouselCombo**
- Promotional bundle offers
- Combines multiple food items
- Active/inactive status for campaigns

### Staff & Task Management

#### **Employee**
- Staff directory
- Department and role tracking
- Unique employee codes

#### **Task**
- Assignments to employees
- Priority and status tracking
- Room-specific work requests
- Estimated duration for planning

#### **Request**
- Room service requests
- Cleaning and maintenance jobs
- Priority levels

### Logging & Notifications

#### **ActivityLog**
- Audit trail for all changes
- Documents user actions
- Tracks old/new values for updates

#### **HotelAdNotif**
- Notifications for admin dashboard
- Tracks room and task status changes
- Read/unread status

#### **ContactMessage**
- Guest messages to front desk
- Room-based communication
- Timestamp tracking

## Key Relationships

1. **Room** is the central hub:
   - Has multiple **Bookings**
   - Contains a **Cart** for current room's orders
   - Generates **Orders** from cart checkouts
   - Receives **Requests** for services
   - Triggers **Notifications**

2. **Order** workflow:
   - Created from **Cart** checkout
   - Generates **Billing**
   - Can be **Cancelled** (archived in CancelledOrder)
   - Status progression tracked

3. **Employee** management:
   - Assigned **Tasks**
   - Tasks trigger **Notifications**

4. **Audit & Compliance**:
   - **User** actions logged to **ActivityLog**
   - System changes tracked via **HotelAdNotif**

## Data Flow

```
Guest Interaction:
Booking (reservation) → Check-in (Customer) → Room Assignment
                              ↓
                          Cart (add items)
                              ↓
                          Order (checkout)
                              ↓
                          Billing (invoice)

Room Service:
Request (cleaning/maintenance) → Task Assignment → Employee Action
                                        ↓
                                  Notification

Administrative:
User Login → Activity Logging → Audit Trail
```
