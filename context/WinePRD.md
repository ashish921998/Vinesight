Product Requirements Document (PRD)
VineSight – Winery Management Module (GTM Version)

Product Name: VineSight – Winery OS (Make Module)
Owner: Ashish Huddar
Product Type: Cloud-based Web App + Mobile-first PWA
Target Customers:
International wineries currently using Innovint, Vintrace, or Process2Wine

1. Product Objective

The objective of this module is to enable VineSight to onboard real wineries as paying customers by solving the core daily operational problems that existing winery software already solves — but with:

Lower friction

Faster workflows

Better mobile usability

Strong vineyard → winery continuity

This module must be good enough to replace spreadsheets and daily cellar usage and credible enough to run in parallel with incumbent software, with a clear path to full replacement.

2. Product Positioning (GTM Lens)

VineSight Winery Module is positioned as:

A mobile-first, modern winery operations system that connects vineyard data directly to cellar execution — without the bloat and complexity of legacy winery ERPs.

Key positioning principles:

Operational clarity over feature breadth

Daily usability over compliance perfection

Speed of data entry over exhaustive configuration

3. Non-Goals (Explicit)

The following are intentionally out of scope for the GTM version:

Full automated regulatory filing (TTB submission UI)

Accounting, invoicing, or payments

Advanced sensor/IoT integrations

3D cellar visualizations

AI-driven fermentation prediction

Marketplace or supplier ordering

These may be added later but must not block customer onboarding.

4. Core User Personas
   4.1 Winemaker

Owns production decisions

Needs clarity on fermentation, tanks, blends, and compliance readiness

4.2 Cellar Manager / Cellar Hand

Executes daily work orders

Needs mobile-first task clarity and quick data entry

4.3 Winery Owner / Operator

Needs confidence in traceability, inventory, and audit readiness

Wants lower software cost and less overhead

5. Core Problems to Solve

This module must allow users to answer, at any moment:

What is fermenting right now?

Which tanks and barrels are occupied or free?

What tasks need to be done today?

Where did this wine come from (vineyard → lot → tank)?

Do we have enough supplies?

Can we export production data for compliance or audits?

If a feature does not help answer one of these questions, it is out of scope for GTM.

6. Core Data Model (Foundational)

The following entities must exist and be relationally correct:

Winery

Vintage

Vineyard Block (reuse existing VineSight farm/block entities)

Harvest Lot

Wine Lot

Tank

Barrel

Work Order

Inventory Item

Lab Reading

User (with roles)

These entities must support:

Full audit trails

Timestamped actions

Lot genealogy (traceability)

7. Feature Scope – GTM Winery Module
   7.1 Harvest & Lot Management

Purpose: Entry point for all winery operations.

Functional Requirements

Create Harvest Lots with:

Vineyard block

Variety

Harvest date

Weight/volume

Initial chemistry (optional)

Convert Harvest Lot → Wine Lot

Maintain vineyard → wine traceability automatically

Support lot status lifecycle (harvested, fermenting, aging, bottled)

Success Criteria

Winemaker can create a usable lot in under a minute

Lot is traceable back to vineyard data

7.2 Tank & Barrel Management

Purpose: Capacity planning and operational visibility.

Functional Requirements

Create and manage tanks with:

Capacity

Current volume

Status (empty / in use)

Create and manage barrels with:

Size

Fill status

Assigned lot

Assign and move lots between tanks/barrels

Automatically update volumes and availability

UX Requirements

Clear status indicators

Zero ambiguity about availability

Mobile-friendly list view

7.3 Fermentation Tracking (Manual First)

Purpose: Replace spreadsheets and notebooks.

Functional Requirements

Record fermentation readings:

Brix / SG

Temperature

pH

Timestamp

Display fermentation curves per lot

Basic rule-based alerts:

Missing readings

Stalled fermentation indicators

Explicit Constraint

No IoT or sensor dependency required

7.4 Work Orders & Cellar Tasks

Purpose: Drive daily engagement and operational adoption.

Functional Requirements

Create work orders linked to:

Wine lot

Tank or barrel

Common task types:

Crush

Punch down

Pump over

Racking

SO₂ addition

Blending

Bottling

Assign to users

Simple status tracking: Pending / Completed

One-tap “Mark Done” on mobile

Success Criteria

Cellar staff can operate entirely from mobile

Work orders become the daily entry point into the app

7.5 Inventory Management (Simplified)

Purpose: Prevent operational failures due to missing supplies.

Functional Requirements

Inventory categories:

Yeast

Chemicals (SO₂, nutrients)

Barrels

Bottles / packaging

Manual stock entry

Automatic deduction when linked work orders complete

Low-stock alerts

Explicit Constraint

No vendor, purchasing, or accounting logic

7.6 Compliance-Ready Data & Exports

Purpose: Build trust and audit confidence.

Functional Requirements

Exportable datasets:

Lot movements

Volume changes

Production summaries

CSV format compatible with:

US TTB reporting workflows

Immutable audit trail:

Who did what

When

On which lot/container

Explicit Constraint

Export-only, no regulatory UI automation

8. Vineyard → Winery Differentiation

VineSight must explicitly connect:

Soil & petiole data

Vineyard activities

Harvest decisions

to:

Fermentation behavior

Wine lot performance

Vintage outcomes

This is not required for GTM workflows but must be structurally supported in the data model and UI navigation.

9. GTM Strategy (Product-Led)
   9.1 Target Entry Strategy

Onboard wineries as:

Parallel system (alongside Innovint/Vintrace)

Spreadsheet replacement

Allow CSV import for:

Lots

Inventory

Tanks

9.2 Sales Motion

Founder-led onboarding

White-glove setup

Direct feedback loop into product iteration

9.3 Core Pitch

“VineSight replaces daily cellar spreadsheets and gives you vineyard-to-wine traceability in one fast, mobile-first system.”

10. Pricing Philosophy (Early)

Simple, transparent pricing

No per-user penalties

Modular expansion later

Pricing must reinforce:

Lower friction vs incumbents

Faster ROI for small-to-mid wineries

11. Success Metrics (Qualitative + Quantitative)
    Product Success

Winery logs in daily

Work orders used instead of paper/spreadsheets

Fermentation data recorded consistently

Business Success

At least one winery runs production fully in VineSight

At least one winery reduces dependency on incumbent software

12. Strategic Constraint (Very Important)

Every feature added must satisfy at least one of:

Improves daily winery operations

Reduces friction vs existing tools

Strengthens vineyard → winery continuity

If not, it does not belong in this PRD.

13. Long-Term Vision (Not for GTM Execution)

Eventually, VineSight becomes:

A full vineyard + winery OS

With AI-driven quality, yield, and fermentation intelligence

And regulatory, financial, and supply chain automation

But this PRD exists solely to get customers now.
