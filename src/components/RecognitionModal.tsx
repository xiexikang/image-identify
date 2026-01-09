import { useState, useEffect } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { recognitionAPI } from '../services/api'
import { showToast } from './Toast'

interface RecognitionItem {
  keyword: string
  name?: string
  year?: string
  score: number
  root?: string
  type?: number
  location?: {
    top: number
    left: number
    width: number
    height: number
  }
}

interface RecognitionResult {
  record_id: number
  keyword: string
  name?: string
  score: number
  description: string
  results?: RecognitionItem[]
  color_result?: string
  location_result?: {
    top: number
    left: number
    width: number
    height: number
  }
}

interface RecognitionModalProps {
  isOpen: boolean
  onClose: () => void
  imagePath: string
  recognitionType: string
  onReRecognition?: () => void
}

export default function RecognitionModal({ isOpen, onClose, imagePath, recognitionType, onReRecognition }: RecognitionModalProps) {
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [loading, setLoading] = useState(true)

  // 转换图片为base64
  const convertImageSrcToBase64 = async (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }
        ctx.drawImage(img, 0, 0)
        const dataURL = canvas.toDataURL('image/jpeg')
        resolve(dataURL.split(',')[1])
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = src
    })
  }

  // 识别图片
  const handleRecognition = async (base64Image: string, type: string) => {
    try {
      setLoading(true)
      const res = await recognitionAPI.analyzeImage(base64Image, type)
      setResult(res)
      const label = (res.keyword || res.name || '').trim()
      if (!label || label === '未识别') {
        showToast('未识别，请更换更清晰图片', 'error')
      } else {
        showToast('识别成功', 'success')
      }
    } catch (error) {
      console.error('Recognition error:', error)
      showToast('识别失败，请重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  // 重新识别
  const handleReRecognition = async () => {
    if (!imagePath) return
    
    if (onReRecognition) {
      onReRecognition()
      return
    }

    try {
      if (imagePath.startsWith('data:')) {
        const base64 = imagePath.split(',')[1]
        await handleRecognition(base64, recognitionType)
      } else if (imagePath.startsWith('http')) {
        const base64 = await convertImageSrcToBase64(imagePath)
        await handleRecognition(base64, recognitionType)
      } else {
        showToast('图片格式不支持', 'error')
      }
    } catch (error) {
      console.error('Re-recognition error:', error)
      showToast('重新识别失败', 'error')
    }
  }

  useEffect(() => {
    if (isOpen && imagePath) {
      const processImage = async () => {
        try {
          if (imagePath.startsWith('data:')) {
            const base64 = imagePath.split(',')[1]
            await handleRecognition(base64, recognitionType)
          } else if (imagePath.startsWith('http')) {
            const base64 = await convertImageSrcToBase64(imagePath)
            await handleRecognition(base64, recognitionType)
          }
        } catch (error) {
          console.error('Image processing error:', error)
          showToast('图片处理失败', 'error')
          setLoading(false)
        }
      }
      processImage()
    }
  }, [isOpen, imagePath, recognitionType])

  // 重置状态当modal关闭时
  useEffect(() => {
    if (!isOpen) {
      setResult(null)
      setLoading(true)
    }
  }, [isOpen])

  // 点击外部关闭弹窗
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // ESC键关闭弹窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recognition-modal-title"
    >
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-in fade-in-0 zoom-in-95"
           style={{
             transform: isOpen ? 'scale(1)' : 'scale(0.95)',
             opacity: isOpen ? 1 : 0
           }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="recognition-modal-title" className="text-lg font-bold text-gray-800">识别结果</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            aria-label="关闭弹窗"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mb-4"></div>
              <p className="text-gray-600">识别中...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* 图片预览 */}
              {imagePath && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="w-full h-48 rounded-lg flex items-center justify-center">
                    <img
                      src={imagePath}
                      alt="识别图片"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* 识别结果 */}
              <div className="bg-gradient-to-r from-green-50 to-pink-50 rounded-lg p-4">
                {result.keyword || result.name ? (
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {(result.keyword || result.name)?.trim()}
                    </h3>
                    {result.description && (
                      <p className="text-gray-600 text-sm mb-2">{result.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">相似度</span>
                      <span className="text-sm font-medium text-pink-600">
                        {((result.score <= 1 ? result.score * 100 : result.score)).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600">未识别到有效内容</p>
                    <p className="text-sm text-gray-500 mt-1">请尝试更清晰的图片</p>
                  </div>
                )}
              </div>

              {Array.isArray(result.results) && result.results.length > 1 && (
                <div className="bg-white rounded-lg p-4 border">
                  {recognitionType === 'car' && result.color_result && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-600">颜色：</span>
                      <span className="text-sm font-medium">{result.color_result}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">候选结果：</p>
                    <div className="space-y-2">
                      {result.results.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1">
                          <div className="text-sm">
                            <span className="font-medium">{item.keyword || item.name}</span>
                            {item.year && <span className="ml-2 text-gray-500">{item.year}</span>}
                            {item.root && <span className="ml-2 text-gray-400">{item.root}</span>}
                          </div>
                          <span className="text-xs text-gray-500">
                            {((item.score <= 1 ? item.score * 100 : item.score)).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={handleReRecognition}
                  className="flex-1 bg-pink-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                  aria-label="重新识别图片"
                >
                  <RefreshCw size={16} />
                  重新识别
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="关闭识别结果"
                >
                  关闭
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">识别失败</p>
              <p className="text-sm text-gray-500 mt-1">请检查图片质量或网络连接</p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleReRecognition}
                  className="flex-1 bg-pink-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                  aria-label="重新识别图片"
                >
                  <RefreshCw size={16} />
                  重新识别
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="关闭识别结果"
                >
                  关闭
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}