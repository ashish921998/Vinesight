# VineSight

VineSight has two user-facing modules sharing one backend: the **Farmer** module
(self-service record-keeping for grape growers) and the **Consultant** module
(advisory organizations that access and advise farmers). This glossary defines the
language shared across both.

## Organization & Access

**Organization**:
An advisory business whose Members manage and advise Farmers.
_Avoid_: company, agency, consultancy, firm

**Member** (Organization Member):
A user who belongs to an Organization under exactly one role — Owner, Admin, or Agronomist.
_Avoid_: staff, consultant, team member

**Owner**:
The Member who created the Organization; full control, sees all of the org's Farmers.
_Avoid_: superadmin

**Admin**:
A Member who can enrol Farmers, invite Members, and assign Farmers; sees all of the org's Farmers.
_Avoid_: manager

**Agronomist**:
A Member who can access only the Farmers explicitly assigned to them.
_Avoid_: consultant, advisor, expert

**Client** (Organization Client):
The enrolment relationship between a Farmer and an Organization — a Farmer as advised by
that org. A Farmer must be enrolled as a Client before they can be assigned.
_Avoid_: customer, account

**Assignment**:
The link from a Client to a single Agronomist, created by an Owner or Admin. Determines which
Farmers an Agronomist can access.
_Avoid_: mapping, allocation

**Join code**:
The Organization's public code a Farmer enters in the app to self-join as a Client.
_Avoid_: slug (the technical column name), invite code (reserved for staff email invites)

**Enrolment**:
Bringing a Farmer into an Organization as a Client. Two forms: **Self-join** (Farmer enters the
Join code) and **Invite** (consultant sends a phone invite to a new Farmer). Every Enrolment
lands the Client **Unassigned** — an Owner/Admin then makes the Assignment.
_Avoid_: onboarding, registration

**Self-join**:
Farmer-initiated Enrolment: the Farmer joins an Organization by entering its Join code.
_Avoid_: signup (that's account creation, a separate step)

## Farming

**Farmer**:
An end user who owns and keeps records for one or more Farms. Becomes a Client when enrolled
into an Organization.
_Avoid_: grower, user, cultivator

**Farm**:
A vineyard belonging to a Farmer, with its own soil profile, crop variety, and records.
_Avoid_: plot, field, vineyard, block

**Fertilizer Plan**:
The structured recommendation an Agronomist gives for a Farm after reviewing its current and
previous test results and prior advice. It records what to apply, how much, when, and
by which method, together with a short explanation for the Farmer.
_Avoid_: free-text recommendation, prescription

**Petiole Review**:
The Agronomist's review of a newly uploaded petiole report for a Farm, using the previous petiole
report, previous Fertilizer Plan, and annual soil context to prepare the next Fertilizer Plan.
Pending Petiole Reviews appear as work items in the Consultant module's Command Center.
_Avoid_: triage, issue, case

## Command Center metrics

**Command Center**:
The Consultant module's landing workspace — the Petiole Review worklist plus at-a-glance metrics
and charts for the Member's book of Farms, scoped to what the Member may access.
_Avoid_: dashboard (too generic), home

**Open Reviews**:
The count of Petiole Reviews still awaiting a verdict (status pending or in review).
_Avoid_: backlog, queue size

**Review throughput**:
The number of Petiole Reviews completed per week — how quickly the queue is being cleared.
_Avoid_: velocity

**Recommendation adherence**:
The share of a Member's prior recommendations a Farmer actually acted on, captured as visit
follow-up outcomes (Followed / Partially followed / Not followed).
_Avoid_: compliance

**Nutrient status**:
A per-nutrient classification of a Farm's latest petiole values as Deficient / Optimal / Excess,
judged against bloom-stage norms. The same diverging scale the Farmer sees.
_Avoid_: deficiency flag
