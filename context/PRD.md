# Product Requirements Document (PRD)

## VineSight – Grape Farming Digital Companion

**Version:** 1.0  
**Date:** January 5, 2025  
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

### **Phase 1: Core Record-Keeping & Calculators** ✅ **COMPLETED**

#### **4.1 Farm & Operations Management**

- Add/edit/delete multiple Farms with:
  - Name, region, area (ha), grape variety, planting date

#### **4.2 Scientific Calculators & Data Entry**

- **Irrigation/Water Use Module:**
  - **Evapotranspiration (ETc) Calculator:**
    - **FAO-56 Penman-Monteith Equation:**
      ```
      ET₀ = [0.408 × Δ × (Rₙ - G) + γ × (900/(T + 273)) × u₂ × (eₛ - eₐ)] / [Δ + γ × (1 + 0.34 × u₂)]
      ```
      Where:
      - **ET₀**: Reference evapotranspiration (mm day⁻¹)
      - **Δ**: Slope of saturation vapor pressure curve (kPa °C⁻¹)
      - **Rₙ**: Net radiation at crop surface (MJ m⁻² day⁻¹)
      - **G**: Soil heat flux density (≈ 0 for daily timestep) (MJ m⁻² day⁻¹)
      - **γ**: Psychrometric constant (kPa °C⁻¹)
      - **T**: Mean daily air temperature at 2m height (°C)
      - **u₂**: Wind speed at 2m height (m s⁻¹)
      - **eₛ**: Saturation vapor pressure (kPa)
      - **eₐ**: Actual vapor pressure (kPa)
      - **(eₛ - eₐ)**: Vapor pressure deficit (VPD) (kPa)
    - **Dual ET0 Sources:**
      - **Primary**: Open-Meteo API ET0 (professional meteorological calculations)
      - **Secondary**: Local FAO Penman-Monteith calculation (fallback)
    - **ETc Calculation**: `ETc = ET₀ × Kc`
      - **Kc**: Crop coefficient based on growth stage
      - **Grape Growth Stages**: Budbreak (0.3), Leaf development (0.5), Flowering (0.7), Fruit set (0.8), Veraison (0.8), Harvest (0.6), Post-harvest (0.4), Dormant (0.2)
    - **Key Vapor Pressure Calculations:**
      - **Saturation vapor pressure**: `eₛ = 0.6108 × exp((17.27 × T) / (T + 237.3))`
      - **Actual vapor pressure**: `eₐ = (RH/100) × eₛ`
      - **Psychrometric constant**: `γ = 0.000665 × P` (where P is atmospheric pressure in kPa)
      - **Slope of saturation curve**: `Δ = (4098 × eₛ) / (T + 237.3)²`
    - **Net Radiation Components:**
      - **Net shortwave radiation**: `Rₙₛ = (1 - α) × Rₛ` (where α = 0.23 for crop albedo)
      - **Net longwave radiation**: `Rₙₗ = σ × [(Tmax,K⁴ + Tmin,K⁴)/2] × (0.34 - 0.14 × √eₐ) × (1.35 × Rₛ/Rₛ₀ - 0.35)`
      - **Net radiation**: `Rₙ = Rₙₛ - Rₙₗ`

  - **MAD (Maximum Allowable Deficit) Calculator:**
    - Inputs: Distance Between Lines (DBL/vine spacing), Root Depth, Root Width, Water Retention
    - Formula: `(100/(DBL) * Root Depth * Root Width * Water Retention * 100) / 10000`
  - **Refill Tank Calculator:**
    - Uses MAD calculation result
    - Refill Span options: Heavy Growth Period 50% (0.2), Growth Period 40% (0.3), Controlled Stress 30% (0.4)
    - Formula: `MAD Result * Refill Span`
  - **System Discharge Calculators:**
    - **System Discharge 1:**
      - Plants per Acre (P/A): `(DBL * DBP) / 1000`
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

- Cloud-based data storage with real-time sync
- Export journals/reports as CSV or PDF

#### **4.5 Multi-Language**

- Full multilingual support with English, Hindi, Marathi UI toggle

---

### **Phase 2: AI Integration & Smart Farming** ✅ **COMPLETED**

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

### **Phase 3: Advanced AI Intelligence** 🧠 **IN DEVELOPMENT**

#### **4.13 Personalized Crop Advisory (AI Agronomist)**

- **Smart Recommendations:** AI analyzes farm history, weather, soil conditions, and growth stage
- **Contextual Memory:** Remembers past decisions, outcomes, and farmer preferences
- **Adaptive Learning:** Improves recommendations based on farm-specific results
- **Seasonal Planning:** Long-term crop calendar with AI-optimized timing
- **Risk Assessment:** Proactive warnings for weather, disease, and market risks
- **Local Adaptation:** Region-specific advice using community data and local conditions

#### **4.14 Smart Task Generator**

