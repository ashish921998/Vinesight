# Lab Tests Module

This module provides comprehensive lab test tracking and analysis for VineSight.

## Features

### ✅ Implemented (Phase 1)

1. **Lab Test Timeline** (`LabTestsTimeline.tsx`)
   - View all soil and petiole tests in chronological order
   - Filter by test type (All / Soil / Petiole)
   - Filter by date range (All Time / Last 6 Months / Last Year / Season)
   - Last 10 tests shown with "Load More" functionality
   - Summary statistics (total tests, soil tests, petiole tests)

2. **Test Details Cards** (`TestDetailsCard.tsx`)
   - Compact test preview with key parameters
   - Color-coded urgency indicators (Critical/High/Optimal/Moderate)
   - Comparison with previous test (delta changes)
   - Full details dialog with all parameters
   - Lab report viewer (PDF/Image)
   - Edit and delete actions

3. **Smart Recommendations** (`TestRecommendations.tsx` + `lab-test-recommendations.ts`)
   - Rule-based recommendation engine
   - Recommendations grouped by priority:
     - 🔴 Priority Actions (Critical/High)
     - 💰 Cost Savings Opportunities
     - ⚠️ Monitor These Parameters
     - ✅ Optimal Parameters
   - **Both Technical & Simple explanations:**
     - Technical: Agricultural science terminology
     - Simple: Farmer-friendly language (English + Marathi/Hindi)
   - Recommendations for:
     - **Soil Tests:** pH, EC, NPK, organic matter, micronutrients
     - **Petiole Tests:** N, P, K, Ca, Mg, micronutrients
   - Context-aware multi-parameter analysis (e.g., high pH affecting P availability)

4. **Integration**
   - Added "Lab Tests" quick action card on farm details page
   - Accessible via `/farms/[id]/lab-tests`
   - Uses existing `UnifiedDataLogsModal` for add/edit operations
   - Uses existing Supabase service methods (no new database changes needed)
   - Report upload and AI extraction already functional

5. **User Flow**
   - Add test → Close form → Stay on lab-tests page (or return to farm page)
   - Edit test → Update → Refresh test list
   - Delete test → Confirm → Remove from list
   - View details → See full parameters + recommendations + report

## 📊 Pending: Trend Charts (Phase 2)

### Installation Required

```bash
npm install victory
```

**Why Victory?**

- Works on both **web** (React) and **mobile** (React Native)
- Same API for web and mobile apps
- When creating Android/iOS app, just swap `victory` → `victory-native`

### Charts to Implement in `LabTestTrendCharts.tsx`

#### Soil Test Trends:

1. **pH Trend** (Line chart)
   - Color zones: Green (6.5-7.5), Yellow (6.0-6.5, 7.5-8.0), Red (<6.0, >8.0)

2. **EC Trend** (Line chart)
   - Color zones: Green (<1.5), Yellow (1.5-2.0), Red (>2.0)

3. **NPK Multi-line Chart**
   - Three lines: Nitrogen, Phosphorus, Potassium
   - Reference lines for optimal ranges

4. **Micronutrients** (Optional, expandable)
   - Iron, Zinc, Boron, Manganese trends

#### Petiole Test Trends:

1. **N-P-K Trend** (Multi-line chart)
   - Total Nitrogen, Phosphorus, Potassium
   - Optimal range zones

2. **Ca-Mg Balance** (Multi-line chart)
   - Calcium and Magnesium uptake
   - Track balance over time

### Chart Features to Add:

- ✅ Hover tooltips (exact values + date)
- ✅ Color-coded optimal/watch/action zones
- ✅ Toggle between soil and petiole charts
- ✅ Download chart as image
- ✅ Responsive design
- ✅ At least 2 tests required to show trends

### Example Victory Implementation:

```tsx
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTooltip, VictoryArea } from 'victory'

// pH Trend Chart
;<VictoryChart>
  {/* Optimal zone background */}
  <VictoryArea
    data={[
      { x: minDate, y: 6.5, y0: 7.5 },
      { x: maxDate, y: 6.5, y0: 7.5 }
    ]}
    style={{ data: { fill: 'green', opacity: 0.1 } }}
  />

  {/* pH trend line */}
  <VictoryLine
    data={soilTests.map((t) => ({ x: new Date(t.date), y: t.parameters.ph }))}
    style={{ data: { stroke: 'blue', strokeWidth: 3 } }}
    labelComponent={<VictoryTooltip />}
  />

  <VictoryAxis dependentAxis label="pH" />
  <VictoryAxis label="Date" />
</VictoryChart>
```

## File Structure

```
/src/components/lab-tests/
├── LabTestsTimeline.tsx          # Main timeline view
├── TestDetailsCard.tsx            # Individual test card
├── TestRecommendations.tsx        # Recommendations display
├── LabTestTrendCharts.tsx         # Trend charts (placeholder - needs Victory)
└── README.md                      # This file

/src/lib/
└── lab-test-recommendations.ts    # Rule-based recommendation engine

/src/app/farms/[id]/lab-tests/
└── page.tsx                       # Main lab tests page route
```

## Technologies Used

- **Next.js 15** (App Router)
- **React 19**
- **shadcn/ui** (Card, Button, Dialog, Select, Tabs, Badge)
- **Lucide React** (Icons)
- **date-fns** (Date formatting and filtering)
- **Tailwind CSS** (Styling)
- **Victory** (Charts - to be installed)

## Future Enhancements (Phase 2-3)

### Phase 2: Integration

- [ ] Pre-fill fertilizer calculator with test values
- [ ] Generate fertilizer plan from soil test
- [ ] Link to irrigation ETc calculator
- [ ] Add test reminder tasks
- [ ] Tag expenses as "test-driven"

### Phase 3: Intelligence

- [ ] AI-powered recommendations (learn from outcomes)
- [ ] Pest disease correlation with nutrient deficiencies
- [ ] Yield prediction based on petiole tests
- [ ] Anonymous community benchmarking
- [ ] ROI tracking for test-driven decisions

## Testing Checklist

- [ ] Navigate to Lab Tests from Quick Actions
- [ ] View empty state with CTA buttons
- [ ] Add soil test (manual entry)
- [ ] Add soil test (with report upload)
- [ ] Add petiole test
- [ ] View test in timeline
- [ ] See recommendations (check all priority levels)
- [ ] Filter by test type
- [ ] Filter by date range
- [ ] Edit existing test
- [ ] Delete test
- [ ] View full test details
- [ ] View attached lab report
- [ ] See parameter changes from previous test
- [ ] Load more tests (if >10)
- [ ] Switch to Trends tab (placeholder message)
- [ ] Responsive design (mobile, tablet, desktop)

## Notes

- Recommendations are in **both technical and simple language**
- Simple language includes **Marathi/Hindi translations**
- Rule-based thresholds based on established agricultural science
- No breaking changes to existing features
- Uses existing database tables and service methods
- Report upload/extraction already functional from UnifiedDataLogsModal
