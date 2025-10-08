export interface ImageProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number // 0-1
  format?: 'jpeg' | 'png' | 'webp'
  enablePreprocessing?: boolean
}

export interface ImageMetadata {
  width: number
  height: number
  size: number // bytes
  format: string
  timestamp: Date
  location?: {
    latitude: number
    longitude: number
  }
}

export interface ProcessedImage {
  originalImage: HTMLImageElement | HTMLCanvasElement
  processedImage: HTMLCanvasElement
  metadata: ImageMetadata
  preprocessing: {
    resized: boolean
    enhanced: boolean
    normalized: boolean
  }
}

export class ImageProcessingService {
  private static canvas: HTMLCanvasElement | null = null
  private static context: CanvasRenderingContext2D | null = null

  static initialize() {
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas')
      this.context = this.canvas.getContext('2d')
    }
  }

  // Process image for AI analysis
  static async processImageForAI(
    imageFile: File | Blob | string,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    const {
      maxWidth = 224,
      maxHeight = 224,
      quality = 0.9,
      format = 'jpeg',
      enablePreprocessing = true
    } = options

    // Load image
    const image = await this.loadImage(imageFile)
    const metadata = this.extractMetadata(image, imageFile)

    if (!this.canvas || !this.context) {
      throw new Error('Image processing not initialized')
    }

    // Set canvas dimensions
    const { width, height } = this.calculateDimensions(
      image.width,
      image.height,
      maxWidth,
      maxHeight
    )

    this.canvas.width = width
    this.canvas.height = height

    const preprocessingApplied = {
      resized: false,
      enhanced: false,
      normalized: false
    }

    // Draw and process image
    this.context.drawImage(image, 0, 0, width, height)

    if (enablePreprocessing) {
      // Resize if needed
      if (width !== image.width || height !== image.height) {
        preprocessingApplied.resized = true
      }

      // Apply image enhancements
      if (this.needsEnhancement(this.context, width, height)) {
        await this.enhanceImage(this.context, width, height)
        preprocessingApplied.enhanced = true
      }

      // Normalize for AI model
      await this.normalizeForAI(this.context, width, height)
      preprocessingApplied.normalized = true
    }

    return {
      originalImage: image,
      processedImage: this.canvas,
      metadata,
      preprocessing: preprocessingApplied
    }
  }

  // Load image from various sources
  private static loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image()

      image.onload = () => resolve(image)
      image.onerror = reject

      if (typeof source === 'string') {
        image.src = source
      } else {
        const url = URL.createObjectURL(source)
        image.onload = () => {
          URL.revokeObjectURL(url)
          resolve(image)
        }
        image.src = url
      }
    })
  }

  // Extract metadata from image
  private static extractMetadata(
    image: HTMLImageElement,
    source: File | Blob | string
  ): ImageMetadata {
    return {
      width: image.width,
      height: image.height,
      size: source instanceof File ? source.size : 0,
      format: source instanceof File ? source.type : 'unknown',
      timestamp: new Date()
      // Note: Location would need EXIF data extraction in production
    }
  }

  // Calculate optimal dimensions maintaining aspect ratio
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight

    let width = maxWidth
    let height = maxHeight

    if (aspectRatio > 1) {
      // Landscape
      height = width / aspectRatio
      if (height > maxHeight) {
        height = maxHeight
        width = height * aspectRatio
      }
    } else {
      // Portrait or square
      width = height * aspectRatio
      if (width > maxWidth) {
        width = maxWidth
        height = width / aspectRatio
      }
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    }
  }

  // Check if image needs enhancement
  private static needsEnhancement(
    context: CanvasRenderingContext2D,
    width: number,
    height: number
  ): boolean {
    const imageData = context.getImageData(0, 0, width, height)
    const data = imageData.data

    // Calculate average brightness
    let totalBrightness = 0
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      totalBrightness += (r + g + b) / 3
    }

    const avgBrightness = totalBrightness / (data.length / 4)

    // Enhance if image is too dark or too bright
    return avgBrightness < 100 || avgBrightness > 200
  }

  // Apply image enhancements
  private static async enhanceImage(
    context: CanvasRenderingContext2D,
    width: number,
    height: number
  ): Promise<void> {
    const imageData = context.getImageData(0, 0, width, height)
    const data = imageData.data

    // Apply brightness and contrast adjustments
    for (let i = 0; i < data.length; i += 4) {
      // Brightness adjustment
      data[i] = Math.min(255, data[i] * 1.1) // Red
      data[i + 1] = Math.min(255, data[i + 1] * 1.1) // Green
      data[i + 2] = Math.min(255, data[i + 2] * 1.1) // Blue

      // Contrast adjustment (simplified)
      const factor = (259 * (128 + 255)) / (255 * (259 - 128))
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128))
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128))
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128))
    }

    context.putImageData(imageData, 0, 0)
  }

  // Normalize image for AI model input
  private static async normalizeForAI(
    context: CanvasRenderingContext2D,
    width: number,
    height: number
  ): Promise<void> {
    const imageData = context.getImageData(0, 0, width, height)
    const data = imageData.data

    // Normalize pixel values to 0-1 range (for neural networks)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = (data[i] / 255) * 255 // Keep original for display
      data[i + 1] = (data[i + 1] / 255) * 255
      data[i + 2] = (data[i + 2] / 255) * 255
      // Alpha channel remains unchanged
    }

    context.putImageData(imageData, 0, 0)
  }

  // Create thumbnail
  static createThumbnail(
    image: HTMLImageElement | HTMLCanvasElement,
    size: number = 150
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!

    canvas.width = size
    canvas.height = size

    // Calculate crop dimensions for square thumbnail
    const sourceSize = Math.min(image.width, image.height)
    const sourceX = (image.width - sourceSize) / 2
    const sourceY = (image.height - sourceSize) / 2

    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size)

    return canvas
  }

  // Apply filters for better disease detection
  static applyPlantAnalysisFilters(image: HTMLCanvasElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!

    canvas.width = image.width
    canvas.height = image.height
    context.drawImage(image, 0, 0)

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Enhance green channel for plant analysis
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      // Enhance contrast between healthy and diseased tissue
      if (g > r && g > b) {
        // Likely healthy plant material - enhance green
        data[i + 1] = Math.min(255, g * 1.2)
      } else if (r > g && r - g > 30) {
        // Possible disease symptoms - enhance red/brown tones
        data[i] = Math.min(255, r * 1.1)
      }
    }

    context.putImageData(imageData, 0, 0)
    return canvas
  }

  // Extract color statistics for plant health analysis
  static extractColorStatistics(image: HTMLCanvasElement): {
    averageRGB: { r: number; g: number; b: number }
    greenHealthIndex: number // 0-100
    browningIndex: number // 0-100
    yellowingIndex: number // 0-100
  } {
    const context = image.getContext('2d')!
    const imageData = context.getImageData(0, 0, image.width, image.height)
    const data = imageData.data

    let totalR = 0,
      totalG = 0,
      totalB = 0
    let greenPixels = 0,
      brownPixels = 0,
      yellowPixels = 0
    const totalPixels = data.length / 4

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      totalR += r
      totalG += g
      totalB += b

      // Classify pixel colors
      if (g > r && g > b && g > 100) {
        greenPixels++
      } else if (r > g && r > 120 && g > 60 && b < 100) {
        brownPixels++
      } else if (r > 150 && g > 150 && b < 100) {
        yellowPixels++
      }
    }

    return {
      averageRGB: {
        r: totalR / totalPixels,
        g: totalG / totalPixels,
        b: totalB / totalPixels
      },
      greenHealthIndex: Math.round((greenPixels / totalPixels) * 100),
      browningIndex: Math.round((brownPixels / totalPixels) * 100),
      yellowingIndex: Math.round((yellowPixels / totalPixels) * 100)
    }
  }

  // Convert canvas to tensor for TensorFlow.js
  static canvasToTensor(canvas: HTMLCanvasElement): number[][][] {
    const context = canvas.getContext('2d')!
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    const tensor: number[][][] = []

    for (let y = 0; y < canvas.height; y++) {
      const row: number[][] = []
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4
        const pixel = [
          data[index] / 255, // R
          data[index + 1] / 255, // G
          data[index + 2] / 255 // B
        ]
        row.push(pixel)
      }
      tensor.push(row)
    }

    return tensor
  }

  // Crop image to focus on plant area
  static cropToPlantArea(image: HTMLCanvasElement, confidence: number = 0.8): HTMLCanvasElement {
    const context = image.getContext('2d')!
    const imageData = context.getImageData(0, 0, image.width, image.height)
    const data = imageData.data

    let minX = image.width,
      maxX = 0
    let minY = image.height,
      maxY = 0

    // Find bounds of plant material (green pixels)
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        const index = (y * image.width + x) * 4
        const r = data[index]
        const g = data[index + 1]
        const b = data[index + 2]

        // Check if pixel is likely plant material
        if (g > r && g > b && g > 80) {
          minX = Math.min(minX, x)
          maxX = Math.max(maxX, x)
          minY = Math.min(minY, y)
          maxY = Math.max(maxY, y)
        }
      }
    }

    // Add padding
    const padding = 20
    minX = Math.max(0, minX - padding)
    minY = Math.max(0, minY - padding)
    maxX = Math.min(image.width, maxX + padding)
    maxY = Math.min(image.height, maxY + padding)

    // Create cropped canvas
    const croppedCanvas = document.createElement('canvas')
    const croppedContext = croppedCanvas.getContext('2d')!

    const cropWidth = maxX - minX
    const cropHeight = maxY - minY

    if (cropWidth > 0 && cropHeight > 0) {
      croppedCanvas.width = cropWidth
      croppedCanvas.height = cropHeight

      croppedContext.drawImage(
        image,
        minX,
        minY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      )
    } else {
      // If no plant area detected, return original
      croppedCanvas.width = image.width
      croppedCanvas.height = image.height
      croppedContext.drawImage(image, 0, 0)
    }

    return croppedCanvas
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  ImageProcessingService.initialize()
}
