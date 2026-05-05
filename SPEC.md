# Daycare Transportation Management App — Full Specification

> Generated: 2026-05-04  
> Stack: Next.js 14 · Tailwind CSS · Prisma · PostgreSQL (Supabase) · Mapbox GL · Twilio

---

## Table of Contents

1. [Data Schema](#1-data-schema)
2. [Screen Descriptions & Wireframes](#2-screen-descriptions--wireframes)
3. [Key API Endpoints](#3-key-api-endpoints)
4. [Route Optimization Approach](#4-route-optimization-approach)
5. [Sample Weekly Report Layout](#5-sample-weekly-report-layout)
6. [Security, Compliance & Data Privacy](#6-security-compliance--data-privacy)
7. [Tech Stack & Project Structure](#7-tech-stack--project-structure)

---

## 1. Data Schema

### Prisma Schema (`schema.prisma`)

```prisma
// ─── Enums ───────────────────────────────────────────────────────────────────

enum Role {
  ADMIN
  OFFICE_STAFF
  DRIVER
}

enum VehicleStatus {
  ACTIVE
  IN_USE
  MAINTENANCE
  RETIRED
}

enum TripStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  DELAYED
  CANCELLED
}

enum StopType {
  PICKUP
  DROPOFF
}

enum AttendanceStatus {
  TRANSPORTED          // default — driver completed pickup + dropoff
  PARENT_PICKUP_EARLY  // parent notified they will pick up from school
  NO_SCHOOL            // school holiday / teacher day
  ABSENT               // child absent from daycare
  SICK
  VACATION
  OTHER
}

enum BackgroundCheckStatus {
  PENDING
  CLEARED
  FAILED
  EXPIRED
}

// ─── Users (Auth) ─────────────────────────────────────────────────────────────

model User {
  id             String    @id @default(cuid())
  email          String    @unique
  hashedPassword String
  role           Role
  name           String
  phone          String?
  active         Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  driver         Driver?
  auditLogs      AuditLog[]
}

// ─── Children ─────────────────────────────────────────────────────────────────

model Child {
  id                String   @id @default(cuid())
  fullName          String
  photoUrl          String?
  dateOfBirth       DateTime?
  grade             String?

  schoolId          String
  school            School   @relation(fields: [schoolId], references: [id])

  homeAddress       String
  homeLat           Float
  homeLng           Float

  // Primary guardian
  guardianName      String
  guardianPhone     String
  guardianEmail     String
  guardianRelation  String   @default("Parent")

  // Emergency contact (optional)
  emergencyName     String?
  emergencyPhone    String?
  emergencyRelation String?

  specialInstructions String?  // allergies, behavior notes, car-seat required, etc.
  active              Boolean  @default(true)

  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  routeAssignments  RouteChildAssignment[]
  attendanceLogs    AttendanceLog[]
  tripStopChildren  TripStopChild[]
}

// ─── Schools ──────────────────────────────────────────────────────────────────

model School {
  id              String  @id @default(cuid())
  name            String
  address         String
  lat             Float
  lng             Float
  dismissalTime   String  // "15:15" — stored as HH:MM for easy comparison
  contactPerson   String?
  contactPhone    String?
  active          Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  children  Child[]
  stops     RouteStop[]
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────

model Vehicle {
  id                   String        @id @default(cuid())
  identifier           String        @unique  // "Van 1", "Bus A"
  make                 String
  model                String
  year                 Int
  licensePlate         String        @unique
  capacity             Int
  status               VehicleStatus @default(ACTIVE)
  mileage              Int?
  insuranceExpiry      DateTime?
  maintenanceNotes     String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  routes    Route[]
  trips     Trip[]
}

// ─── Drivers ──────────────────────────────────────────────────────────────────

model Driver {
  id                    String               @id @default(cuid())
  userId                String               @unique
  user                  User                 @relation(fields: [userId], references: [id])

  photoUrl              String?
  licenseNumber         String
  licenseExpiry         DateTime
  certificationTypes    String[]             // ["CDL", "First Aid", "CPR"]
  certificationExpiry   DateTime?
  backgroundCheckStatus BackgroundCheckStatus @default(PENDING)
  backgroundCheckDate   DateTime?
  active                Boolean              @default(true)
  notes                 String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  routes    Route[]
  trips     Trip[]
  locations DriverLocation[]
}

// ─── Routes ───────────────────────────────────────────────────────────────────

model Route {
  id         String @id @default(cuid())
  code       String @unique  // "Route-A", "Route-B"
  name       String
  active     Boolean @default(true)

  driverId   String?
  driver     Driver?  @relation(fields: [driverId], references: [id])

  vehicleId  String?
  vehicle    Vehicle? @relation(fields: [vehicleId], references: [id])

  // Days this route runs (bitmask or array): ["MON","TUE","WED","THU","FRI"]
  activeDays String[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  stops            RouteStop[]
  childAssignments RouteChildAssignment[]
  trips            Trip[]
}

// ─── Route Stops ──────────────────────────────────────────────────────────────
// Ordered list of stops on a route. Each stop is either a school pickup
// or a home/daycare dropoff.

model RouteStop {
  id             String   @id @default(cuid())
  routeId        String
  route          Route    @relation(fields: [routeId], references: [id])

  sequence       Int      // 1, 2, 3 … (ordered)
  type           StopType

  // Exactly one of schoolId or childId is set
  schoolId       String?
  school         School?  @relation(fields: [schoolId], references: [id])

  // For home dropoffs: address + coords pulled from Child, stored here for snapshotting
  address        String
  lat            Float
  lng            Float

  estimatedTime  String?  // "15:30" — estimated arrival at this stop

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tripStops      TripStop[]
  children       RouteStopChild[]   // which children are picked up / dropped off at this stop
}

// Junction: which children are assigned to a given stop
model RouteStopChild {
  stopId   String
  stop     RouteStop @relation(fields: [stopId], references: [id])
  childId  String
  child    Child     @relation(fields: [childId], references: [id])  // via RouteChildAssignment

  @@id([stopId, childId])
}

// Assignment of a child to a route (with optional per-day overrides)
model RouteChildAssignment {
  id        String   @id @default(cuid())
  childId   String
  child     Child    @relation(fields: [childId], references: [id])
  routeId   String
  route     Route    @relation(fields: [routeId], references: [id])
  active    Boolean  @default(true)
  startDate DateTime @default(now())
  endDate   DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([childId, routeId])
}

// ─── Trips (Daily Instances of Routes) ───────────────────────────────────────

model Trip {
  id        String     @id @default(cuid())
  date      DateTime   @db.Date
  routeId   String
  route     Route      @relation(fields: [routeId], references: [id])
  driverId  String
  driver    Driver     @relation(fields: [driverId], references: [id])
  vehicleId String
  vehicle   Vehicle    @relation(fields: [vehicleId], references: [id])
  status    TripStatus @default(SCHEDULED)

  startedAt   DateTime?
  completedAt DateTime?
  notes       String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  stops         TripStop[]
  attendanceLogs AttendanceLog[]

  @@unique([date, routeId])
}

// Per-stop record for an actual trip run
model TripStop {
  id          String    @id @default(cuid())
  tripId      String
  trip        Trip      @relation(fields: [tripId], references: [id])
  routeStopId String
  routeStop   RouteStop @relation(fields: [routeStopId], references: [id])
  sequence    Int

  arrivedAt   DateTime?
  departedAt  DateTime?
  status      String?   // "COMPLETED", "SKIPPED"
  notes       String?

  children    TripStopChild[]
}

// Per-child record within a trip stop
model TripStopChild {
  id          String    @id @default(cuid())
  tripStopId  String
  tripStop    TripStop  @relation(fields: [tripStopId], references: [id])
  childId     String
  child       Child     @relation(fields: [childId], references: [id])

  pickedUpAt   DateTime?
  droppedOffAt DateTime?
  signatureUrl String?   // optional photo/signature
  notes        String?
}

// ─── Attendance / Daily Exceptions ───────────────────────────────────────────

model AttendanceLog {
  id          String           @id @default(cuid())
  childId     String
  child       Child            @relation(fields: [childId], references: [id])
  date        DateTime         @db.Date
  tripId      String?
  trip        Trip?            @relation(fields: [tripId], references: [id])

  status      AttendanceStatus @default(TRANSPORTED)
  notes       String?
  recordedBy  String           // userId

  actualPickupTime   DateTime?
  actualDropoffTime  DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([childId, date])
}

// ─── Driver GPS Locations (Real-time) ────────────────────────────────────────

model DriverLocation {
  id        String   @id @default(cuid())
  driverId  String
  driver    Driver   @relation(fields: [driverId], references: [id])
  lat       Float
  lng       Float
  heading   Float?
  speed     Float?
  timestamp DateTime @default(now())
  tripId    String?

  @@index([driverId, timestamp])
}

// ─── Notifications ────────────────────────────────────────────────────────────

model Notification {
  id         String   @id @default(cuid())
  childId    String
  type       String   // "DELAY", "PICKUP_COMPLETE", "DROPOFF_COMPLETE", "EXCEPTION"
  channel    String   // "SMS", "EMAIL"
  recipient  String   // phone or email
  body       String
  sentAt     DateTime?
  status     String   @default("PENDING") // "SENT", "FAILED"
  createdAt  DateTime @default(now())
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  action     String   // "CREATE", "UPDATE", "DELETE"
  entity     String   // "Child", "Route", "Trip", etc.
  entityId   String
  diff       Json?    // before/after snapshot
  ip         String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([entity, entityId])
}
```

---

## 2. Screen Descriptions & Wireframes

### 2.1 Admin / Office Web App

---

#### Screen: Dashboard (`/dashboard`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  DaycareTransApp          [Today: Mon May 4, 2026]          👤 Admin ▾       │
├────────────┬─────────────────────────────────────────────────────────────────┤
│  NAV       │  TODAY'S ROUTES                                                  │
│  Dashboard │  ┌────────────────────────────┐ ┌────────────────────────────┐  │
│  Routes    │  │ Route A   🟢 In Progress   │ │ Route B   🔵 Scheduled     │  │
│  Children  │  │ Driver: John Smith         │ │ Driver: Maria Garcia       │  │
│  Schools   │  │ Vehicle: Van 1             │ │ Vehicle: Bus A             │  │
│  Drivers   │  │ ▸ Next: Oak Elementary     │ │ ▸ Starts: 3:00 PM          │  │
│  Vehicles  │  │   ETA 3:22 PM              │ │                            │  │
│  Reports   │  │ [View Details]             │ │ [View Details]             │  │
│  Settings  │  └────────────────────────────┘ └────────────────────────────┘  │
│            │                                                                  │
│            │  LIVE MAP                                                        │
│            │  ┌──────────────────────────────────────────────────────────┐   │
│            │  │                    [Mapbox GL Map]                        │   │
│            │  │  🚐 Van 1 ──▶          🏫 Oak Elem       🏠 Drop 3       │   │
│            │  │                                                           │   │
│            │  └──────────────────────────────────────────────────────────┘   │
│            │                                                                  │
│            │  ALERTS                         QUICK ACTIONS                   │
│            │  ⚠ Van 1 delayed ~8 min          [+ Add Exception]              │
│            │  ✅ 14 children transported       [📋 View All Attendance]       │
│            │  ⚡ 2 parent early pickups today   [📊 Weekly Report]            │
└────────────┴─────────────────────────────────────────────────────────────────┘
```

---

#### Screen: Children List (`/children`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Children                              [+ Add Child]   🔍 Search...          │
├─────────────────────────────────────────────────────────────────────────────-┤
│  Filter: [All Schools ▾]  [All Routes ▾]  [Active ▾]                         │
├────────────┬───────────┬────────────┬────────┬──────────────┬────────────────┤
│  Name      │ School    │ Route      │ Grade  │ Guardian     │ Actions        │
├────────────┼───────────┼────────────┼────────┼──────────────┼────────────────┤
│ 🧒 Ava R.  │ Oak Elem  │ Route A    │ K      │ Sarah R. ☎   │ [Edit][Log]    │
│ 🧒 Liam T. │ Pine Elem │ Route B    │ 2nd    │ Mike T. ☎    │ [Edit][Log]    │
│ 🧒 Mia K.  │ Oak Elem  │ Route A    │ 1st    │ Jin K. ☎     │ [Edit][Log]    │
│  …                                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

#### Screen: Child Detail & Edit (`/children/:id`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ← Children / Ava Rodriguez                                    [Edit] [🗑]   │
├──────────────────────────────┬───────────────────────────────────────────────┤
│  👧 [Photo]                  │  Full Name:   Ava Rodriguez                   │
│  Active ● (toggle)           │  DOB:         2020-09-12 (Age 5, Kinder)      │
│                              │  School:      Oak Elementary  (3:15 PM)       │
│                              │  Route:       Route A                         │
│                              │  Home:        123 Maple St, Springfield       │
├──────────────────────────────┴───────────────────────────────────────────────┤
│  GUARDIAN                                                                    │
│  Name: Sarah Rodriguez · Phone: (555) 201-1234 · Email: sarah@email.com     │
│  Relationship: Mother                                                        │
│                                                                              │
│  EMERGENCY CONTACT                                                           │
│  Name: Carlos Rodriguez · Phone: (555) 201-5678 · Relationship: Father      │
├──────────────────────────────────────────────────────────────────────────────┤
│  SPECIAL INSTRUCTIONS                                                        │
│  ⚠ Peanut allergy (EpiPen in backpack). Requires booster seat.              │
├──────────────────────────────────────────────────────────────────────────────┤
│  ATTENDANCE HISTORY (this week)                                              │
│  Mon: ✅ Transported  Tue: ✅ Transported  Wed: 👨 Parent Pickup              │
│  Thu: ✅ Transported  Fri: ⏳ Scheduled                                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

#### Screen: Route Builder (`/routes/:id`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Route A                            [Optimize 🗺] [Save]  [Run Today]        │
├──────────────────────────────────────────────────────────────────────────────┤
│  Driver: [John Smith ▾]    Vehicle: [Van 1 ▾]    Days: [M T W T F]          │
├────────────────────────────┬─────────────────────────────────────────────────┤
│  STOPS (drag to reorder)   │  MAP PREVIEW                                    │
│                            │  ┌──────────────────────────────────────────┐   │
│  ⠿ 1. 🏫 Oak Elementary   │  │        [Mapbox route visualization]       │   │
│        PICKUP  ETA 3:20pm  │  │  1 ──→ 2 ──→ 3 ──→ 4 ──→ 5             │   │
│        Ava R, Mia K, + 2   │  │                                          │   │
│                            │  └──────────────────────────────────────────┘   │
│  ⠿ 2. 🏫 Pine Elementary  │                                                  │
│        PICKUP  ETA 3:35pm  │  CHILDREN ON ROUTE                              │
│        Liam T, Noah P      │  ┌──────────────────────────────────────────┐   │
│                            │  │ Ava R.  · Oak · Stop 1 (pickup) + 3(drop)│   │
│  ⠿ 3. 🏠 123 Maple St     │  │ Liam T. · Pine · Stop 2 (pickup) + 4(drop)│  │
│        DROPOFF  ETA 3:50pm │  │ [+ Assign Child to Route]                │   │
│        Ava R.              │  └──────────────────────────────────────────┘   │
│                            │                                                  │
│  ⠿ 4. 🏠 45 Oak Ave        │                                                  │
│        DROPOFF  ETA 4:05pm │                                                  │
│        Liam T.             │                                                  │
│                            │                                                  │
│  [+ Add Stop]              │                                                  │
└────────────────────────────┴─────────────────────────────────────────────────┘
```

---

#### Screen: Daily Attendance & Exceptions (`/attendance`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Daily Attendance — Mon May 4, 2026          [← Prev Day]  [Next Day →]     │
├──────────────────────────────────────────────────────────────────────────────┤
│  Route A (Van 1 · John Smith)                                                │
├──────────┬─────────────┬───────────────────────┬───────────────┬────────────┤
│  Child   │ School      │ Status                │ Pickup        │ Dropoff    │
├──────────┼─────────────┼───────────────────────┼───────────────┼────────────┤
│ Ava R.   │ Oak Elem    │ ✅ Transported         │ 3:22 PM       │ 3:51 PM   │
│ Mia K.   │ Oak Elem    │ 👨 Parent Pickup Early │ —             │ —         │
│ Liam T.  │ Pine Elem   │ ✅ Transported         │ 3:38 PM       │ 4:07 PM   │
│ Noah P.  │ Pine Elem   │ 🏠 No School Today     │ —             │ —         │
│  …       │             │ [Change Status ▾]      │               │            │
├──────────┴─────────────┴───────────────────────┴───────────────┴────────────┤
│  Route B (Bus A · Maria Garcia)                                              │
│  …                                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

#### Screen: Reports (`/reports`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Reports                                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  Report Type: [Weekly Transportation ▾]                                      │
│  Week:        [Apr 28 – May 2, 2026 ▾]                                      │
│  Routes:      [All ▾]                                                        │
│                                                                              │
│  [Generate Preview]  [Export PDF]  [Export Excel]                            │
├──────────────────────────────────────────────────────────────────────────────┤
│  OTHER REPORTS                                                               │
│  • Driver Certification Expiry Report                                        │
│  • Vehicle Maintenance / Insurance Expiry                                    │
│  • Monthly Trip Summary                                                      │
│  • On-Time Performance by Route                                              │
│  • Exception / Incident Log                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 Driver Mobile App (PWA or React Native)

---

#### Screen: Driver Home (`/driver`)

```
┌───────────────────────────┐
│  Good afternoon, John! 👋 │
│  Mon May 4, 2026          │
├───────────────────────────┤
│  YOUR ASSIGNMENT TODAY    │
│  ┌───────────────────────┐│
│  │ 🚐 Route A — Van 1    ││
│  │ Starts: 3:00 PM       ││
│  │ 8 children · 6 stops  ││
│  └───────────────────────┘│
│                           │
│  [▶ START ROUTE]          │
│                           │
│  ┌───────────────────────┐│
│  │ ⚠ NOTES               ││
│  │ Ava R: booster seat   ││
│  │ Liam T: front entry   ││
│  └───────────────────────┘│
└───────────────────────────┘
```

---

#### Screen: Active Route / Stop Navigation

```
┌───────────────────────────┐
│  ← Route A  Stop 1 of 6  │
├───────────────────────────┤
│  🏫 OAK ELEMENTARY        │
│  PICKUP · ETA 3:20 PM     │
│                           │
│  [MAP STRIP — shows route]│
│                           │
│  CHILDREN AT THIS STOP    │
│  ┌───────────────────────┐│
│  │ 👧 Ava Rodriguez      ││
│  │    ⚠ Booster seat     ││
│  │    [✅ Picked Up]      ││
│  ├───────────────────────┤│
│  │ 👦 Mia Kim            ││
│  │    [✅ Picked Up]      ││
│  │    [👨 Parent Pickup]  ││
│  │    [❌ Absent]         ││
│  └───────────────────────┘│
│                           │
│  [📷 Photo Confirm]       │
│  [⚠ Report Issue]        │
│                           │
│  [ARRIVED ✓]  [NEXT STOP →]│
└───────────────────────────┘
```

---

#### Screen: Mark Exception (modal)

```
┌───────────────────────────┐
│  Exception for Ava R.     │
│  ─────────────────────    │
│  ○ Transported (default)  │
│  ○ Parent Pickup Early    │
│  ○ No School Today        │
│  ○ Child Absent           │
│  ○ Sick                   │
│  ○ Vacation               │
│  ○ Other                  │
│                           │
│  Notes: [____________]    │
│                           │
│  [Cancel]  [Save]         │
└───────────────────────────┘
```

---

## 3. Key API Endpoints

All endpoints under `/api/v1`. Authentication via JWT (Bearer token). Role-based guards noted.

### 3.1 Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Email + password → JWT |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Revoke refresh token |

---

### 3.2 Children

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/children` | Admin, Office | List all children (paginated, filterable) |
| POST | `/children` | Admin, Office | Create child record |
| GET | `/children/:id` | Admin, Office, Driver* | Get child detail |
| PATCH | `/children/:id` | Admin, Office | Update child |
| DELETE | `/children/:id` | Admin | Soft-delete (set active=false) |
| GET | `/children/:id/attendance` | Admin, Office | Attendance history with filters |

\* Drivers only see children on their assigned route.

---

### 3.3 Schools

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/schools` | All | List schools |
| POST | `/schools` | Admin | Create school |
| PATCH | `/schools/:id` | Admin | Update school |

---

### 3.4 Vehicles

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/vehicles` | Admin, Office | List vehicles |
| POST | `/vehicles` | Admin | Create vehicle |
| PATCH | `/vehicles/:id` | Admin | Update (status, mileage, notes) |
| GET | `/vehicles/expiring` | Admin | Vehicles with insurance/maintenance due |

---

### 3.5 Drivers

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/drivers` | Admin, Office | List drivers |
| POST | `/drivers` | Admin | Create driver + linked User account |
| PATCH | `/drivers/:id` | Admin | Update driver |
| GET | `/drivers/expiring` | Admin | Drivers with cert/license expiring soon |
| GET | `/drivers/:id/location` | Admin, Office | Last known GPS position |

---

### 3.6 Routes

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/routes` | Admin, Office | List routes |
| POST | `/routes` | Admin | Create route |
| PATCH | `/routes/:id` | Admin | Update route (driver, vehicle, days) |
| GET | `/routes/:id/stops` | All | Ordered stop list |
| POST | `/routes/:id/stops` | Admin | Add stop |
| PATCH | `/routes/:id/stops/reorder` | Admin | Reorder stops (body: `[{stopId, sequence}]`) |
| DELETE | `/routes/:id/stops/:stopId` | Admin | Remove stop |
| POST | `/routes/:id/optimize` | Admin | Trigger optimization, returns suggested order |
| POST | `/routes/:id/children` | Admin | Assign child to route |
| DELETE | `/routes/:id/children/:childId` | Admin | Remove child from route |

---

### 3.7 Trips

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/trips` | Admin, Office | List trips (by date, route) |
| POST | `/trips/generate` | Admin, Office | Generate today's trip instances from routes |
| GET | `/trips/:id` | Admin, Office, Driver | Trip detail with stops |
| PATCH | `/trips/:id/status` | Driver, Admin | Update trip status |
| POST | `/trips/:id/stops/:stopId/arrive` | Driver | Mark arrived at stop (`{ arrivedAt }`) |
| POST | `/trips/:id/stops/:stopId/children/:childId/pickup` | Driver | Record pickup (`{ pickedUpAt }`) |
| POST | `/trips/:id/stops/:stopId/children/:childId/dropoff` | Driver | Record dropoff (`{ droppedOffAt }`) |
| POST | `/trips/:id/incidents` | Driver | Log issue/delay |

---

### 3.8 Attendance / Exceptions

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/attendance` | Admin, Office | List attendance (date, childId filters) |
| POST | `/attendance` | Admin, Office, Driver | Create/update daily exception |
| PATCH | `/attendance/:id` | Admin, Office, Driver | Update status or notes |
| GET | `/attendance/weekly` | Admin, Office | Weekly view per child |

---

### 3.9 Driver Location (GPS)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/location` | Driver | Push current GPS ping (called every 15-30s while trip active) |
| GET | `/location/live` | Admin, Office | SSE stream of all active driver locations |
| GET | `/location/:driverId/trail` | Admin | Historical trail for a trip |

---

### 3.10 Notifications

| Method | Path | Description |
|--------|------|-------------|
| POST | `/notifications/send` | Internal — send SMS/email via Twilio/SendGrid |
| GET | `/notifications` | Admin — notification log |

---

### 3.11 Reports

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/reports/weekly` | Admin, Office | Weekly transportation report (JSON) |
| GET | `/reports/weekly/pdf` | Admin, Office | PDF export (Puppeteer/React-PDF) |
| GET | `/reports/weekly/xlsx` | Admin, Office | Excel export (ExcelJS) |
| GET | `/reports/summary` | Admin | Monthly stats: trips, on-time %, exceptions |

---

### 3.12 Webhooks / Real-time

- **WebSocket / SSE** at `/api/v1/location/live` for live driver positions on the dashboard map.
- Driver app sends GPS pings via `POST /location` every 20 seconds while a trip is `IN_PROGRESS`.

---

## 4. Route Optimization Approach

### Problem

Given a set of schools (each with a fixed dismissal time and GPS location) and a set of child home addresses (drop-off destinations), find the optimal ordered stop sequence for a driver that:

1. Arrives at each school **no earlier than its dismissal time** (children must be ready).
2. Minimizes **total route duration** (travel time + waiting).
3. Respects **vehicle capacity** at all times.
4. Groups children from the same school into a **single pickup stop**.

---

### Algorithm: Constrained Time-Window VRP (simplified)

**Step 1 — Cluster by school**

Group children by their assigned school. Each school becomes one `PICKUP` stop. All pickups happen before any home drop-offs (standard daycare pattern).

**Step 2 — School pickup order**

If multiple schools are on the route, sequence school pickups using earliest-dismissal-time-first, then nearest-neighbor for tie-breaking. A school with dismissal at 2:45 PM must be visited before one at 3:15 PM.

```
pickupStops.sort((a, b) => {
  if (a.dismissalTime !== b.dismissalTime) return a.dismissalTime - b.dismissalTime;
  return distanceTo(currentPos, a) - distanceTo(currentPos, b);
})
```

**Step 3 — Home drop-off TSP**

After all school pickups are complete (or interleaved if dismissal windows allow), solve the Traveling Salesman Problem on the home drop-off locations.

For ≤ 20 drop-offs: use **nearest-neighbor heuristic** with 2-opt improvement. This runs in O(n²) and completes in < 100ms.

```
function nearestNeighborTSP(stops, startPoint):
  route = [startPoint]
  remaining = [...stops]
  while remaining.length > 0:
    nearest = argmin(remaining, s => haversine(last(route), s))
    route.push(nearest)
    remaining.remove(nearest)
  return route
```

Apply **2-opt swaps** until no improvement:
```
for i in range(1, n-1):
  for j in range(i+1, n):
    if distance(route[i-1]→route[j]) + distance(route[i]→route[j+1])
       < distance(route[i-1]→route[i]) + distance(route[j]→route[j+1]):
      route[i..j] = reverse(route[i..j])
```

**Step 4 — Travel time from Mapbox Directions API**

After computing the candidate order, call **Mapbox Matrix API** to get real driving times between all stop pairs (accounts for traffic, road network). Re-rank if the matrix reveals a significantly better order than Euclidean distance suggested.

**Step 5 — ETA calculation**

Starting from `routeDepartureTime` (typically school dismissal time of first school):
```
stop[0].eta = dismissalTime[firstSchool]
stop[i].eta = stop[i-1].eta + travelTime(stop[i-1], stop[i]) + dwellTime (2 min default)
```

**Step 6 — Capacity check**

After ordering: verify `childrenOnVehicle` never exceeds `vehicle.capacity` at any point in the route. If exceeded, flag to admin.

**Step 7 — Manual override**

Admin or office staff can drag-and-drop stops to manually reorder after optimization. The system recalculates ETAs in real time using the Mapbox Matrix API when stops are reordered.

### API Call

```
POST /api/v1/routes/:id/optimize
→ { suggestedStops: [{ stopId, sequence, estimatedTime }] }

Admin accepts → PATCH /routes/:id/stops/reorder
```

---

## 5. Sample Weekly Report Layout

### Header Section

```
╔══════════════════════════════════════════════════════════════════════════════╗
║        WEEKLY TRANSPORTATION REPORT — Sunshine Daycare Center              ║
║        Week of: April 28 – May 2, 2026                                     ║
║        Route(s): All                                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Main Table

| Child's Name | School | Mon 4/28 Pickup / Drop-off | Tue 4/29 Pickup / Drop-off | Wed 4/30 Pickup / Drop-off | Thu 5/1 Pickup / Drop-off | Fri 5/2 Pickup / Drop-off | Dismissal Time | Guardian Name | Guardian Phone |
|---|---|---|---|---|---|---|---|---|---|
| Ava Rodriguez | Oak Elementary | 3:22 / 3:51 | 3:20 / 3:49 | Parent Pickup | 3:24 / 3:52 | 3:21 / 3:50 | 3:15 PM | Sarah Rodriguez | (555) 201-1234 |
| Liam Torres | Pine Elementary | 3:38 / 4:07 | 3:40 / 4:09 | 3:37 / 4:05 | No School | 3:39 / 4:08 | 3:30 PM | Mike Torres | (555) 341-5678 |
| Mia Kim | Oak Elementary | Absent | 3:22 / 3:50 | 3:20 / 3:49 | 3:23 / 3:51 | 3:22 / 3:50 | 3:15 PM | Jin Kim | (555) 512-9090 |
| Noah Patel | Pine Elementary | 3:39 / 4:10 | 3:38 / 4:08 | 3:40 / 4:11 | 3:37 / 4:09 | No School | 3:30 PM | Priya Patel | (555) 678-3421 |

**Status codes used in cells:**

| Code | Meaning |
|------|---------|
| `HH:MM / HH:MM` | Pickup time / Drop-off time |
| `Parent Pickup` | Parent collected child from school directly |
| `No School` | School holiday or teacher in-service day |
| `Absent` | Child absent from daycare |
| `Sick` | Child sick |
| `Vacation` | Family vacation |
| `—` | Not scheduled on this route/day |

---

### Summary Statistics Section

```
┌─────────────────────────────────────────────────────────────────┐
│  WEEK SUMMARY                                                   │
├──────────────────────────────┬──────────────────────────────────┤
│  Total Trips Completed       │  10 (5 days × 2 routes)          │
│  Total Children Transported  │  62 child-trips                  │
│  On-Time Rate (≤ 10 min)     │  94.3%                           │
│  Average Pickup Delay        │  2.1 minutes                     │
├──────────────────────────────┼──────────────────────────────────┤
│  Exceptions This Week        │  9 total                         │
│    Parent Early Pickups      │  3                               │
│    No School                 │  4                               │
│    Absent / Sick             │  2                               │
├──────────────────────────────┼──────────────────────────────────┤
│  Vehicle Usage               │  Van 1: 5 trips, Bus A: 5 trips  │
│  Total Miles Driven          │  Van 1: 87 mi,  Bus A: 94 mi     │
├──────────────────────────────┼──────────────────────────────────┤
│  Drivers                     │  John Smith (Route A)            │
│                              │  Maria Garcia (Route B)          │
└──────────────────────────────┴──────────────────────────────────┘
```

### Footer

```
Generated: 2026-05-04 08:32 AM by Admin · Sunshine Daycare Center
Contact: admin@sunshinedc.com · (555) 100-2000
Confidential — contains children's personal information
```

---

## 6. Security, Compliance & Data Privacy

### 6.1 FERPA / COPPA Considerations

- Children's records (name, photo, address, school, health notes) are **PII** and potentially subject to FERPA (educational records) and state privacy laws.
- Photos of children must be stored in **private, access-controlled object storage** (Supabase Storage with signed URLs; URLs expire after 1 hour).
- No children's data is shared with third parties except Twilio (for parent SMS) and Mapbox (coordinates only, no names).
- Mapbox API calls send **coordinates only**, never linked to child names.

### 6.2 Authentication & Authorization

```
Role        | Children | Drivers | Routes | Trips | Reports | Admin
────────────┼──────────┼─────────┼────────┼───────┼─────────┼──────
ADMIN       |  Full    |  Full   |  Full  | Full  |  Full   | Full
OFFICE_STAFF|  Full    |  Read   |  Full  | Full  |  Read   | None
DRIVER      | Own route|  Self   |  Own   | Own   |  None   | None
```

- JWT access tokens: 15-minute expiry.
- Refresh tokens: 7-day expiry, stored in `HttpOnly` cookie.
- All role checks enforced server-side (never trust client role claims).
- Drivers can only see children assigned to their current route for the current day.

### 6.3 Data Encryption

- **At rest**: PostgreSQL encryption (Supabase provides this by default with AES-256).
- **In transit**: TLS 1.3 enforced on all API endpoints. HSTS headers set.
- **Sensitive fields** (license numbers, background check status): encrypted at the application layer using AES-256-GCM before writing to DB, decrypted on read with keys stored in environment secrets (not in DB).

### 6.4 Audit Logging

Every `CREATE`, `UPDATE`, `DELETE` on any entity writes an `AuditLog` record containing:
- Who performed the action (userId, role)
- What changed (JSON diff of before/after)
- When (timestamp)
- From where (IP address, user agent)

Audit logs are **append-only** — no `UPDATE` or `DELETE` permitted on the `AuditLog` table (enforced via DB-level trigger and Prisma middleware).

### 6.5 Parent Notification Privacy

- SMS sent via Twilio uses a **daycare-owned number** (not driver's personal number).
- SMS content never includes child's full name — uses first name only (e.g., "Ava has been dropped off safely at home").
- Parents must opt-in to SMS at enrollment.
- Email notifications use SendGrid with unsubscribe links.

### 6.6 GPS & Driver Tracking

- GPS tracking is **only active when a trip is `IN_PROGRESS`**.
- Driver location data is retained for **30 days** then automatically purged (cron job).
- Drivers are informed via app that location is being shared during active trips.
- Location data is never sold or shared with third parties.

### 6.7 API Security

- Rate limiting: 100 req/min per IP on public endpoints; 500 req/min per authenticated user.
- Input validation: Zod schemas on all request bodies.
- SQL injection: prevented by Prisma's parameterized queries.
- XSS: all output encoded; `Content-Security-Policy` headers set.
- CORS: locked to specific origin domains (no wildcard).
- Helmet.js for HTTP security headers.
- File uploads (photos): validated for MIME type and max size (2MB); scanned via ClamAV or equivalent.

### 6.8 Data Retention

| Data Type | Retention |
|-----------|-----------|
| Trip logs, attendance records | 3 years |
| Driver GPS location pings | 30 days |
| Audit logs | 7 years |
| Notification logs | 1 year |
| Soft-deleted child records | 1 year after deactivation, then hard-delete |
| Driver license / cert docs | Duration of employment + 2 years |

### 6.9 Incident Response

- Any data breach must be reported to affected parents within 72 hours per applicable state law.
- Breach notification template stored in `/docs/breach-notification-template.md`.
- Quarterly security review of all expiring driver certs and vehicle insurance.

---

## 7. Tech Stack & Project Structure

### Stack

| Layer | Technology |
|-------|------------|
| Frontend (Web) | Next.js 14 (App Router) · TypeScript · Tailwind CSS |
| Frontend (Mobile Driver App) | PWA (same Next.js codebase) or React Native (Expo) |
| Backend API | Next.js Route Handlers or separate Express/Fastify API |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 5 |
| Auth | NextAuth.js v5 (JWT strategy) |
| Maps | Mapbox GL JS (web) · react-map-gl |
| Route Optimization | Custom TSP (in-house) + Mapbox Matrix API |
| SMS Notifications | Twilio |
| Email Notifications | SendGrid / Resend |
| Real-time GPS | Server-Sent Events (SSE) or Supabase Realtime |
| PDF Export | React-PDF or Puppeteer |
| Excel Export | ExcelJS |
| File Storage | Supabase Storage |
| Deployment | Vercel (web) + Supabase (DB + storage) |
| CI/CD | GitHub Actions |

### Suggested Project Structure

```
daycare-trans-app/
├── app/                          # Next.js App Router
│   ├── (admin)/                  # Admin/Office pages
│   │   ├── dashboard/
│   │   ├── children/
│   │   ├── routes/
│   │   ├── drivers/
│   │   ├── vehicles/
│   │   ├── attendance/
│   │   └── reports/
│   ├── (driver)/                 # Driver mobile UI
│   │   ├── home/
│   │   └── route/
│   └── api/v1/                   # API Route Handlers
│       ├── auth/
│       ├── children/
│       ├── schools/
│       ├── vehicles/
│       ├── drivers/
│       ├── routes/
│       ├── trips/
│       ├── attendance/
│       ├── location/
│       ├── notifications/
│       └── reports/
├── components/
│   ├── map/                      # Mapbox components
│   ├── forms/                    # Child/Driver/Route forms
│   ├── driver/                   # Driver-specific components
│   └── reports/                  # Report preview & export
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth.ts                   # NextAuth config
│   ├── optimization/             # TSP + Mapbox Matrix
│   │   ├── nearest-neighbor.ts
│   │   ├── two-opt.ts
│   │   └── mapbox-matrix.ts
│   ├── notifications/
│   │   ├── sms.ts                # Twilio
│   │   └── email.ts              # SendGrid
│   └── audit.ts                  # Audit log middleware
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── docs/
    └── breach-notification-template.md
```

---

*End of Specification — DaycareTransApp v1.0*
