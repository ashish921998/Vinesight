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

**Enrolment**:
Bringing a Farmer into an Organization as a Client (e.g. via invitation).
_Avoid_: onboarding, registration

## Farming

**Farmer**:
An end user who owns and keeps records for one or more Farms. Becomes a Client when enrolled
into an Organization.
_Avoid_: grower, user, cultivator

**Farm**:
A vineyard belonging to a Farmer, with its own soil profile, crop variety, and records.
_Avoid_: plot, field, vineyard, block
