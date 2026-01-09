import { useLocation } from 'react-router-dom'

interface TopNavBarProps {
  className?: string
}

interface PageTitle {
  [key: string]: string
}

const pageTitles: PageTitle = {
  '/': '图像识别',
  '/upload': '拍照',
  '/history': '历史记录',
  '/profile': '我的',
  '/login': '登录'
}

// 识别类型映射（与Upload页面的getTypeName保持一致）
const recognitionTypeNames: Record<string, string> = {
  'general': '看图识万物',
  'animal': '动物识别',
  'plant': '植物识别',
  'ingredient': '果蔬识别',
  'dish': '菜品识别',
  'landmark': '地标识别',
  'logo': 'Logo识别',
  'car': '车型识别'
}

export default function TopNavBar({ className }: TopNavBarProps) {
  const location = useLocation()
  const getCurrentPageTitle = () => {
    // 如果是上传页面，根据type参数显示对应的标题
    if (location.pathname === '/upload') {
      const urlParams = new URLSearchParams(location.search)
      const type = urlParams.get('type') || 'general'
      return recognitionTypeNames[type] || '看图识万物'
    }
    
    return pageTitles[location.pathname] || '图像识别'
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-white ${className || ''}`}>
      <div className="flex items-center justify-center px-4 py-3" style={{ padding: '12px 16px' }}>
        <h1 className="font-bold text-[#1f2937] text-center text-base sm:text-lg md:text-xl">
          {getCurrentPageTitle()}
        </h1>
      </div>
    </nav>
  )
}
