import { capitalizeWords } from '@/lib/string-utils'

export interface CropOption {
  value: string
  label: string
  keywords?: string[]
}

const normalizeCropKey = (name: string): string =>
  name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

const createCropOption = (label: string, keywords: string[] = []): CropOption => ({
  value: normalizeCropKey(label),
  label,
  keywords
})

const capitalizeSegment = (segment: string): string =>
  segment ? segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase() : segment

const capitalizeWords = (value: string): string =>
  value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.split('-').map(capitalizeSegment).join('-'))
    .join(' ')

const baseCropOptions: CropOption[] = [
  createCropOption('Alfalfa'),
  createCropOption('Almond', ['nut']),
  createCropOption('Apple'),
  createCropOption('Apricot'),
  createCropOption('Arecanut'),
  createCropOption('Avocado'),
  createCropOption('Banana'),
  createCropOption('Barley'),
  createCropOption('Basil'),
  createCropOption('Bell Pepper', ['capsicum']),
  createCropOption('Black Pepper', ['pepper vine']),
  createCropOption('Blackberry'),
  createCropOption('Blueberry'),
  createCropOption('Broccoli'),
  createCropOption('Cabbage'),
  createCropOption('Cacao', ['cocoa']),
  createCropOption('Cardamom'),
  createCropOption('Carrot'),
  createCropOption('Cassava', ['manioc']),
  createCropOption('Cauliflower'),
  createCropOption('Chickpea', ['garbanzo']),
  createCropOption('Chili Pepper', ['hot pepper', 'mirchi']),
  createCropOption('Citrus', ['clementine']),
  createCropOption('Clove'),
  createCropOption('Clover'),
  createCropOption('Coconut'),
  createCropOption('Coffee'),
  createCropOption('Cotton'),
  createCropOption('Cowpea', ['lobia']),
  createCropOption('Cucumber'),
  createCropOption('Date Palm', ['dates']),
  createCropOption('Dragon Fruit', ['pitaya']),
  createCropOption('Durian'),
  createCropOption('Eggplant', ['brinjal', 'aubergine']),
  createCropOption('Fennel'),
  createCropOption('Fenugreek', ['methi']),
  createCropOption('Flax'),
  createCropOption('Garlic'),
  createCropOption('Ginger'),
  createCropOption('Grapes', ['vine', 'vineyard', 'grape']),
  createCropOption('Green Gram', ['mung bean']),
  createCropOption('Groundnut', ['peanut']),
  createCropOption('Guava'),
  createCropOption('Hemp'),
  createCropOption('Jute'),
  createCropOption('Kidney Bean', ['rajma']),
  createCropOption('Kiwi'),
  createCropOption('Lentil', ['masoor']),
  createCropOption('Lettuce'),
  createCropOption('Lime'),
  createCropOption('Longan'),
  createCropOption('Lychee'),
  createCropOption('Maize', ['corn']),
  createCropOption('Mango'),
  createCropOption('Millet', ['pearl millet', 'bajra']),
  createCropOption('Mint'),
  createCropOption('Mustard'),
  createCropOption('Mustard Greens', ['sarson saag']),
  createCropOption('Oil Palm'),
  createCropOption('Okra', ['lady finger', 'bhindi']),
  createCropOption('Olive'),
  createCropOption('Onion'),
  createCropOption('Orange'),
  createCropOption('Papaya'),
  createCropOption('Peach'),
  createCropOption('Pear'),
  createCropOption('Peas', ['garden pea']),
  createCropOption('Pecan'),
  createCropOption('Pineapple'),
  createCropOption('Pistachio'),
  createCropOption('Pomegranate'),
  createCropOption('Potato'),
  createCropOption('Quinoa'),
  createCropOption('Raspberry'),
  createCropOption('Red Gram', ['pigeon pea', 'tur dal']),
  createCropOption('Rice', ['paddy']),
  createCropOption('Rubber'),
  createCropOption('Saffron'),
  createCropOption('Sesame', ['til']),
  createCropOption('Soybean'),
  createCropOption('Spinach'),
  createCropOption('Strawberry'),
  createCropOption('Sugar Beet'),
  createCropOption('Sugarcane'),
  createCropOption('Sunflower'),
  createCropOption('Sweet Potato'),
  createCropOption('Tea'),
  createCropOption('Tobacco'),
  createCropOption('Tomato'),
  createCropOption('Turmeric'),
  createCropOption('Vanilla'),
  createCropOption('Walnut'),
  createCropOption('Watermelon'),
  createCropOption('Wheat'),
  createCropOption('Yam')
]

export const cropOptions: CropOption[] = baseCropOptions.sort((a, b) =>
  a.label.localeCompare(b.label)
)

