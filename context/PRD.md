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
  - **MAD (Maximum Allowable Deficit) Calculator:**
    - Inputs: Distance Between Lines (DBL/vine spacing), Root Depth, Root Width, Water Retention
    - Formula: `(100/(DBL) * Root Depth * Root Width * Water Retention * 100) / 10000`
  - **Refill Tank Calculator:**
    - Uses MAD calculation result
    - Refill Span options: Heavy Growth Period 50% (0.2), Growth Period 40% (0.3), Controlled Stress 30% (0.4)
    - Formula: `MAD Result * Refill Span`
  - **System Discharge Calculators:**
    - **System Discharge 1:**
      - Plants per Hectare (P/H): `(DBL * DBP) / 1000`
      - Final: `(P/H * Drippers per plant * Discharge per hour) / 10000`
    - **System Discharge 2:**
      - Formula: `((100 / DBL) * (100/ DBD) * Discharge per hour) / 10000`
      - Inputs: Distance Between Dripper (DBD), Discharge per hour
  - Drip irrigation planner: Complete irrigation scheduling with hours and intervals
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

### **Phase 2: AI Integration & Smart Farming** ✅ **IMPLEMENTED**

#### **4.6 AI-Powered Disease Detection**
- **Computer Vision Analysis:** TensorFlow.js-powered image recognition for grape disease identification
- **Mobile Camera Integration:** Real-time plant health assessment using device camera
- **Disease Classification:** Automated detection of common grape diseases (downy mildew, powdery mildew, black rot, etc.)
- **Treatment Recommendations:** AI-generated actionable advice based on detected conditions
- **Multi-language Support:** Disease information and recommendations in English, Hindi, Marathi

#### **4.7 AI Chatbot Assistant**
- **Conversational AI:** OpenAI-powered farming assistant for instant guidance
- **Multi-language Interface:** Natural language processing in English, Hindi, Marathi
- **Context-Aware Responses:** Personalized recommendations based on farm data and current conditions
- **Voice Integration:** Speech-to-text and text-to-speech for hands-free operation
- **Farming Knowledge Base:** Specialized grape farming expertise with local Indian practices

#### **4.8 AI Analytics Dashboard**
- **Farm Health Scoring:** AI-calculated overall farm performance metrics
- **Predictive Analytics:** Yield predictions and optimization recommendations
- **Trend Analysis:** Historical data patterns and insights
- **Risk Assessment:** Early warning systems for potential issues
- **Resource Optimization:** AI-driven irrigation and fertilization suggestions

#### **4.9 Market Intelligence System**
- **Price Prediction:** ML-based grape price forecasting
- **Market Analysis:** Supply-demand trends and optimal selling timing
- **Quality Assessment:** Grade prediction and market positioning advice
- **Supply Chain Optimization:** Logistics and distribution recommendations

#### **4.10 IoT Sensor Integration**
- **Real-time Monitoring:** Soil moisture, temperature, humidity sensors
- **Automated Alerts:** Smart notifications for irrigation, pest control
- **Environmental Data:** Weather station integration and microclimate monitoring
- **Precision Agriculture:** Data-driven decision making for optimal resource use

#### **4.11 Voice Interface & Accessibility**
- **Voice Commands:** Hands-free navigation and data entry
- **Speech Recognition:** Multi-language voice input processing
- **Audio Feedback:** Text-to-speech for illiterate or visually impaired users
- **Voice-to-Action:** Direct command execution ("Record irrigation", "Check weather")

#### **4.12 Advanced Image Processing**
- **Plant Area Detection:** Automatic cropping and focus on relevant plant material
- **Color Analysis:** Health indicators based on leaf coloration
- **Growth Monitoring:** Visual tracking of plant development over time
- **Quality Assessment:** Post-harvest grape quality evaluation

### **Phase 3+ (Future Extensions)**

- Weather API integration for ETo values and alerts
- Advanced IoT sensor networks and automation
- Data analytics dashboard: Trends, yield, and input-outcome correlations
- Collaboration: Multi-user, multi-farm support
- Compliance module: Certification record-keeping (for organic/GAP/traceability)
- Blockchain traceability and certification
- Drone integration for aerial monitoring
- Advanced ML models for precision agriculture

---

## 5. User Stories

### **Core Features**
- _As a grape farmer, I want to enter farm and crop data once, so I can re-use it for all calculations and reports._
- _As a farmer, I want simple calculators (ETc, fertilization, LAI) with guidance to avoid errors._
- _As a supervisor, I want to enter spray and irrigation records for compliance and review._
- _As a consultant, I want to download/print field logs and recommendations for my clients._
- _As a Marathi-speaking user, I want the entire interface and help in my language._

### **AI Features** ✅
- _As a farmer, I want to take a photo of my grape plants and get instant disease diagnosis and treatment recommendations._
- _As a non-English speaking farmer, I want to ask questions about farming in Hindi/Marathi and get spoken responses._
- _As a busy farmer, I want AI to predict my harvest yield and suggest optimal selling times based on market data._
- _As a resource-conscious farmer, I want AI recommendations for precise irrigation and fertilization to minimize waste._
- _As a farmer with limited literacy, I want to use voice commands to record farm activities and get audio guidance._
- _As a progressive farmer, I want real-time sensor data and AI alerts to prevent crop losses._

---

## 6. Architecture & Tech (Guidance)

### **Core Architecture**
- **Frontend:** PWA/mobile friendly, offline-first, clear UI (cards, tables, reminders)
- **Backend:** Optional – only for cloud backup, multi-device sync, and analytics
- **Storage:** Local-first (IndexedDB/webSQL/SQLite as relevant)
- **Export:** CSV/PDF generation
- **i18n:** Language files, easy toggling, right font support

