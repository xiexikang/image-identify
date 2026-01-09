import { useNavigate } from 'react-router-dom'
import { PawPrint, Leaf, Apple, ChefHat, Camera, Landmark, Diamond, Car } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()

  const go = (type: string) => navigate(`/upload?type=${type}`)

  return (
    <div className="bg-[#f6f8fb] h-full flex flex-col">
      
      {/* 可滚动内容区域 - 高度为100%填充父容器 */}
      <div className="h-full overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 gap-4 auto-rows-[90px]">
            {/* 大卡：看图识万物 */}
            <button
              className="relative row-span-2 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md"
              onClick={() => go('general')}
            >
              <div className="absolute inset-0" />
              <img src="https://baidu-ai.bj.bcebos.com/image-classify/animal.jpeg" alt="看图识万物" className="absolute inset-0 w-full h-full object-cover" />
               <p className="text-xl font-bold text-white absolute bottom-14 left-4 ">看图识万物</p>
                <div className="absolute bottom-4 left-4 right-20">
               
                <p className="text-xs text-white mt-1">识别图片中的各种物体</p>
              </div>
              <div className="absolute bottom-4 right-4 p-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md">
                <Camera size={20} />
              </div>
            </button>

            {/* 小卡：动物识别 */}
            <button
              className="rounded-2xl p-3 bg-white shadow-sm hover:shadow-md flex items-center justify-between"
              onClick={() => go('animal')}
            >
              <div>
                <p className="text-gray-900 font-semibold">动物识别</p>
                <p className="text-xs text-gray-500 mt-1">近八千种动物</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                <PawPrint className="text-white" size={20} />
              </div>
            </button>

            {/* 小卡：果蔬识别 */}
            <button
              className="rounded-2xl p-3 bg-white shadow-sm hover:shadow-md flex items-center justify-between"
              onClick={() => go('ingredient')}
            >
              <div>
                <p className="text-gray-900 font-semibold">果蔬识别</p>
                <p className="text-xs text-gray-500 mt-1">近千种水果蔬菜</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                <Apple className="text-white" size={20} />
              </div>
            </button>

            {/* 小卡：植物识别 */}
            <button
              className="rounded-2xl p-3 bg-white shadow-sm hover:shadow-md flex items-center justify-between"
              onClick={() => go('plant')}
            >
              <div>
                <p className="text-gray-900 font-semibold">植物识别</p>
                <p className="text-xs text-gray-500 mt-1">2万种常见植物</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Leaf className="text-white" size={20} />
              </div>
            </button>

            {/* 小卡：菜品识别 */}
            <button
              className="rounded-2xl p-3 bg-white shadow-sm hover:shadow-md flex items-center justify-between"
              onClick={() => go('dish')}
            >
              <div>
                <p className="text-gray-900 font-semibold">菜品识别</p>
                <p className="text-xs text-gray-500 mt-1">识别菜品与热量</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                <ChefHat className="text-white" size={20} />
              </div>
            </button>

            {/* 小卡：地标识别 */}
            <button
              className="rounded-2xl p-3 bg-white shadow-sm hover:shadow-md flex items-center justify-between"
              onClick={() => go('landmark')}
            >
              <div>
                <p className="text-gray-900 font-semibold">地标识别</p>
                <p className="text-xs text-gray-500 mt-1">识别地标建筑</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                <Landmark className="text-white" size={20} />
              </div>
            </button>

            {/* 小卡：Logo识别 */}
            <button
              className="rounded-2xl p-3 bg-white shadow-sm hover:shadow-md flex items-center justify-between"
              onClick={() => go('logo')}
            >
              <div>
                <p className="text-gray-900 font-semibold">Logo识别</p>
                <p className="text-xs text-gray-500 mt-1">识别品牌与标识</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                <Diamond className="text-white" size={20} />
              </div>
            </button>

            {/* 小卡：车型识别 */}
            <button
              className="rounded-2xl p-3 bg-white shadow-sm hover:shadow-md flex items-center justify-between"
              onClick={() => go('car')}
            >
              <div>
                <p className="text-gray-900 font-semibold">车型识别</p>
                <p className="text-xs text-gray-500 mt-1">识别车辆品牌型号</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-gray-800 flex items-center justify-center">
                <Car className="text-white" size={20} />
              </div>
            </button>
          </div>
        </div>
      </div>

      
    </div>
  )
}
