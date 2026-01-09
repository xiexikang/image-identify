import { useState, useEffect } from 'react'
import { Clock, Trash2, Eye } from 'lucide-react'
 
import { recordsAPI, recognitionAPI } from '../services/api'
import { showToast, showModal } from '../components/Toast'

interface RecognitionRecord {
  id: number
  type: string
  image_url: string
  result: string
  confidence: number
  created_at: string
}

const typeNames: Record<string, string> = {
  'general': '看图识万物',
  'animal': '动物识别',
  'plant': '植物识别',
  'ingredient': '果蔬识别',
  'dish': '菜品识别',
  'logo': 'Logo识别',
  'landmark': '地标识别',
  'car': '车型识别'
}

export default function HistoryPage() {
  const [records, setRecords] = useState<RecognitionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [backfilling, setBackfilling] = useState(false)
  const [filterType, setFilterType] = useState<string>('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api'
  const resolveImageUrl = (url: string) => url.startsWith('http') ? url : new URL(url, apiBase).toString()

  useEffect(() => {
    loadRecords()
  }, [filterType, page])

  const loadRecords = async () => {
    try {
      setLoading(true)
      const response = await recordsAPI.getRecords(page, 10, filterType)
      
      if (page === 1) {
        setRecords(response.data)
      } else {
        setRecords(prev => [...prev, ...response.data])
      }
      
      setHasMore(response.pagination.page < response.pagination.pages)
    } catch (error) {
      console.error('Failed to load records:', error)
      alert('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleBackfill = async () => {
    try {
      setBackfilling(true)
      showToast('正在修复...', 'loading')
      const res = await recordsAPI.backfillRecordImages()
      showToast(`已修复 ${res.updated} 条`, 'success')
      setPage(1)
      await loadRecords()
    } catch {
      showToast('修复失败', 'error')
    } finally {
      setBackfilling(false)
    }
  }

  const handleDelete = async (recordId: number) => {
    try {
      await recordsAPI.deleteRecord(recordId)
      setRecords(prev => prev.filter(record => record.id !== recordId))
      showToast('删除成功', 'success')
    } catch (error) {
      console.error('Failed to delete record:', error)
      showToast('删除失败', 'error')
    }
  }

  const handleView = (record: RecognitionRecord) => {
    const imageUrl = resolveImageUrl(record.image_url)
    const Detail = ({ r, url }: { r: RecognitionRecord; url: string }) => {
      const [res, setRes] = useState<{
        keyword: string
        name?: string
        score: number
        description: string
        results?: Array<{ keyword?: string; name?: string; score: number; year?: string; root?: string }>
      } | null>(null)

      useEffect(() => {
        const run = async () => {
          try {
            const resp = await fetch(url)
            const blob = await resp.blob()
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                const s = String(reader.result || '')
                resolve(s.includes(',') ? s.split(',')[1] : s)
              }
              reader.readAsDataURL(blob)
            })
            const out = await recognitionAPI.analyzeImage(base64, r.type)
            setRes(out)
          } catch {
            setRes(null)
          }
        }
        run()
      }, [url, r.type])

      const v = r.confidence <= 1 ? r.confidence * 100 : r.confidence
      return (
        <div className="space-y-3">
          {r.image_url && (
            <div className="w-full h-40 bg-gray-50 rounded-lg flex items-center justify-center">
              <img src={url} alt="图片" className="max-w-full max-h-full object-contain" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">{r.result}</h3>
            <span className="text-sm text-pink-600">{v.toFixed(1)}%</span>
          </div>
          <p className="text-xs text-gray-500">{typeNames[r.type] || '未知类型'} • {formatDate(r.created_at)}</p>
          {Array.isArray(res?.results) && res!.results!.length > 1 ? (
            <div>
              <p className="text-sm text-gray-600 mb-2">候选结果：</p>
              <div className="space-y-2">
                {res!.results!.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1">
                    <div className="text-sm">
                      <span className="font-medium">{item.keyword || item.name}</span>
                      {item.year && <span className="ml-2 text-gray-500">{item.year}</span>}
                      {item.root && <span className="ml-2 text-gray-400">{item.root}</span>}
                    </div>
                    <span className="text-xs text-gray-500">{((item.score <= 1 ? item.score * 100 : item.score)).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )
    }

    showModal('记录详情', (<Detail r={record} url={imageUrl} />))
  }

  const handleFilter = (type: string) => {
    setFilterType(type)
    setPage(1)
  }

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getConfidenceColor = (confidence: number) => {
    const v = confidence <= 1 ? confidence * 100 : confidence
    if (v >= 80) return 'text-green-600'
    if (v >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="container mx-auto px-4 py-6">
        

        <div className="mb-4 flex justify-end" style={{ display: 'none' }}>
          <button
            className={`px-3 py-1.5 rounded-md text-sm bg-pink-500 text-white border border-gray-200 hover:bg-pink-600 ${backfilling ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleBackfill}
            disabled={backfilling}
          >
            修复图片
          </button>
        </div>

        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              className={`px-3 py-1.5 rounded-md text-sm ${
                filterType === '' 
                  ? 'bg-pink-500 text-white border border-gray-200 hover:bg-pink-600' 
                  : 'bg-gray-200 text-gray-800'
              }`}
              onClick={() => handleFilter('')}
            >
              全部
            </button>
            {Object.entries(typeNames).map(([key, name]) => (
              <button
                key={key}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  filterType === key 
                    ? 'bg-pink-500 text-white border border-gray-200 hover:bg-pink-600' 
                    : 'bg-gray-200 text-gray-800'
                }`}
                onClick={() => handleFilter(key)}
              >
                {name || key}
              </button>
            ))}
          </div>
        </div>

        {/* 记录列表 */}
        {records.length === 0 && !loading ? (
          <div className="text-center py-12">
            <Clock size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">暂无识别记录</p>
            <p className="text-sm text-gray-500">快去识别一些图片吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record.id} className="bg-white rounded-xl p-4 shadow-md">
                <div className="flex gap-4">
                  {record.image_url ? (
                    <img
                      src={resolveImageUrl(record.image_url)}
                      alt="图片"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                      无图
                    </div>
                  )}
                  
                  {/* 信息 */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {record.result}
                      </h3>
                      <span className={`text-sm font-medium ${getConfidenceColor(record.confidence)}`}>
                        {((record.confidence <= 1 ? record.confidence * 100 : record.confidence)).toFixed(1)}%
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-2">
                      {typeNames[record.type] || '未知类型'} • {formatDate(record.created_at)}
                    </p>
                    
                    <div className="flex gap-2 justify-end">
                      <button
                        className="bg-gray-100 text-gray-700 p-1.5 rounded-md hover:bg-gray-200 transition-colors border border-gray-200"
                        onClick={() => handleView(record)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="bg-pink-100 text-pink-600 p-1.5 rounded-md hover:bg-pink-200 transition-colors border border-pink-200"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 加载更多 */}
        {hasMore && (
          <div className="mt-6 text-center">
            <button
              className={`text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm border border-gray-200 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? '努力加载...' : '点击加载更多'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
