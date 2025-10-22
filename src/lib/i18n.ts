import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Translation files
const resources = {
  en: {
    translation: {
      // Navigation
      navigation: {
        dashboard: 'Dashboard',
        farmManagement: 'Farm Management',
        calculators: 'Calculators',
        journal: 'Operations Journal',
        aiAssistant: 'AI Assistant',
        export: 'Data Export',
        analytics: 'Analytics',
        weather: 'Weather',
        reminders: 'Reminders',
        reports: 'Reports',
        settings: 'Settings'
      },
      // Common UI elements
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        submit: 'Submit',
        loading: 'Loading...',
        success: 'Success',
        error: 'Error',
        date: 'Date',
        notes: 'Notes',
        area: 'Area',
        quantity: 'Quantity',
        price: 'Price',
        total: 'Total',
        required: 'Required',
        optional: 'Optional',
        search: 'Search',
        filter: 'Filter',
        export: 'Export',
        download: 'Download',
        upload: 'Upload',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        close: 'Close',
        open: 'Open',
        yes: 'Yes',
        no: 'No',
        buttons: {
          openModule: 'Open Module'
        }
      },
      // Homepage
      home: {
        title: 'VineSight',
        subtitle: 'Your Digital Companion for Scientific Grape Farming',
        description:
          'Digitize farming operations with scientific calculations, record-keeping, and analytics',
        features: {
          farmManagement: {
            title: 'Farm Management',
            description: 'Add and manage multiple farms with grape varieties and planting details'
          },
          calculators: {
            title: 'Scientific Calculators',
            description: 'ETc calculator, nutrient planning, and LAI calculations'
          },
          diseasePredict: {
            title: 'Disease Prediction',
            description: 'AI-powered disease risk assessment and treatment scheduling'
          },
          yieldPredict: {
            title: 'Yield Prediction',
            description: 'AI-powered yield forecasting using historical data and conditions'
          },
          journal: {
            title: 'Operations Journal',
            description: 'Record irrigation, spraying, fertigation, and harvest activities'
          },
          analytics: {
            title: 'Data Analytics',
            description: 'Track trends, yield patterns, and input-outcome correlations'
          },
          reminders: {
            title: 'Reminders & Tasks',
            description: 'Get notified about irrigation schedules and farming tasks'
          },
          settings: {
            title: 'Settings',
            description: 'Language preferences, data export, and app configuration'
          }
        },
        gettingStarted: {
          title: 'Getting Started',
          description:
            'Begin by adding your farm details and start using our scientific calculators',
          button: 'Add Your First Farm'
        },
        joinToday: {
          title: 'Join VineSight Today',
          description:
            'Sign in with Google to start managing your vineyard operations scientifically',
          button: 'Sign in with Google'
        }
      },
      // Farm Management
      farm: {
        title: 'Farm Management',
        addFarm: 'Add New Farm',
        editFarm: 'Edit Farm',
        farmName: 'Farm Name',
        location: 'Location',
        area: 'Area (acres)',
        crop: 'Crop',
        cropVariety: 'Crop Variety',
        plantingDate: 'Planting Date',
        vineSpacing: 'Vine Spacing (m)',
        rowSpacing: 'Row Spacing (m)',
        noFarms: 'No farms found',
        addFirstFarm: 'Add Your First Farm',
        farmAdded: 'Farm added successfully',
        farmUpdated: 'Farm updated successfully',
        farmDeleted: 'Farm deleted successfully'
      },
      // Calculators
      calculators: {
        title: 'Agricultural Calculators',
        description: 'Scientific calculators for precision farming',
        etc: {
          title: 'ETc Calculator',
          description: 'Evapotranspiration calculation using Penman-Monteith equation',
          weatherData: 'Weather Data',
          maxTemp: 'Max Temperature (°C)',
          minTemp: 'Min Temperature (°C)',
          humidity: 'Humidity (%)',
          windSpeed: 'Wind Speed (m/s)',
          rainfall: 'Rainfall (mm)',
          growthStage: 'Growth Stage',
          results: 'ETc Calculation Results',
          eto: 'Reference Evapotranspiration',
          kc: 'Crop Coefficient',
          etc: 'Crop Evapotranspiration',
          irrigationNeed: 'Irrigation Need',
          recommendation: 'Irrigation Recommendation'
        },
        lai: {
          title: 'LAI Calculator',
          description: 'Leaf Area Index for canopy management',
          leavesPerShoot: 'Leaves per Shoot',
          shootsPerVine: 'Shoots per Vine',
          avgLeafArea: 'Average Leaf Area (cm²)',
          vineSpacing: 'Vine Spacing (m)',
          rowSpacing: 'Row Spacing (m)',
          results: 'LAI Calculation Results',
          lai: 'Leaf Area Index',
          canopyStatus: 'Canopy Status',
          leafAreaRatio: 'Leaf Area to Ground Ratio',
          recommendations: 'Management Recommendations'
        },
        nutrient: {
          title: 'Nutrient Calculator',
          description: 'Fertilizer requirements based on soil analysis',
          soilAnalysis: 'Soil Analysis',
          targetYield: 'Target Yield (tons/ha)',
          soilTest: 'Soil Test Results',
          ph: 'pH',
          organicMatter: 'Organic Matter (%)',
          nitrogen: 'Nitrogen (ppm)',
          phosphorus: 'Phosphorus (ppm)',
          potassium: 'Potassium (ppm)',
          results: 'Nutrient Recommendations',
          fertilizerProgram: 'Fertilizer Program',
          applicationSchedule: 'Application Schedule'
        },
        discharge: {
          title: 'System Discharge Calculator',
          description: 'Irrigation system design and flow calculations',
          systemDesign: 'System Design',
          irrigationMethod: 'Irrigation Method',
          soilType: 'Soil Type',
          waterSource: 'Water Source',
          pressure: 'Available Pressure (bars)',
          results: 'System Design Results',
          flowRate: 'System Flow Rate',
          pumpCapacity: 'Pump Capacity',
          economics: 'Cost Analysis'
        }
      },
      // Journal/Operations
      journal: {
        title: 'Operations Journal',
        description: 'Record and track all farming operations',
        irrigation: {
          title: 'Irrigation Records',
          duration: 'Duration (hours)',
          moistureStatus: 'Moisture Status',
          systemDischarge: 'System Discharge (L/h)',
          addRecord: 'Add Irrigation Record'
        },
        spray: {
          title: 'Spray Records',
          pestDisease: 'Pest/Disease',
          chemical: 'Chemical/Treatment',
          dose: 'Dose',
          weather: 'Weather Conditions',
          operator: 'Operator',
          addRecord: 'Add Spray Record'
        },
        fertigation: {
          title: 'Fertigation Records',
          fertilizer: 'Fertilizer Type',
          concentration: 'Concentration',
          phLevel: 'pH Level',
          ecLevel: 'EC Level',
          addRecord: 'Add Fertigation Record'
        },
        harvest: {
          title: 'Harvest Records',
          grade: 'Grade',
          buyer: 'Buyer',
          pricePerKg: 'Price per kg',
          totalValue: 'Total Value',
          addRecord: 'Add Harvest Record'
        },
        expense: {
          title: 'Expense Records',
          category: 'Category',
          description: 'Description',
          amount: 'Amount',
          vendor: 'Vendor',
          paymentMethod: 'Payment Method',
          addRecord: 'Add Expense Record'
        }
      },
      // Export
      export: {
        title: 'Data Export & Reports',
        description: 'Export your farm data as CSV files or generate professional PDF reports',
        selectFarm: 'Select Farm',
        reportType: 'Report Type',
        dateRange: 'Date Range',
        fromDate: 'From Date',
        toDate: 'To Date',
        format: 'Export Format',
        pdf: 'PDF Report',
        csv: 'CSV Data',
        operations: 'Operations Report',
        financial: 'Financial Report',
        compliance: 'Compliance Report',
        comprehensive: 'Comprehensive Report',
        dataSelection: 'Data Selection',
        selectAll: 'Select All',
        clearAll: 'Clear All',
        generateExport: 'Generate Export',
        noData: 'No data',
        exportSummary: 'Export Summary'
      },
      // Growth Stages
      growthStages: {
        dormant: 'Dormant',
        budbreak: 'Bud Break',
        flowering: 'Flowering',
        fruitSet: 'Fruit Set',
        veraison: 'Veraison',
        harvest: 'Harvest',
        postHarvest: 'Post Harvest'
      },
      // Irrigation Methods
      irrigationMethods: {
        drip: 'Drip Irrigation',
        sprinkler: 'Sprinkler',
        surface: 'Surface Irrigation'
      },
      // Soil Types
      soilTypes: {
        sandy: 'Sandy',
        loamy: 'Loamy',
        clay: 'Clay'
      },
      // Units
      units: {
        acres: 'acres',
        meters: 'meters',
        celsius: '°C',
        percentage: '%',
        ppm: 'ppm',
        mmPerDay: 'mm/day',
        kgPerHa: 'kg/ha',
        litersPerHour: 'L/hr',
        hours: 'hours',
        days: 'days',
        kg: 'kg',
        tons: 'tons',
        rupees: '₹'
      }
    }
  },
  hi: {
    translation: {
      // Navigation - Hindi
      navigation: {
        dashboard: 'डैशबोर्ड',
        farmManagement: 'फार्म प्रबंधन',
        calculators: 'कैलकुलेटर',
        journal: 'संचालन डायरी',
        aiAssistant: 'AI सहायक',
        export: 'डेटा निर्यात',
        analytics: 'विश्लेषण',
        weather: 'मौसम',
        reminders: 'रिमाइंडर',
        reports: 'रिपोर्ट',
        settings: 'सेटिंग्स'
      },
      // Common UI elements - Hindi
      common: {
        save: 'सेव करें',
        cancel: 'रद्द करें',
        delete: 'हटाएं',
        edit: 'संपादित करें',
        add: 'जोड़ें',
        submit: 'जमा करें',
        loading: 'लोड हो रहा है...',
        success: 'सफलता',
        error: 'त्रुटि',
        date: 'दिनांक',
        notes: 'नोट्स',
        area: 'क्षेत्रफल',
        quantity: 'मात्रा',
        price: 'मूल्य',
        total: 'कुल',
        required: 'आवश्यक',
        optional: 'वैकल्पिक',
        search: 'खोजें',
        filter: 'फिल्टर',
        export: 'निर्यात',
        download: 'डाउनलोड',
        upload: 'अपलोड',
        back: 'वापस',
        next: 'अगला',
        previous: 'पिछला',
        close: 'बंद करें',
        open: 'खोलें',
        yes: 'हां',
        no: 'नहीं',
        buttons: {
          openModule: 'मॉड्यूल खोलें'
        }
      },
      // Homepage - Hindi
      home: {
        title: 'वाइनसाइट',
        subtitle: 'वैज्ञानिक अंगूर खेती के लिए आपका डिजिटल साथी',
        description:
          'वैज्ञानिक गणना, रिकॉर्ड-कीपिंग और एनालिटिक्स के साथ खेती संचालन डिजिटाइज़ करें',
        features: {
          farmManagement: {
            title: 'फार्म प्रबंधन',
            description: 'अंगूर किस्मों और रोपण विवरणों के साथ कई फार्म जोड़ें और प्रबंधित करें'
          },
          calculators: {
            title: 'वैज्ञानिक कैलकुलेटर',
            description: 'ETc कैलकुलेटर, पोषक तत्व योजना, और LAI गणना'
          },
          diseasePredict: {
            title: 'बीमारी की भविष्यवाणी',
            description: 'AI-संचालित बीमारी जोखिम मूल्यांकन और उपचार शेड्यूलिंग'
          },
          yieldPredict: {
            title: 'उत्पादन भविष्यवाणी',
            description: 'ऐतिहासिक डेटा और स्थितियों का उपयोग करके AI-संचालित उत्पादन पूर्वानुमान'
          },
          journal: {
            title: 'संचालन डायरी',
            description: 'सिंचाई, छिड़काव, फर्टिगेशन और कटाई गतिविधियों को रिकॉर्ड करें'
          },
          analytics: {
            title: 'डेटा एनालिटिक्स',
            description: 'रुझानों, उत्पादन पैटर्न और इनपुट-परिणाम सहसंबंधों को ट्रैक करें'
          },
          reminders: {
            title: 'रिमाइंडर और कार्य',
            description: 'सिंचाई कार्यक्रम और खेती के कार्यों के बारे में सूचना प्राप्त करें'
          },
          settings: {
            title: 'सेटिंग्स',
            description: 'भाषा प्राथमिकताएं, डेटा निर्यात, और ऐप कॉन्फ़िगरेशन'
          }
        },
        gettingStarted: {
          title: 'शुरुआत करें',
          description:
            'अपने फार्म विवरण जोड़कर शुरुआत करें और हमारे वैज्ञानिक कैलकुलेटर का उपयोग करें',
          button: 'अपना पहला फार्म जोड़ें'
        },
        joinToday: {
          title: 'आज ही वाइनसाइट में शामिल हों',
          description:
            'अपने अंगूर बाग संचालन को वैज्ञानिक रूप से प्रबंधित करने के लिए Google के साथ साइन इन करें',
          button: 'Google के साथ साइन इन करें'
        }
      },
      // Farm Management - Hindi
      farm: {
        title: 'फार्म प्रबंधन',
        addFarm: 'नया फार्म जोड़ें',
        editFarm: 'फार्म संपादित करें',
        farmName: 'फार्म का नाम',
        location: 'स्थान',
        area: 'क्षेत्रफल (हेक्टेयर)',
        crop: 'फसल',
        cropVariety: 'फसल की किस्म',
        plantingDate: 'रोपण तारीख',
        vineSpacing: 'बेल की दूरी (मी)',
        rowSpacing: 'पंक्ति की दूरी (मी)',
        noFarms: 'कोई फार्म नहीं मिला',
        addFirstFarm: 'अपना पहला फार्म जोड़ें',
        farmAdded: 'फार्म सफलतापूर्वक जोड़ा गया',
        farmUpdated: 'फार्म सफलतापूर्वक अपडेट किया गया',
        farmDeleted: 'फार्म सफलतापूर्वक हटाया गया'
      },
      // Calculators - Hindi
      calculators: {
        title: 'कृषि कैलकुलेटर',
        description: 'सटीक खेती के लिए वैज्ञानिक कैलकुलेटर',
        etc: {
          title: 'ETc कैलकुलेटर',
          description: 'पेनमैन-मॉन्टिथ समीकरण का उपयोग करके वाष्पोत्सर्जन गणना',
          weatherData: 'मौसम डेटा',
          maxTemp: 'अधिकतम तापमान (°C)',
          minTemp: 'न्यूनतम तापमान (°C)',
          humidity: 'आर्द्रता (%)',
          windSpeed: 'हवा की गति (m/s)',
          rainfall: 'वर्षा (mm)',
          growthStage: 'वृद्धि अवस्था',
          results: 'ETc गणना परिणाम',
          eto: 'संदर्भ वाष्पोत्सर्जन',
          kc: 'फसल गुणांक',
          etc: 'फसल वाष्पोत्सर्जन',
          irrigationNeed: 'सिंचाई की आवश्यकता',
          recommendation: 'सिंचाई सिफारिश'
        },
        lai: {
          title: 'LAI कैलकुलेटर',
          description: 'कैनोपी प्रबंधन के लिए पत्ती क्षेत्र सूचकांक',
          leavesPerShoot: 'प्रति शूट पत्तियां',
          shootsPerVine: 'प्रति बेल शूट',
          avgLeafArea: 'औसत पत्ती क्षेत्र (cm²)',
          vineSpacing: 'बेल की दूरी (m)',
          rowSpacing: 'पंक्ति की दूरी (m)',
          results: 'LAI गणना परिणाम',
          lai: 'पत्ती क्षेत्र सूचकांक',
          canopyStatus: 'कैनोपी स्थिति',
          leafAreaRatio: 'पत्ती क्षेत्र से जमीन अनुपात',
          recommendations: 'प्रबंधन सिफारिशें'
        },
        nutrient: {
          title: 'पोषक तत्व कैलकुलेटर',
          description: 'मिट्टी विश्लेषण के आधार पर उर्वरक आवश्यकताएं',
          soilAnalysis: 'मिट्टी विश्लेषण',
          targetYield: 'लक्ष्य उपज (टन/हेक्टेयर)',
          soilTest: 'मिट्टी परीक्षण परिणाम',
          ph: 'pH',
          organicMatter: 'कार्बनिक पदार्थ (%)',
          nitrogen: 'नाइट्रोजन (ppm)',
          phosphorus: 'फास्फोरस (ppm)',
          potassium: 'पोटाशियम (ppm)',
          results: 'पोषक तत्व सिफारिशें',
          fertilizerProgram: 'उर्वरक कार्यक्रम',
          applicationSchedule: 'अनुप्रयोग अनुसूची'
        },
        discharge: {
          title: 'सिस्टम डिस्चार्ज कैलकुलेटर',
          description: 'सिंचाई प्रणाली डिजाइन और प्रवाह गणना',
          systemDesign: 'सिस्टम डिजाइन',
          irrigationMethod: 'सिंचाई विधि',
          soilType: 'मिट्टी का प्रकार',
          waterSource: 'पानी का स्रोत',
          pressure: 'उपलब्ध दबाव (बार)',
          results: 'सिस्टम डिजाइन परिणाम',
          flowRate: 'सिस्टम प्रवाह दर',
          pumpCapacity: 'पंप क्षमता',
          economics: 'लागत विश्लेषण'
        }
      },
      // Journal/Operations - Hindi
      journal: {
        title: 'संचालन डायरी',
        description: 'सभी कृषि संचालन रिकॉर्ड और ट्रैक करें',
        irrigation: {
          title: 'सिंचाई रिकॉर्ड',
          duration: 'अवधि (घंटे)',
          moistureStatus: 'नमी की स्थिति',
          systemDischarge: 'सिस्टम डिस्चार्ज (L/h)',
          addRecord: 'सिंचाई रिकॉर्ड जोड़ें'
        },
        spray: {
          title: 'छिड़काव रिकॉर्ड',
          pestDisease: 'कीट/बीमारी',
          chemical: 'रसायन/उपचार',
          dose: 'खुराक',
          weather: 'मौसम की स्थिति',
          operator: 'संचालक',
          addRecord: 'छिड़काव रिकॉर्ड जोड़ें'
        },
        fertigation: {
          title: 'फर्टिगेशन रिकॉर्ड',
          fertilizer: 'उर्वरक प्रकार',
          concentration: 'सांद्रता',
          phLevel: 'pH स्तर',
          ecLevel: 'EC स्तर',
          addRecord: 'फर्टिगेशन रिकॉर्ड जोड़ें'
        },
        harvest: {
          title: 'फसल रिकॉर्ड',
          grade: 'ग्रेड',
          buyer: 'खरीदार',
          pricePerKg: 'प्रति किलो मूल्य',
          totalValue: 'कुल मूल्य',
          addRecord: 'फसल रिकॉर्ड जोड़ें'
        },
        expense: {
          title: 'व्यय रिकॉर्ड',
          category: 'श्रेणी',
          description: 'विवरण',
          amount: 'राशि',
          vendor: 'विक्रेता',
          paymentMethod: 'भुगतान विधि',
          addRecord: 'व्यय रिकॉर्ड जोड़ें'
        }
      },
      // Export - Hindi
      export: {
        title: 'डेटा निर्यात और रिपोर्ट',
        description:
          'अपने फार्म डेटा को CSV फाइलों के रूप में निर्यात करें या पेशेवर PDF रिपोर्ट जेनरेट करें',
        selectFarm: 'फार्म चुनें',
        reportType: 'रिपोर्ट प्रकार',
        dateRange: 'दिनांक सीमा',
        fromDate: 'शुरू तारीख',
        toDate: 'अंत तारीख',
        format: 'निर्यात प्रारूप',
        pdf: 'PDF रिपोर्ट',
        csv: 'CSV डेटा',
        operations: 'संचालन रिपोर्ट',
        financial: 'वित्तीय रिपोर्ट',
        compliance: 'अनुपालन रिपोर्ट',
        comprehensive: 'व्यापक रिपोर्ट',
        dataSelection: 'डेटा चयन',
        selectAll: 'सभी चुनें',
        clearAll: 'सभी साफ करें',
        generateExport: 'निर्यात जेनरेट करें',
        noData: 'कोई डेटा नहीं',
        exportSummary: 'निर्यात सारांश'
      },
      // Growth Stages - Hindi
      growthStages: {
        dormant: 'निष्क्रिय',
        budbreak: 'कली फूटना',
        flowering: 'फूल आना',
        fruitSet: 'फल लगना',
        veraison: 'फल पकना',
        harvest: 'कटाई',
        postHarvest: 'कटाई के बाद'
      },
      // Irrigation Methods - Hindi
      irrigationMethods: {
        drip: 'ड्रिप सिंचाई',
        sprinkler: 'स्प्रिंकलर',
        surface: 'सतही सिंचाई'
      },
      // Soil Types - Hindi
      soilTypes: {
        sandy: 'बलुई',
        loamy: 'दोमट',
        clay: 'चिकनी'
      },
      // Units - Hindi
      units: {
        acres: 'हेक्टेयर',
        meters: 'मीटर',
        celsius: '°C',
        percentage: '%',
        ppm: 'ppm',
        mmPerDay: 'mm/दिन',
        kgPerHa: 'kg/हेक्टेयर',
        litersPerHour: 'L/घंटा',
        hours: 'घंटे',
        days: 'दिन',
        kg: 'किलो',
        tons: 'टन',
        rupees: '₹'
      }
    }
  },
  mr: {
    translation: {
      // Navigation - Marathi
      navigation: {
        dashboard: 'डॅशबोर्ड',
        farmManagement: 'शेत व्यवस्थापन',
        calculators: 'कॅल्क्युलेटर',
        journal: 'संचालन नोंदवही',
        aiAssistant: 'AI सहायक',
        export: 'डेटा निर्यात',
        analytics: 'विश्लेषण',
        weather: 'हवामान',
        reminders: 'स्मरणपत्र',
        reports: 'अहवाल',
        settings: 'सेटिंग्ज'
      },
      // Common UI elements - Marathi
      common: {
        save: 'जतन करा',
        cancel: 'रद्द करा',
        delete: 'हटवा',
        edit: 'संपादित करा',
        add: 'जोडा',
        submit: 'सबमिट करा',
        loading: 'लोड होत आहे...',
        success: 'यशस्वी',
        error: 'चूक',
        date: 'दिनांक',
        notes: 'टिपा',
        area: 'क्षेत्र',
        quantity: 'प्रमाण',
        price: 'किंमत',
        total: 'एकूण',
        required: 'आवश्यक',
        optional: 'पर्यायी',
        search: 'शोधा',
        filter: 'फिल्टर',
        export: 'निर्यात',
        download: 'डाउनलोड',
        upload: 'अपलोड',
        back: 'मागे',
        next: 'पुढे',
        previous: 'मागील',
        close: 'बंद करा',
        open: 'उघडा',
        yes: 'होय',
        no: 'नाही',
        buttons: {
          openModule: 'मॉड्यूल उघडा'
        }
      },
      // Homepage - Marathi
      home: {
        title: 'वाइनसाइट',
        subtitle: 'वैज्ञानिक द्राक्ष शेतीसाठी तुमचा डिजिटल साथी',
        description:
          'वैज्ञानिक गणना, रेकॉर्ड-कीपिंग आणि एनालिटिक्सच्या सहाय्याने शेती संचालन डिजिटाइज करा',
        features: {
          farmManagement: {
            title: 'शेत व्यवस्थापन',
            description: 'द्राक्ष जाती आणि लागवड तपशीलांसह अनेक शेत जोडा आणि व्यवस्थापित करा'
          },
          calculators: {
            title: 'वैज्ञानिक कॅल्क्युलेटर',
            description: 'ETc कॅल्क्युलेटर, पोषक तत्व नियोजन आणि LAI गणना'
          },
          diseasePredict: {
            title: 'रोग अंदाज',
            description: 'AI-संचालित रोग जोखीम मूल्यांकन आणि उपचार शेड्यूलिंग'
          },
          yieldPredict: {
            title: 'उत्पादन अंदाज',
            description: 'ऐतिहासिक डेटा आणि परिस्थितींचा वापर करून AI-संचालित उत्पादन अंदाज'
          },
          journal: {
            title: 'संचालन नोंदवही',
            description: 'सिंचन, फवारणी, फर्टिगेशन आणि कापणी क्रियाकलाप नोंदवा'
          },
          analytics: {
            title: 'डेटा एनालिटिक्स',
            description: 'ट्रेंड, उत्पादन पॅटर्न आणि इनपुट-परिणाम सहसंबंध ट्रॅक करा'
          },
          reminders: {
            title: 'स्मरणपत्र आणि कार्य',
            description: 'सिंचन शेड्यूल आणि शेती कार्यांची सूचना मिळवा'
          },
          settings: {
            title: 'सेटिंग्स',
            description: 'भाषा प्राधान्य, डेटा निर्यात आणि अॅप कॉन्फिगरेशन'
          }
        },
        gettingStarted: {
          title: 'सुरुवात करा',
          description: 'तुमचे शेत तपशील जोडून सुरुवात करा आणि आमचे वैज्ञानिक कॅल्क्युलेटर वापरा',
          button: 'तुमचे पहिले शेत जोडा'
        },
        joinToday: {
          title: 'आज वाइनसाइटमध्ये सामील व्हा',
          description:
            'तुमच्या द्राक्षबाग संचालनाचे वैज्ञानिक व्यवस्थापन करण्यासाठी Google सह साइन इन करा',
          button: 'Google सह साइन इन करा'
        }
      },
      // Farm Management - Marathi
      farm: {
        title: 'शेत व्यवस्थापन',
        addFarm: 'नवीन शेत जोडा',
        editFarm: 'शेत संपादित करा',
        farmName: 'शेताचे नाव',
        location: 'स्थान',
        area: 'क्षेत्रफळ (हेक्टर)',
        crop: 'पीक',
        cropVariety: 'पिकाचा प्रकार',
        plantingDate: 'लागवडीची तारीख',
        vineSpacing: 'द्राक्षवेलीचे अंतर (मी)',
        rowSpacing: 'ओळीचे अंतर (मी)',
        noFarms: 'कोणते शेत आढळले नाही',
        addFirstFarm: 'तुमचे पहिले शेत जोडा',
        farmAdded: 'शेत यशस्वीरीत्या जोडले गेले',
        farmUpdated: 'शेत यशस्वीरीत्या अपडेट केले गेले',
        farmDeleted: 'शेत यशस्वीरीत्या हटवले गेले'
      },
      // Calculators - Marathi
      calculators: {
        title: 'शेती कॅल्क्युलेटर',
        description: 'अचूक शेतीसाठी वैज्ञानिक कॅल्क्युलेटर',
        etc: {
          title: 'ETc कॅल्क्युलेटर',
          description: 'पेनमन-मॉन्टिथ समीकरण वापरून बाष्पोत्सर्जन गणना',
          weatherData: 'हवामान डेटा',
          maxTemp: 'कमाल तापमान (°C)',
          minTemp: 'किमान तापमान (°C)',
          humidity: 'आर्द्रता (%)',
          windSpeed: 'वाऱ्याचा वेग (m/s)',
          rainfall: 'पाऊस (mm)',
          growthStage: 'वाढीचा टप्पा',
          results: 'ETc गणना परिणाम',
          eto: 'संदर्भ बाष्पोत्सर्जन',
          kc: 'पीक गुणांक',
          etc: 'पीक बाष्पोत्सर्जन',
          irrigationNeed: 'पाणी पुरवठा आवश्यकता',
          recommendation: 'पाणी पुरवठा शिफारस'
        },
        lai: {
          title: 'LAI कॅल्क्युलेटर',
          description: 'छत व्यवस्थापनासाठी पान क्षेत्र निर्देशांक',
          leavesPerShoot: 'प्रति कोंब पाने',
          shootsPerVine: 'प्रति वेल कोंब',
          avgLeafArea: 'सरासरी पान क्षेत्र (cm²)',
          vineSpacing: 'वेल अंतर (m)',
          rowSpacing: 'ओळी अंतर (m)',
          results: 'LAI गणना परिणाम',
          lai: 'पान क्षेत्र निर्देशांक',
          canopyStatus: 'छताची स्थिती',
          leafAreaRatio: 'पान क्षेत्र ते जमीन गुणोत्तर',
          recommendations: 'व्यवस्थापन शिफारसी'
        },
        nutrient: {
          title: 'पोषक तत्व कॅल्क्युलेटर',
          description: 'मातीच्या विश्लेषणावर आधारित खत आवश्यकता',
          soilAnalysis: 'माती विश्लेषण',
          targetYield: 'लक्ष्य उत्पादन (टन/हेक्टर)',
          soilTest: 'माती चाचणी परिणाम',
          ph: 'pH',
          organicMatter: 'सेंद्रिय पदार्थ (%)',
          nitrogen: 'नायट्रोजन (ppm)',
          phosphorus: 'फॉस्फरस (ppm)',
          potassium: 'पोटॅशियम (ppm)',
          results: 'पोषक तत्व शिफारसी',
          fertilizerProgram: 'खत कार्यक्रम',
          applicationSchedule: 'वापर वेळापत्रक'
        },
        discharge: {
          title: 'सिस्टम डिस्चार्ज कॅल्क्युलेटर',
          description: 'पाणी पुरवठा प्रणाली डिझाइन आणि प्रवाह गणना',
          systemDesign: 'सिस्टम डिझाइन',
          irrigationMethod: 'पाणी पुरवठा पद्धत',
          soilType: 'मातीचा प्रकार',
          waterSource: 'पाण्याचा स्रोत',
          pressure: 'उपलब्ध दाब (बार)',
          results: 'सिस्टम डिझाइन परिणाम',
          flowRate: 'सिस्टम प्रवाह दर',
          pumpCapacity: 'पंप क्षमता',
          economics: 'खर्च विश्लेषण'
        }
      },
      // Journal/Operations - Marathi
      journal: {
        title: 'संचालन नोंदवही',
        description: 'सर्व शेती संचालन नोंदवा आणि ट्रॅक करा',
        irrigation: {
          title: 'पाणी पुरवठा नोंदी',
          duration: 'कालावधी (तास)',
          moistureStatus: 'आर्द्रता स्थिती',
          systemDischarge: 'सिस्टम डिस्चार्ज (L/h)',
          addRecord: 'पाणी पुरवठा नोंद जोडा'
        },
        spray: {
          title: 'फवारणी नोंदी',
          pestDisease: 'कीड/रोग',
          chemical: 'रसायन/उपचार',
          dose: 'डोस',
          weather: 'हवामान स्थिती',
          operator: 'संचालक',
          addRecord: 'फवारणी नोंद जोडा'
        },
        fertigation: {
          title: 'फर्टिगेशन नोंदी',
          fertilizer: 'खताचा प्रकार',
          concentration: 'एकाग्रता',
          phLevel: 'pH पातळी',
          ecLevel: 'EC पातळी',
          addRecord: 'फर्टिगेशन नोंद जोडा'
        },
        harvest: {
          title: 'कापणी नोंदी',
          grade: 'ग्रेड',
          buyer: 'खरेदीदार',
          pricePerKg: 'प्रति किलो किंमत',
          totalValue: 'एकूण मूल्य',
          addRecord: 'कापणी नोंद जोडा'
        },
        expense: {
          title: 'खर्च नोंदी',
          category: 'श्रेणी',
          description: 'तपशील',
          amount: 'रक्कम',
          vendor: 'विक्रेता',
          paymentMethod: 'पेमेंट पद्धत',
          addRecord: 'खर्च नोंद जोडा'
        }
      },
      // Export - Marathi
      export: {
        title: 'डेटा निर्यात आणि अहवाल',
        description:
          'तुमचा शेत डेटा CSV फाइल्स म्हणून निर्यात करा किंवा व्यावसायिक PDF अहवाल तयार करा',
        selectFarm: 'शेत निवडा',
        reportType: 'अहवाल प्रकार',
        dateRange: 'दिनांक श्रेणी',
        fromDate: 'पासून दिनांक',
        toDate: 'पर्यंत दिनांक',
        format: 'निर्यात स्वरूप',
        pdf: 'PDF अहवाल',
        csv: 'CSV डेटा',
        operations: 'संचालन अहवाल',
        financial: 'आर्थिक अहवाल',
        compliance: 'अनुपालन अहवाल',
        comprehensive: 'सर्वसमावेशक अहवाल',
        dataSelection: 'डेटा निवड',
        selectAll: 'सर्व निवडा',
        clearAll: 'सर्व साफ करा',
        generateExport: 'निर्यात तयार करा',
        noData: 'डेटा नाही',
        exportSummary: 'निर्यात सारांश'
      },
      // Growth Stages - Marathi
      growthStages: {
        dormant: 'निष्क्रिय',
        budbreak: 'कळी फुटणे',
        flowering: 'फुले येणे',
        fruitSet: 'फळ बांधणे',
        veraison: 'फळ पिकणे',
        harvest: 'कापणी',
        postHarvest: 'कापणी नंतर'
      },
      // Irrigation Methods - Marathi
      irrigationMethods: {
        drip: 'ठिबक सिंचन',
        sprinkler: 'फवारणी',
        surface: 'भूपृष्ठीय सिंचन'
      },
      // Soil Types - Marathi
      soilTypes: {
        sandy: 'वाळूमय',
        loamy: 'दोमट',
        clay: 'चिकणमाती'
      },
      // Units - Marathi
      units: {
        acres: 'हेक्टर',
        meters: 'मीटर',
        celsius: '°C',
        percentage: '%',
        ppm: 'ppm',
        mmPerDay: 'mm/दिवस',
        kgPerHa: 'kg/हेक्टर',
        litersPerHour: 'L/तास',
        hours: 'तास',
        days: 'दिवस',
        kg: 'किलो',
        tons: 'टन',
        rupees: '₹'
      }
    }
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // Default language
  fallbackLng: 'en',
  debug: false,
  interpolation: {
    escapeValue: false
  }
})

export default i18n
