import { useState } from 'react'
import { Upload, Camera, Link as LinkIcon } from 'lucide-react'
import { showToast } from '../components/Toast'
import RecognitionModal from '../components/RecognitionModal'

export default function UploadPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [urlModalOpen, setUrlModalOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')
  const [urlValidating, setUrlValidating] = useState(false)
  const [recognitionModalOpen, setRecognitionModalOpen] = useState(false)
  const [recognitionImage, setRecognitionImage] = useState<string>('')
  const [recognitionType, setRecognitionType] = useState<string>('general')


  // 获取当前类型
  const getCurrentType = () => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('type') || 'general'
  }

  // 选择图片
  const handleSelectImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const imageUrl = URL.createObjectURL(file)
        setSelectedImage(imageUrl)
        setSelectedFile(file)
      }
    }
    input.click()
  }

  // 拍照
  const handleTakePhoto = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const imageUrl = URL.createObjectURL(file)
        setSelectedImage(imageUrl)
        setSelectedFile(file)
      }
    }
    input.click()
  }

  // 上传图片
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleUpload = async () => {
    // 文件优先，其次URL
    if (!selectedFile && !selectedImage) {
      showToast('请先选择图片或输入链接', 'error')
      return
    }

    setUploading(true)
    
    try {
      const type = getCurrentType()
      if (selectedFile) {
        const base64 = await convertFileToBase64(selectedFile)
        const dataUrl = `data:${selectedFile.type || 'image/jpeg'};base64,${base64}`
        setRecognitionImage(dataUrl)
        setRecognitionType(type)
        setRecognitionModalOpen(true)
      } else if (selectedImage) {
        setRecognitionImage(selectedImage)
        setRecognitionType(type)
        setRecognitionModalOpen(true)
      }
    } catch {
      showToast('上传失败', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleReRecognition = () => {
    // 重新识别时重置图片
    setRecognitionImage('')
    setRecognitionModalOpen(false)
    setTimeout(() => {
      setRecognitionImage(recognitionImage)
      setRecognitionModalOpen(true)
    }, 100)
  }

  // 上传页不需要顶部返回

  return (
    <div className="bg-[#f6f8fb] h-full flex flex-col">
      
      {/* 可滚动内容区域 - 高度为100%填充父容器 */}
      <div className="h-full overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          {/* 图片预览区域 */}
          <div className="mb-6">
            <div className="bg-white rounded-xl p-4" style={{ boxShadow: '0 0 6px rgba(0, 0, 0, 0.1)' }}>
              {selectedImage ? (
                <div className="space-y-4">
                  <div className="w-full h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                    <img
                      src={selectedImage}
                      alt="选择的图片"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <button
                    className="w-full py-3 rounded-lg hover:bg-red-600 transition-colors"
                    onClick={() => { setSelectedImage(null); setSelectedFile(null) }}
                  >
                    重新选择
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <Upload size={40} className="text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">请选择要识别的图片</p>
                  <p className="text-sm text-gray-500">支持拍照或从相册选择</p>
                </div>
              )}
            </div>
          </div>

          {/* 选择方式 */}
          {!selectedImage && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                选择图片方式
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  className="bg-pink-500 text-white py-3 rounded-xl flex flex-col items-center gap-2 hover:bg-pink-600 transition-colors"
                  onClick={handleTakePhoto}
                >
                  <Camera size={24} />
                  <span>拍照</span>
                </button>
                <button
                  className="bg-green-500 text-white py-3 rounded-xl flex flex-col items-center gap-2 hover:bg-green-600 transition-colors"
                  onClick={handleSelectImage}
                >
                  <Upload size={24} />
                  <span>相册选择</span>
                </button>
                <button
                  className="bg-orange-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors col-span-2"
                  onClick={() => setUrlModalOpen(true)}
                >
                  <LinkIcon size={20} />
                  <span>输入图片链接</span>
                </button>
              </div>
            </div>
          )}

          {/* 上传按钮 */}
          {selectedImage && (
            <button
              className={`w-full py-3 rounded-xl text-white font-medium ${
                uploading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-pink-400 to-pink-500 hover:shadow-lg'
              }`}
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? '上传中...' : '开始识别'}
            </button>
          )}

          {/* 提示信息 */}
          <div className="mt-6 bg-pink-50 rounded-lg p-4">
            <p className="text-sm text-pink-800">
              💡 提示：选择清晰的图片可以获得更准确的识别结果
            </p>
          </div>
        </div>
      </div>
      
      

      {urlModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-11/12 max-w-md">
            <div className="px-4 py-3 border-b">
              <h3 className="text-lg font-bold">输入图片链接</h3>
            </div>
            <div className="p-4">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => { setUrlInput(e.target.value); setUrlError('') }}
                placeholder="https://example.com/image.jpg"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent focus-visible:outline-none"
              />
              {urlError && <p className="text-red-500 text-sm mt-2">{urlError}</p>}
              <p className="text-xs text-gray-500 mt-2">支持 jpg/png/bmp</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-4 py-3 border-t">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => { setUrlModalOpen(false); setUrlInput(''); setUrlError('') }}
              >
                取消
              </button>
              <button
                className={`px-3 py-2 rounded-lg text-white ${urlValidating ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'}`}
                onClick={async () => {
                  if (!urlInput.trim()) { setUrlError('请输入链接'); return }
                  if (urlInput.length > 1024) { setUrlError('URL长度超过1024字节'); return }
                  try {
                    setUrlValidating(true)
                    const test = new URL(urlInput)
                    if (!/^https?:$/.test(test.protocol)) { setUrlError('仅支持http/https链接'); setUrlValidating(false); return }
                    // 尝试加载图片以校验尺寸
                    await new Promise<void>((resolve, reject) => {
                      const img = new Image()
                      img.onload = () => {
                        const w = img.naturalWidth
                        const h = img.naturalHeight
                        const minSide = Math.min(w, h)
                        const maxSide = Math.max(w, h)
                        if (minSide < 15) { setUrlError('最短边至少15px'); reject(new Error('dim')); return }
                        if (maxSide > 4096) { setUrlError('最长边不超过4096px'); reject(new Error('dim')); return }
                        resolve()
                      }
                      img.onerror = () => reject(new Error('load'))
                      img.src = urlInput
                    })
                    // 校验通过：设置预览并关闭
                    setSelectedImage(urlInput)
                    setSelectedFile(null)
                    setUrlModalOpen(false)
                  } catch {
                    setUrlError('图片加载失败或链接不可用')
                  } finally {
                    setUrlValidating(false)
                  }
                }}
                disabled={urlValidating}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 识别结果弹窗 */}
      <RecognitionModal
        isOpen={recognitionModalOpen}
        onClose={() => setRecognitionModalOpen(false)}
        imagePath={recognitionImage}
        recognitionType={recognitionType}
        onReRecognition={handleReRecognition}
      />
    </div>
  )
}
