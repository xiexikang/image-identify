import { Home, Camera, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface TabBarProps {
  current: string
}

const tabs = [
  {
    key: 'home',
    name: '首页',
    icon: Home,
    path: '/'
  },
  {
    key: 'camera',
    name: '拍照',
    icon: Camera,
    path: '/upload'
  },
  {
    key: 'profile',
    name: '我的',
    icon: User,
    path: '/profile'
  }
]

export default function TabBar({ current }: TabBarProps) {
  const navigate = useNavigate()
  
  const handleTabClick = (path: string) => {
    if (path === '/upload') {
      // 跳转到上传页面
      navigate('/upload')
    } else {
      navigate(path)
    }
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16">
        <div className="flex items-center justify-around h-full">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            const isActive = current === tab.key
            
            return (
              <button
                key={tab.key}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg ${
                  isActive 
                    ? 'text-pink-500 bg-pink-50' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => handleTabClick(tab.path)}
              >
                <IconComponent size={24} />
                <span className="text-xs">{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
