# Documentation Map

This map illustrates the relationships between the Shell Features Audit and the project codebase.

```mermaid
graph TD
    Audit[SHELL_FEATURES_AUDIT.md] --> Global[Global UI]
    Audit --> Commerce[Commerce Flow]
    Audit --> User[User System]
    Audit --> Admin[Admin System]

    Global --> Header[Notifications/Header]
    Global --> Footer[Newsletter/Links]

    Commerce --> Home[Home Carousel]
    Commerce --> PLP[Filters/Sorting]
    Commerce --> PDP[Details/Reviews]
    Commerce --> Cart[Checkout Process]

    User --> Dashboard[Rewards/History]
    User --> Profile[Birth Data/Preferences]
    User --> Consultation[Booking Flow]

    Admin --> Custom[Custom Admin (pages/Admin)]
    Admin --> Refine[Refine Admin (/admin)]

    subgraph Database
        DB_Tables[(Supabase Tables)]
        Consultation --> DB_Tables
        Commerce --> DB_Tables
        User --> DB_Tables
    end

    style Audit fill:#f9f,stroke:#333,stroke-width:4px
```