- **Predictive Scheduling:** AI generates optimal task timing based on multiple factors
- **Weather Integration:** Adjusts recommendations based on 7-day weather forecasts
- **Farm Context Awareness:** Considers current growth stage, recent activities, and resource availability
- **Priority Optimization:** Ranks tasks by urgency, impact, and resource efficiency
- **Automated Reminders:** Smart notifications with reasoning and alternative timing options
- **Habit Formation:** "Just tick ✅ Done" workflow to reduce farmer decision fatigue

#### **4.15 AI-Powered Pest & Disease Alerts**

- **Predictive Modeling:** Combines weather data, historical patterns, and regional outbreak data
- **Risk Scoring:** Daily pest/disease probability scores with confidence levels
- **Early Warning System:** Push notifications 24-72 hours before optimal treatment windows
- **Treatment Optimization:** AI suggests optimal chemicals, dosages, and application timing
- **Community Intelligence:** Learns from nearby farm reports and treatment outcomes
- **Cost-Benefit Analysis:** ROI calculations for preventive vs reactive treatments

#### **4.16 Expense → Profitability Insights**

- **Intelligent Analysis:** AI identifies cost optimization opportunities across all farm operations
- **ROI Tracking:** Links expenses to yield outcomes and profitability metrics
- **Comparative Benchmarking:** Anonymous comparison with similar farms in region
- **Predictive Budgeting:** Forecasts upcoming expenses based on seasonal patterns
- **Efficiency Scoring:** Rates resource usage efficiency with improvement suggestions
- **Investment Recommendations:** Suggests equipment/infrastructure upgrades with payback analysis

#### **4.17 Enhanced AI Chat Assistant**

- **Long-term Memory:** Remembers all conversations, decisions, and farm context across sessions
- **Proactive Insights:** Offers unsolicited advice based on patterns and opportunities
- **Multi-modal Interaction:** Voice, text, and image inputs with context understanding
- **Emotional Intelligence:** Recognizes farmer stress, celebrates successes, provides encouragement
- **Learning Conversations:** Asks clarifying questions to improve future recommendations
- **Expert Knowledge Integration:** Combines AI with access to agricultural research and local expertise

#### **4.18 Market Intelligence**

- **Price Prediction:** ML-based grape price forecasting using historical and market data
- **Optimal Selling Windows:** AI recommends best times to sell based on quality and market conditions
- **Quality Premium Analysis:** Links farm practices to grade premiums and buyer preferences
- **Supply Chain Optimization:** Suggests logistics improvements and buyer relationship strategies
- **Market Trend Analysis:** Identifies emerging market opportunities and variety preferences
- **Contract Farming Insights:** AI evaluates contract terms and recommends negotiation strategies

#### **4.19 Community Learning Platform**

- **Knowledge Extraction:** AI identifies successful practices from top-performing farms
- **Anonymous Insights:** Share lessons learned without revealing individual farm data
- **Collaborative Problem Solving:** Connect farmers facing similar challenges
- **Best Practice Propagation:** AI identifies and spreads effective innovations across community
- **Seasonal Learning Cycles:** Structured knowledge sharing aligned with grape growing calendar
- **Mentor-Apprentice Matching:** AI connects experienced farmers with newcomers

### **Phase 4+ (Future Extensions)**

- Blockchain traceability and certification
- Drone integration for aerial monitoring
- Advanced ML models for precision agriculture
- Satellite imagery integration
- Robotic farming coordination
- Climate adaptation AI
- Supply chain blockchain integration

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

### **Phase 3: Advanced AI Features** 🧠

- _As a grape farmer, I want AI to learn from my past decisions and outcomes to give me increasingly personalized recommendations._
- _As a busy farmer, I want AI to generate my daily and weekly task list automatically based on weather, growth stage, and priorities._
- _As a risk-averse farmer, I want AI to warn me 2-3 days before pest/disease outbreaks so I can take preventive action._
- _As a cost-conscious farmer, I want AI to analyze all my expenses and show me exactly where I can save money while maintaining quality._
- _As a farmer seeking better profits, I want AI to tell me the optimal time to sell my grapes for maximum price._
- _As a farmer who wants to improve, I want AI to connect me with other successful farmers and share best practices anonymously._
- _As a traditional farmer, I want AI that remembers all our conversations and builds on our relationship over time._

---

## 6. Success Metrics

### **Phase 1: Core Features** ✅

- [x] User can add/edit/delete a farm and access calculators for that farm
- [x] All key calculators implement formulas exactly as per notes
- [x] Farmer can enter, view, and export all operations (spray, irrigation, fertigation, harvest)
- [x] Interface available in Marathi and Hindi (as well as English)
- [x] Works reliably with cloud sync and real-time updates
- [x] Responsive and works on all mobiles/tablets

### **Phase 2: AI Features** ✅

