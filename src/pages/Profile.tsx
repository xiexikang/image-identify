import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { LogOut, BadgeCheck, ChevronRight, History, Settings } from 'lucide-react'
import { showToast } from '../components/Toast'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useUserStore()
  const username = user?.username || '未登录用户'
  const avatarText = username.slice(0, 1)

  const goHistory = () => navigate('/history')
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="bg-[#f6f8fb] h-full flex flex-col">
      
      {/* 可滚动内容区域 - 高度为100%填充父容器 */}
      <div className="h-full overflow-y-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white shadow-md mb-6">
            <div className="flex items-center gap-4">
              {user?.avatar ? (
                <img src={user.avatar} alt="头像" className="w-16 h-16 rounded-full object-cover border-2 border-white/60" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                  {avatarText}
                </div>
              )}
              <div className="flex-1">
                <p className="text-lg font-semibold">{username}</p>
                <p className="text-xs opacity-90">欢迎回来</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/15">
                <BadgeCheck size={18} />
                <span className="text-xs">VIP会员</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-2 mb-6" style={{ border: '1px solid #f0f0f0' }}>
            <button
              className="w-full flex items-center justify-between px-4 py-4 rounded-lg hover:bg-gray-50"
              onClick={goHistory}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-pink-100 text-pink-600"><History size={18} /></div>
                <div>
                  <p className="text-gray-800 font-medium" style={{ textAlign: 'left' }}>历史记录</p>
                  <p className="text-xs text-gray-500" >查看你的识别历史</p>
                </div>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </button>
            <button
              className="w-full flex items-center justify-between px-4 py-4 rounded-lg hover:bg-gray-50"
              onClick={() => showToast('设置即将上线', 'loading', 2000)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-pink-100 text-pink-600"><Settings size={18} /></div>
                <div>
                  <p className="text-gray-800 font-medium" style={{ textAlign: 'left' }}>账户设置</p>
                  <p className="text-xs text-gray-500">主题与个人信息</p>
                </div>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </button>
          </div>

          <button
            className="w-full py-3 rounded-lg flex items-center justify-center gap-2"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>退出登录</span>
          </button>
        </div>
      </div>
      
    </div>
  )
}
