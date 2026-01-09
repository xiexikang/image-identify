import { useState } from 'react'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { showToast } from '../components/Toast'
import logoImg from '@/assets/logo.png'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { login, setTestUser } = useUserStore()
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showToast('请输入用户名和密码', 'error')
      return
    }

    setLoading(true)
    
    try {
      const success = await login(username.trim(), password.trim())
      
      if (success) {
        showToast('登录成功', 'success')
        
        // 跳转到首页
        setTimeout(() => {
          navigate('/')
        }, 1500)
      } else {
        showToast('用户名或密码错误', 'error')
      }
    } catch {
      showToast('登录失败，请重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = () => {
    // 快速登录为测试用户
    setTestUser()
    showToast('已登录为测试用户', 'success')
    
    setTimeout(() => {
      navigate('/')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br  overflow-y-auto">
      <div className="container mx-auto px-4 py-8">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <img src={logoImg} alt="logo" className="w-20 h-20" style={{borderRadius: '50%'}} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            图像识别小工具
          </h1>
          <p className="text-gray-600">
            登录后体验更多功能
          </p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <div className="space-y-4">
            {/* 用户名输入 */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <User size={20} />
              </div>
              <input
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent focus-visible:outline-none"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* 密码输入 */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Lock size={20} />
              </div>
              <input
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent focus-visible:outline-none"
                placeholder="请输入密码"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* 登录按钮 */}
          <button
            className={`w-full py-3 rounded-lg text-white font-medium mt-6 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-pink-400 to-pink-500 hover:shadow-lg'
            }`}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </div>

        {/* 测试账号登录 */}
        <div className="bg-white rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600 mb-3 text-center">
            测试账号（本地开发使用）
          </p>
          <div className="space-y-2 text-xs text-gray-500 mb-4">
            <p>• 测试用户1 / test123</p>
            <p>• 测试用户2 / test123</p>
            <p>• 测试用户3 / test123</p>
          </div>
          <button
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg text-sm"
            onClick={handleQuickLogin}
          >
            快速登录为测试用户
          </button>
        </div>

        {/* 功能介绍 */}
        <div className="bg-pink-50 rounded-xl p-4">
          <p className="text-sm text-pink-800 mb-2">
            🌟 登录后可享受：
          </p>
          <div className="space-y-1 text-xs text-pink-700">
            <p>• 看图识万物 - 识别各种物体</p>
            <p>• 动植物识别 - 识别生物种类</p>
            <p>• 果蔬菜品识别 - 识别食物信息</p>
            <p>• Logo识别 - 识别品牌logo</p>
            <p>• 地标识别 - 识别城市的地标</p>
            <p>• 车型识别 - 识别车辆品牌</p>
            <p>• 识别历史记录 - 保存识别结果</p>
          </div>
        </div>
      </div>
    </div>
  )
}