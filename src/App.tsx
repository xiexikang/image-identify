import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastContainer, ModalContainer } from './components/Toast'
import { useUserStore } from './stores/userStore'
import TopNavBar from './components/TopNavBar'
import TabBar from './components/TabBar'
import Login from './pages/Login'
import Home from './pages/Home'
import Upload from './pages/Upload'
import History from './pages/History'
import Profile from './pages/Profile'

// 路由守卫组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useUserStore()
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// 带顶部导航栏的布局组件
function LayoutWithNav({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const pathname = location.pathname
  const currentTab = pathname === '/'
    ? 'home'
    : pathname === '/upload'
      ? 'camera'
      : pathname === '/profile'
        ? 'profile'
        : ''

  return (
    <>
      <TopNavBar />
      <div className="min-h-screen flex flex-col" style={{ paddingTop: '48px', paddingBottom: '64px' }}>
        {/* 中间内容区域 - 高度为视口高度减去顶部栏(48px)和底部栏(64px) */}
        <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 48px - 64px)' }}>
          {children}
        </div>
      </div>
      <TabBar current={currentTab} />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <ModalContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <LayoutWithNav>
                <Home />
              </LayoutWithNav>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/upload" 
          element={
            <ProtectedRoute>
              <LayoutWithNav>
                <Upload />
              </LayoutWithNav>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/history" 
          element={
            <ProtectedRoute>
              <LayoutWithNav>
                <History />
              </LayoutWithNav>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <LayoutWithNav>
                <Profile />
              </LayoutWithNav>
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
