# Product Requirements Document (PRD)

## VineSight – Grape Farming Digital Companion

**Version:** 1.0  
**Date:** August 22, 2025  
**Author:** Ashish Huddar

---

## 1. Product Vision

A progressive web and mobile app designed to digitize grape farming operations for Indian farmers, based on deep scientific research and practical experience from real-world labs and vineyards.

---

## 2. Objectives & Goals

- Enable grape farmers to calculate, record, and optimize irrigation, nutrition, spraying, harvesting, and post-harvest scientifically.
- Replace manual notebooks and calculations with easy, reliable digital tools.
- Support record-keeping, compliance, reminders, and best practices, and allow for multi-language (English/Hindi/Marathi) user experience.

---

## 3. Target Users

- Indian grape farmers (small to large acreages)
- Agricultural consultants/cooperatives
- Farm supervisors and workers

---

## 4. Key Features (Phased)

### **Phase 1: Core Record-Keeping & Calculators**

#### **4.1 Farm & Operations Management**

- Add/edit/delete multiple Farms with:
  - Name, region, area (ha), grape variety, planting date

#### **4.2 Scientific Calculators & Data Entry**

- **Irrigation/Water Use Module:**
  - Evapotranspiration (ETc) calculator: `ETc = ETo * Kc`
  - System discharge calculator (formula from notes)
  - MAD (Maximum Allowable Deficit) irrigation schedules
  - Drip irrigation planner: Refill tank, number of plants, system discharge, irrigation hours, interval.
- **Nutrient Calculator:**
  - Micronutrient and secondary nutrient recommendations (Zn, B, Fe, Mn, Cu, Mo, Ca, Mg, S) with per acre guidance.
  - NPK recommendations according to yield target and growth stage, with split application schedule.
  - Typical nutrient removal calculator (outputs for N, P, K, etc. per ton yield and per 12 ton/acre).
- **Leaf Area Index (LAI) Calculator:**
  - Input for leaves per shoot, shoots per vine, average leaf area, vine/row spacing.
  - Automatic LAI computation and leaf area-vs-ground area display.
- **Post-harvest Alternatives & Processing:**
  - Record/guide on ascorbic acid methods (vitamin C), shaded drying, storage, etc.

#### **4.3 Daily & Event-Based Journal**

- Record daily/periodic operations:
  - Spray management (date, dose, pest/disease, weather, operator, area/field, etc.)
  - Irrigation events (date, duration, area, stage, moisture status)
  - Fertigation/fertilizer events (date, fertilizer, dose, purpose)
  - Vineyard training (date, type, purpose, labor)
  - Harvesting log (date, quantity, grade)
  - Expenses & labor with breakdown (date, type, cost, remarks)
  - Soil/water/plant testing (date, parameters, result, recommendation followed)
  - Pest/disease observation (date, type, severity, action)
  - Post-production records: expenses, purchases, cold storage, box rate, sold date, payments.
- Task tracking: due reminders, notification list (to-do), weather alerts, irrigation trigger alerts, empty tank/event notification, etc.

#### **4.4 Data & Export**

- Persistent local data storage with optional cloud sync
- Export journals/reports as CSV or PDF

#### **4.5 Multi-Language**

- Full multilingual support with English, Hindi, Marathi UI toggle

---

### **Phase 2+ (Extensions for future sprints)**

- Weather API integration for ETo values and alerts
- IoT sensor integration (e.g., sap flow, soil moisture, weather stations)
- Data analytics dashboard: Trends, yield, and input-outcome correlations
- Collaboration: Multi-user, multi-farm support
- Compliance module: Certification record-keeping (for organic/GAP/traceability)
- Market linkage: Production planning, price diary, and buyer log

---

## 5. User Stories

- _As a grape farmer, I want to enter farm and crop data once, so I can re-use it for all calculations and reports._
- _As a farmer, I want simple calculators (ETc, fertilization, LAI) with guidance to avoid errors._
- _As a supervisor, I want to enter spray and irrigation records for compliance and review._
- _As a consultant, I want to download/print field logs and recommendations for my clients._
- _As a Marathi-speaking user, I want the entire interface and help in my language._

---

## 6. Architecture & Tech (Guidance)

- **Frontend:** PWA/mobile friendly, offline-first, clear UI (cards, tables, reminders)
- **Backend:** Optional – only for cloud backup, multi-device sync, and analytics
- **Storage:** Local-first (IndexedDB/webSQL/SQLite as relevant)
- **Export:** CSV/PDF generation
- **i18n:** Language files, easy toggling, right font support

---

## 7. Key Algorithms & Formulas

- **Evapotranspiration:** `ETc = ETo * Kc`
- **System Discharge:** see `"System Discharge formula No2"` in notes
- **Water use per vine:** `ETc (mm/day) * area (m^2) = liters/day`
- **MAD, Refill Tank, Irrigation Interval:** all formulas as per lab notes
- **LEAF AREA INDEX (LAI):**
  - `Total Leaf Area (cm2) = Total Leaves x Ave. Leaf Area`
  - `Leaf area m2 = cm2 / 10,000`
  - `Ground Area = Vine Spacing x Row Spacing`
  - `LAI = Leaf Area / Ground Area`
- **Nutrient requirement and removal equations:** per crop guidelines in notes

---

## 8. UX/UI Outline

- **Home:** Dashboard with farm summary (quick links)
- **Farms:** Create/view/update/delete farms
- **Calculators:** Sections for each calculator (Irrigation, Nutrients, LAI)
- **Spray/Irrigation/Nutrient/Event Log:** Tabular journal, add/edit/delete entries, date filtering
- **Reminders/Notifications:** Card or list with due tasks and warnings
- **Settings:** Language toggle, export, simple sync/backup option

---

## 9. Future Considerations

- Farmer cooperative management (multi-farm, aggregation)
- Advanced analytics (yield & input optimization)
- Automated data collection from IoT for larger vineyards
- Weather and market data integration
- Voice entry for rural users

---

## 10. MVP Scope

- All phase 1 modules above (calculators, data journal, farm setup, export, multilingual UI).
- No login/auth required for single-user mode.
- "Seed" data for demo/testing.
- Help/support with example calculations.

---

## 11. Acceptance Criteria

- [ ] User can add/edit/delete a farm and access calculators for that farm
- [ ] All key calculators implement formulas exactly as per notes
- [ ] Farmer can enter, view, and export all operations (spray, irrigation, fertigation, harvest)
- [ ] Interface available in Marathi and Hindi (as well as English)
- [ ] Works reliably offline and syncs/exports when online
- [ ] Responsive and works on all mobiles/tablets

---

## 12. Exclusions (MVP)

- No cloud auth/login/email management
- No collaborative multi-user mode
- No payment/in-app purchase for MVP
- No complex GIS or sensor integration in phase 1

---
