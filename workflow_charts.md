# FMF Management System Workflows

This document outlines the core workflows within the FMF Trust Management System based on the project requirements.

## 1. Volunteer Registration & Onboarding Pipeline

The volunteer onboarding process is a multi-step pipeline. A candidate must pass through 5 stages to gain access to the Volunteer Portal. They can be rejected at any stage (with a reason logged), and the record is retained for audit purposes.

```mermaid
stateDiagram-v2
    direction TB
    [*] --> Application: Submission
    
    state "1. Application" as Application
    state "2. ID/Doc Verification" as Verification
    state "3. Interview" as Interview
    state "4. Training" as Training
    state "5. Approved" as Approved
    
    Application --> Verification: Passed
    Application --> Rejected: Failed
    
    Verification --> Interview: Verified by Program Admin
    Verification --> Rejected: Failed
    
    Interview --> Training: Interview Cleared
    Interview --> Rejected: Failed
    
    Training --> Approved: Sessions Completed
    Training --> Rejected: Failed
    
    Approved --> [*]: Account Auto-Created\n& Invite Email Sent
    Rejected --> [*]: Record Retained in DB
```

## 2. Donation & 80G Receipt Generation Flow

When the Finance Admin enters a donation, the system handles receipt numbering and PDF generation automatically by pulling dynamic data from the Organization Settings.

```mermaid
flowchart TD
    A[Finance Admin Enters Donation Details] --> B{Linked to existing Donor?}
    B -- No --> C[Create New Donor Profile]
    B -- Yes --> D[Link to Existing Donor]
    C --> D
    
    D --> E[Assign Sequential Receipt No.]
    E --> F[Fetch Legal Info from Org Settings]
    F --> G[Generate 80G PDF Receipt]
    
    G --> H{Email Enabled?}
    H -- Yes --> I[Send PDF via Email Provider]
    H -- No --> J[Admin Downloads/Prints PDF]
    
    I --> K([Donation Complete])
    J --> K
```

## 3. Meeting Minutes Lifecycle

Meeting minutes undergo a strict state lifecycle to ensure governance and integrity. Once finalized, the core minutes cannot be altered.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Draft: Meeting Created
    Draft --> UnderReview: Submit for Review
    UnderReview --> Draft: Revisions Needed
    UnderReview --> Finalized: Approved by Sec/Admin
    Finalized --> Locked: Core Content Locked
    Locked --> Addendum: Add Later Notes
    Addendum --> Locked
```

## 4. User Access & Role Distribution Workflow

The system is split between two portals. Based on authentication and role, users are routed to their respective areas and restricted to specific modules.

```mermaid
flowchart TD
    User([System User]) --> Login{Authentication}
    
    Login -- "Admin Role" --> Admin[Admin Portal]
    Login -- "Volunteer Role" --> Vol[Volunteer Portal]
    
    Admin --> SA["Super Admin\n(Full Access, Settings, Users)"]
    Admin --> PA["Program Admin\n(Members, Vols, Events)"]
    Admin --> FA["Finance Admin\n(Donations, 80G PDF)"]
    Admin --> CS["Committee Sec\n(Meetings, Committees)"]
    Admin --> DE["Data Entry\n(Add/Edit Members/Vols)"]
    Admin --> AU["Auditor\n(View-only everything)"]
    
    Vol --> Profile["Update Own Profile"]
    Vol --> Hours["Log Volunteer Hours"]
    Vol --> Events["View Assigned Events"]
```
