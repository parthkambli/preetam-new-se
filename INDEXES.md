# Database Indexes Documentation

This document lists all MongoDB indexes created for optimizing query performance.

## How to Create Indexes

Run the following command to create all indexes:

```bash
npm run create-indexes
```

## Indexes by Collection

### 1. SchoolAdmission

| Index | Fields | Purpose |
|-------|--------|---------|
| 1 | `{ organizationId: 1, status: 1 }` | Filter admissions by organization and status |
| 2 | `{ organizationId: 1, feePlan: 1 }` | Filter by fee plan (Daily/Monthly/Quarterly) |
| 3 | `{ organizationId: 1, paymentStatus: 1 }` | Filter by payment status |
| 4 | `{ mobile: 1 }` | Quick lookup by mobile number |
| 5 | `{ fullName: 'text' }` | Full-text search on name |
| 6 | `{ createdAt: -1 }` | Sort by creation date (newest first) |
| 7 | `{ loginMobile: 1 }` | Login authentication *(auto from unique: true)* |
| 8 | `{ admissionId: 1 }` | Search by admission ID *(auto from unique: true)* |

### 2. SchoolEnquiry

| Index | Fields | Purpose |
|-------|--------|---------|
| 1 | `{ organizationId: 1, status: 1 }` | Filter enquiries by status (New/Follow-up/Converted) |
| 2 | `{ organizationId: 1, source: 1 }` | Filter by source (Walk-in/App/Call/etc) |
| 3 | `{ organizationId: 1, date: -1 }` | Sort by enquiry date |
| 4 | `{ contact: 1 }` | Search by contact number |
| 5 | `{ name: 'text' }` | Full-text search on name |
| 6 | `{ createdAt: -1 }` | Sort by creation date |

### 3. FitnessEnquiry

| Index | Fields | Purpose |
|-------|--------|---------|
| 1 | `{ organizationId: 1, status: 1 }` | Filter enquiries by status |
| 2 | `{ organizationId: 1, source: 1 }` | Filter by source |
| 3 | `{ organizationId: 1, enquiryDate: -1 }` | Sort by enquiry date |
| 4 | `{ mobile: 1 }` | Search by mobile number |
| 5 | `{ fullName: 'text' }` | Full-text search on name |
| 6 | `{ createdAt: -1 }` | Sort by creation date |

### 4. Followup

| Index | Fields | Purpose |
|-------|--------|---------|
| 1 | `{ organizationId: 1, newStatus: 1 }` | Filter followups by status |
| 2 | `{ organizationId: 1, followupDate: -1 }` | Sort by followup date |
| 3 | `{ organizationId: 1, nextVisit: 1 }` | Filter by next visit date (upcoming) |
| 4 | `{ organizationId: 1, enquiryType: 1 }` | Filter by type (school/fitness) |
| 5 | `{ mobile: 1 }` | Search by mobile |
| 6 | `{ personName: 'text' }` | Full-text search on person name |
| 7 | `{ enquiryId: 1 }` | Link to original enquiry |

### 5. Student

| Index | Fields | Purpose |
|-------|--------|---------|
| 1 | `{ organizationId: 1, status: 1 }` | Filter students by status |
| 2 | `{ organizationId: 1, feePlan: 1 }` | Filter by fee plan |
| 3 | `{ mobile: 1 }` | Search by mobile |
| 4 | `{ fullName: 'text' }` | Full-text search on name |
| 5 | `{ createdAt: -1 }` | Sort by creation date |
| 6 | `{ studentId: 1 }` | Search by student ID *(auto from unique: true)* |
| 7 | `{ admissionId: 1 }` | Link to admission record *(auto from unique: true)* |

### 6. User

| Index | Fields | Purpose |
|-------|--------|---------|
| 1 | `{ organizationId: 1, role: 1 }` | Filter by organization and role |
| 2 | `{ organizationId: 1, userType: 1 }` | Filter by user type (school/fitness) |
| 3 | `{ linkedId: 1 }` | Link to Student/Admission record |
| 4 | `{ userId: 1 }` | Login by userId *(auto from unique: true)* |
| 5 | `{ mobile: 1 }` | Search by mobile *(auto from unique: true)* |

## Index Types Used

### Single Field Index
```javascript
schema.index({ fieldName: 1 });  // Ascending
schema.index({ fieldName: -1 }); // Descending
```

### Compound Index
```javascript
schema.index({ organizationId: 1, status: 1 });
```
- Order matters: `{ organizationId: 1, status: 1 }` can be used for queries with:
  - `organizationId` only
  - `organizationId` + `status`
  - But NOT `status` only

### Text Index
```javascript
schema.index({ fullName: 'text' });
```
- Enables full-text search
- Use with `$text` and `$search` operators

## Best Practices Followed

1. **Organization First**: All multi-collection queries start with `organizationId` for data isolation
2. **High Cardinality First**: In compound indexes, fields with more unique values come first
3. **Query Pattern Matching**: Indexes match common query patterns in routes
4. **Sort Optimization**: Indexes include sort fields to avoid in-memory sorting
5. **Text Search**: Full-text indexes on name fields for search functionality

## Monitoring Index Usage

To check index usage in MongoDB:

```javascript
// Check index statistics
db.collection.aggregate([{ $indexStats: {} }]);

// Check query execution plan
db.collection.find({ organizationId: "org1", status: "Active" }).explain("executionStats");
```

## Performance Benefits

- **Faster Queries**: Indexes reduce scan from O(n) to O(log n)
- **Efficient Filtering**: Compound indexes optimize multi-field filters
- **Better Sorting**: Pre-sorted indexes avoid expensive sort operations
- **Text Search**: Full-text indexes enable fast name lookups
- **34 total indexes** across 6 collections (including auto-created unique indexes)

## Notes

- Indexes are created automatically on first run
- Existing data will be indexed in the background
- New documents are indexed automatically
- Unique constraints (mobile, userId) also create indexes