- [x] Users can take photos of grape plants and receive instant disease diagnosis
- [x] AI provides treatment recommendations in local languages (English, Hindi, Marathi)
- [x] Conversational AI assistant responds to farming questions with context-aware answers
- [x] Voice input and output work seamlessly in multiple languages
- [x] Analytics dashboard shows AI-powered insights and predictions
- [x] Market intelligence provides price forecasts and selling recommendations
- [x] IoT sensors integrate with the system for real-time monitoring
- [x] All AI features optimized for mobile devices and touch interfaces
- [x] AI features work with cloud processing and real-time analytics
- [x] Voice commands allow hands-free operation for accessibility

### **Phase 3: Advanced AI Features** 🧠 **IN DEVELOPMENT**

- [ ] AI learns from individual farmer decisions and outcomes for personalized recommendations
- [ ] Smart task generator creates optimal daily/weekly schedules based on multiple factors
- [ ] Pest/disease alert system provides 24-72 hour advance warnings with treatment recommendations
- [ ] Expense analysis AI identifies cost optimization opportunities with ROI calculations
- [ ] Market intelligence predicts optimal selling windows with price forecasting
- [ ] Enhanced chat assistant maintains long-term memory and proactive insights
- [ ] Community learning platform connects farmers and shares anonymized best practices
- [ ] AI provides seasonal planning with weather-integrated long-term recommendations
- [ ] Profitability insights track expense-to-yield ratios with benchmark comparisons
- [ ] Risk assessment algorithms provide early warning for weather, disease, and market risks

---

## 7. Technical Architecture

### **Core Architecture**

- **Frontend:** PWA/mobile friendly, cloud-connected, clear UI (cards, tables, reminders)
- **Backend:** Cloud-based with real-time sync and analytics
- **Storage:** Cloud-first with Supabase integration
- **Export:** CSV/PDF generation
- **i18n:** Language files, easy toggling, right font support

### **AI Infrastructure** ✅ **IMPLEMENTED**

- **AI Framework:** TensorFlow.js for client-side machine learning
- **Computer Vision:** @mediapipe/tasks-vision for image processing
- **Conversational AI:** OpenAI API for chatbot and natural language processing
- **Voice Processing:** Web Speech API (SpeechRecognition, SpeechSynthesis)
- **Image Processing:** Canvas API for plant health analysis and preprocessing
- **Multi-language AI:** Context-aware translations and localized AI responses
- **Real-time Processing:** Client-side AI for instant feedback with cloud integration
- **Progressive Enhancement:** AI features enhanced with cloud-based models and analytics

---

## 8. Key Algorithms & Formulas

### **Scientific Calculations**

- **Evapotranspiration (ETc):**
  - **Primary Formula**: `ETc = ET₀ × Kc`
  - **FAO-56 Penman-Monteith ET₀**:
    ```
    ET₀ = [0.408 × Δ × (Rₙ - G) + γ × (900/(T + 273)) × u₂ × (eₛ - eₐ)] / [Δ + γ × (1 + 0.34 × u₂)]
    ```
  - **Unit Requirements**: ET₀ (mm day⁻¹), Rₙ (MJ m⁻² day⁻¹), T (°C), u₂ (m s⁻¹), eₛ/eₐ (kPa), Δ/γ (kPa °C⁻¹)
  - **Dual Source ET₀**: Open-Meteo API (primary) + Local calculation (fallback)
  - **Crop Coefficients**: Growth stage-specific Kc values for grapes
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

### **Phase 3: Advanced AI Algorithms** 🧠 **IN DEVELOPMENT**

- **Personalized Advisory Algorithm:**
  - `Recommendation Score = w1*Historical_Success + w2*Weather_Fit + w3*Growth_Stage_Alignment + w4*Resource_Efficiency`
  - `Farmer_Preference_Weight = learning_rate * (outcome_success - predicted_success)`
- **Smart Task Generation:**
  - `Task_Priority = Urgency_Score * Impact_Factor * Resource_Availability * Weather_Window`
  - `Optimal_Timing = arg_min(weather_risk + resource_conflict + efficiency_loss)`
- **Pest Prediction Models:**
  - `Pest_Risk = f(temperature_avg, humidity_max, rainfall_7day, historical_outbreaks, regional_reports)`
  - `Alert_Threshold = dynamic_threshold_based_on_farmer_risk_tolerance`
- **Profitability Optimization:**
  - `ROI_Score = (Expected_Revenue - Total_Costs) / Total_Investment`
  - `Efficiency_Rating = Actual_Yield / (Water_Used * Fertilizer_Used * Labor_Hours)`
- **Market Intelligence:**
  - `Price_Forecast = ARIMA(historical_prices) + seasonal_factors + quality_premium`
  - `Selling_Window = arg_max(price_forecast * quality_score * market_demand)`
- **Community Learning:**
  - `Practice_Success_Score = avg(adoption_outcomes) * confidence_interval * regional_relevance`
  - `Farmer_Similarity = cosine_similarity(farm_features, practices, outcomes)`

---

**Last Updated:** January 5, 2025