### **AI Infrastructure** ✅ **IMPLEMENTED**
- **AI Framework:** TensorFlow.js for client-side machine learning
- **Computer Vision:** @mediapipe/tasks-vision for image processing
- **Conversational AI:** OpenAI API for chatbot and natural language processing
- **Voice Processing:** Web Speech API (SpeechRecognition, SpeechSynthesis)
- **Image Processing:** Canvas API for plant health analysis and preprocessing
- **Multi-language AI:** Context-aware translations and localized AI responses
- **Real-time Processing:** Client-side AI for instant feedback and offline capability
- **Progressive Enhancement:** AI features work offline with local models, enhanced online

---

## 7. Key Algorithms & Formulas

### **Scientific Calculations**
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

### **AI Algorithms** ✅ **IMPLEMENTED**
- **Disease Detection:** Convolutional Neural Network (CNN) for image classification
- **Plant Health Scoring:** 
  - `Green Health Index = (green_pixels / total_pixels) * 100`
  - `Browning Index = (brown_pixels / total_pixels) * 100`
  - `Overall Health = f(green_index, browning_index, yellowness_index)`
- **Market Price Prediction:** Time series forecasting with seasonal adjustments
- **Yield Prediction:** Multi-factor regression considering weather, health, and historical data
- **Irrigation Optimization:** AI-driven scheduling based on soil moisture, weather, and growth stage
- **Risk Assessment:** Weighted scoring of disease probability, weather risks, and market conditions

---

## 8. UX/UI Outline

### **Core Interface**
- **Home:** Dashboard with farm summary (quick links)
- **Farms:** Create/view/update/delete farms
- **Calculators:** Sections for each calculator (Irrigation, Nutrients, LAI)
- **Spray/Irrigation/Nutrient/Event Log:** Tabular journal, add/edit/delete entries, date filtering
- **Reminders/Notifications:** Card or list with due tasks and warnings
- **Settings:** Language toggle, export, simple sync/backup option

### **AI Interface** ✅ **IMPLEMENTED**
- **AI Assistant Page:** Tabbed interface with disease detection, chatbot, and analytics
- **Disease Detection:** Mobile camera interface with real-time analysis and results
- **AI Chatbot:** Conversational interface with voice input/output and quick questions
- **Analytics Dashboard:** Visual charts, health scoring, and predictive insights
- **Voice Interface:** Floating mic button and voice command processing
- **Mobile-First Design:** Touch-optimized AI features with responsive layouts
- **Accessibility:** Voice feedback, large buttons, and multi-language support

---

## 9. Future Considerations

### **Next Phase Enhancements**
- Farmer cooperative management (multi-farm, aggregation)
- Advanced analytics (yield & input optimization) ✅ **PARTIALLY IMPLEMENTED**
- Automated data collection from IoT for larger vineyards ✅ **IMPLEMENTED**
- Weather and market data integration ✅ **IMPLEMENTED** 
- Voice entry for rural users ✅ **IMPLEMENTED**

### **Advanced AI Features**
- **Deep Learning Models:** Custom-trained models on local grape varieties and diseases
- **Satellite Integration:** Remote sensing for large-scale monitoring
- **Predictive Maintenance:** Equipment failure prediction and scheduling
- **Supply Chain AI:** End-to-end optimization from farm to consumer
- **Climate Adaptation:** AI-driven strategies for climate change resilience
- **Robotic Integration:** Autonomous spraying and harvesting coordination

---

## 10. MVP Scope

### **Phase 1: Core Features** ✅ **COMPLETED**
- All phase 1 modules above (calculators, data journal, farm setup, export, multilingual UI).
- No login/auth required for single-user mode.
- "Seed" data for demo/testing.
- Help/support with example calculations.

### **Phase 2: AI Features** ✅ **COMPLETED**
- AI-powered disease detection with mobile camera integration
- Multi-language conversational AI assistant with voice support
- Predictive analytics dashboard with farm health scoring
- Market intelligence and price prediction system
- IoT sensor integration and real-time monitoring
- Advanced image processing and plant health analysis

---

## 11. Acceptance Criteria

### **Phase 1: Core Features**
- [x] User can add/edit/delete a farm and access calculators for that farm
- [x] All key calculators implement formulas exactly as per notes
- [x] Farmer can enter, view, and export all operations (spray, irrigation, fertigation, harvest)
- [x] Interface available in Marathi and Hindi (as well as English)
- [x] Works reliably offline and syncs/exports when online
- [x] Responsive and works on all mobiles/tablets

### **Phase 2: AI Features** ✅ **COMPLETED**
- [x] Users can take photos of grape plants and receive instant disease diagnosis
- [x] AI provides treatment recommendations in local languages (English, Hindi, Marathi)
- [x] Conversational AI assistant responds to farming questions with context-aware answers
- [x] Voice input and output work seamlessly in multiple languages
- [x] Analytics dashboard shows AI-powered insights and predictions
- [x] Market intelligence provides price forecasts and selling recommendations
- [x] IoT sensors integrate with the system for real-time monitoring
- [x] All AI features optimized for mobile devices and touch interfaces
- [x] AI features work offline with local processing and enhance online
- [x] Voice commands allow hands-free operation for accessibility

---

## 12. Exclusions (MVP)

- No cloud auth/login/email management
- No collaborative multi-user mode
- No payment/in-app purchase for MVP
- No complex GIS or sensor integration in phase 1

---