const cropVarietiesMap: Record<string, string[]> = {
  grapes: [
    'Thompson Seedless',
    'Flame Seedless',
    'Sharad Seedless',
    'Sonaka',
    'Tempranillo',
    'Cabernet Sauvignon',
    'Chardonnay',
    'Pinot Noir',
    'Merlot',
    'Sauvignon Blanc'
  ],
  rice: [
    'Basmati',
    'IR64',
    'Sona Masuri',
    'Jasmine',
    'Samba Mahsuri',
    'Koshihikari',
    'Ponni'
  ],
  wheat: ['Hard Red Winter', 'Hard Red Spring', 'Soft White', 'Durum', 'Emmer', 'Kamut'],
  maize: ['Dent Corn', 'Flint Corn', 'Sweet Corn', 'Popcorn', 'Baby Corn', 'QPM'],
  soybean: ['Improved JS335', 'Pusa 9712', 'Bragg', 'Hardee'],
  cotton: ['Bunny Bt', 'RCH 659', 'Deltapine 90', 'Suvin', 'Jayshankar'],
  sugarcane: ['Co 86032', 'Co 0238', 'CoJ 64', 'CP 44-101', 'BO 91'],
  banana: ['Grand Nain', 'Robusta', 'Dwarf Cavendish', 'Rasthali', 'Monthan', 'Pisang Raja'],
  mango: ['Alphonso', 'Kesar', 'Dasheri', 'Banganapalli', 'Langra', 'Tommy Atkins'],
  potato: ['Kufri Jyoti', 'Kennebec', 'Russet Burbank', 'Yukon Gold', 'Lady Rosetta'],
  tomato: ['Roma', 'Heirloom', 'Cherry Tomato', 'San Marzano', 'Pusa Ruby'],
  chili_pepper: ['Byadgi', 'Guntur Sannam', 'Jwala', 'Bird Eye', 'Habanero'],
  tea: ['Assam', 'Darjeeling', 'Nilgiri', 'Matcha', 'Oolong'],
  coffee: ['Arabica', 'Robusta', 'Liberica', 'Excelsa'],
  apple: ['Fuji', 'Gala', 'Honeycrisp', 'Granny Smith', 'Red Delicious'],
  orange: ['Valencia', 'Navel', 'Blood Orange', 'Kinnow', 'Mandarin'],
  pomegranate: ['Bhagwa', 'Ganesh', 'Ruby', 'Mridula', 'Wonderful'],
  coconut: ['West Coast Tall', 'East Coast Tall', 'Hybrid Dwarf', 'Chowghat Dwarf'],
  black_pepper: ['Panniyur 1', 'Karimunda', 'Thevam', 'Sreekara'],
  turmeric: ['Erode', 'Salem', 'Rajapuri', 'Alleppey'],
  ginger: ['Rio-de-Janeiro', 'Nadia', 'Maran', 'China'],
  cardamom: ['Njallani', 'Vazhukka', 'Green Gold'],
  sesame: ['Tilottama', 'Gujarat Til 2', 'Krishna'],
  sunflower: ['COH 3', 'Morden', 'PAC 36', 'KBSH 44'],
  quinoa: ['Titicaca', 'Red Head', 'Brightest Brilliant', 'Cherry Vanilla'],
  strawberry: ['Chandler', 'Sweet Charlie', 'Winter Dawn', 'Selva'],
  barley: ['Hazera', 'Jau-86', 'DWRUB 52'],
  lettuce: ['Iceberg', 'Butterhead', 'Romaine', 'Oak Leaf']
}

export const DEFAULT_CROP_NAME = 'Grapes'

export const normalizeCropName = (name: string): string =>
  capitalizeWords(name.trim().replace(/\s+/g, ' '))

export const getCropLabel = (value: string): string => {
  const normalizedValue = normalizeCropKey(value)
  const match = cropOptions.find((option) => option.value === normalizedValue)
  if (match) {
    return match.label
  }

  const cleaned = value.trim()
  return cleaned ? capitalizeWords(cleaned) : DEFAULT_CROP_NAME
}

export const getVarietiesForCrop = (cropName: string): string[] => {
  const key = normalizeCropKey(cropName)
  return cropVarietiesMap[key]?.map((variety) => capitalizeWords(variety)) ?? []
}

export const isKnownCrop = (cropName: string): boolean => {
  const key = normalizeCropKey(cropName)
  return cropOptions.some((option) => option.value === key)
}

export const addCustomVariety = (cropName: string, variety: string): void => {
  const key = normalizeCropKey(cropName)
  if (!variety.trim()) return
  const normalizedVariety = capitalizeWords(variety)

  if (!cropVarietiesMap[key]) {
    cropVarietiesMap[key] = [normalizedVariety]
    return
  }

  if (!cropVarietiesMap[key].some((existing) => existing === normalizedVariety)) {
    cropVarietiesMap[key] = [...cropVarietiesMap[key], normalizedVariety]
  }
}

export { normalizeCropKey }
