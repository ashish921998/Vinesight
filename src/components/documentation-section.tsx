'use client'

import { useState, useEffect } from 'react'
import type React from 'react'

// Badge component for consistency
function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-[14px] py-[6px] bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-[rgba(2,6,23,0.08)] shadow-xs">
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">
        {icon}
      </div>
      <div className="text-center flex justify-center flex-col text-[#37322F] text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </div>
  )
}

export default function DocumentationSection() {
  const [activeCard, setActiveCard] = useState(0)
  const [animationKey, setAnimationKey] = useState(0)

  const cards = [
    {
      title: 'Plan your schedules',
      description:
        'Schedule crop rotations, irrigation cycles,\nand harvest planning with AI optimization.',
      image: '/modern-dashboard-interface-with-data-visualization.jpg',
    },
    {
      title: 'Data to insights in minutes',
      description:
        'Transform sensor data into actionable insights\nwith powerful agricultural analytics.',
      image: '/analytics-dashboard.png',
    },
    {
      title: 'Collaborate seamlessly',
      description:
        'Coordinate with your farm team in real-time\nand share field reports instantly.',
      image: '/team-collaboration-interface-with-shared-workspace.jpg',
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % cards.length)
      setAnimationKey((prev) => prev + 1)
    }, 5000)

    return () => clearInterval(interval)
  }, [cards.length])

  const handleCardClick = (index: number) => {
    setActiveCard(index)
    setAnimationKey((prev) => prev + 1)
  }

  return (
    <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
      {/* Header Section */}
      <div className="self-stretch px-6 md:px-24 py-12 md:py-16 border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
        <div className="w-full max-w-[586px] px-6 py-5 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] overflow-hidden rounded-lg flex flex-col justify-start items-center gap-4 shadow-none">
          <Badge
            icon={
              <div className="w-[10.50px] h-[10.50px] outline outline-[1.17px] outline-[#37322F] outline-offset-[-0.58px] rounded-full"></div>
            }
            text="Platform Features"
          />
          <div className="self-stretch text-center flex justify-center flex-col text-[#49423D] text-3xl md:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
            Streamline your farm operations
          </div>
          <div className="self-stretch text-center text-[#605A57] text-base font-normal leading-7 font-sans">
            Plan schedules, analyze crop data, and collaborate with your team
            <br />
            all in one powerful agricultural platform.
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="self-stretch px-4 md:px-9 overflow-hidden flex justify-start items-center">
        <div className="flex-1 py-8 md:py-11 flex flex-col md:flex-row justify-start items-center gap-6 md:gap-12">
          {/* Left Column - Feature Cards */}
          <div className="w-full md:w-auto md:max-w-[400px] flex flex-col justify-center items-center gap-4 order-2 md:order-1">
            {cards.map((card, index) => {
              const isActive = index === activeCard

              return (
                <div
                  key={index}
                  onClick={() => handleCardClick(index)}
                  className={`w-full overflow-hidden flex flex-col justify-start items-start transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-white shadow-[0px_0px_0px_0.75px_#E0DEDB_inset]'
                      : 'border border-[rgba(2,6,23,0.08)]'
                  }`}
                >
                  <div
                    className={`w-full h-0.5 bg-[rgba(50,45,43,0.08)] overflow-hidden ${isActive ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <div
                      key={animationKey}
                      className="h-0.5 bg-[#322D2B] animate-[progressBar_5s_linear_forwards] will-change-transform"
                    />
                  </div>
                  <div className="px-6 py-5 w-full flex flex-col gap-2">
                    <div className="self-stretch flex justify-center flex-col text-[#49423D] text-sm font-semibold leading-6 font-sans">
                      {card.title}
                    </div>
                    <div className="self-stretch text-[#605A57] text-[13px] font-normal leading-[22px] font-sans whitespace-pre-line">
                      {card.description}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column - Enhanced Visual Content */}
          <div className="w-full md:w-auto rounded-lg flex flex-col justify-center items-center gap-2 order-1 md:order-2 md:px-0 px-[00]">
            <div className="w-full md:w-[580px] h-[250px] md:h-[420px] bg-white shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08)] overflow-hidden rounded-lg flex flex-col justify-start items-start">
              {activeCard === 0 && (
                <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-green-100 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                  {/* Calendar/Schedule Visual */}
                  <div className="absolute top-4 right-4 w-16 h-16 bg-white rounded-lg shadow-sm flex flex-col items-center justify-center">
                    <div className="text-xs text-gray-500 font-medium">MAR</div>
                    <div className="text-lg font-bold text-gray-800">15</div>
                  </div>

                  {/* Main Schedule Grid */}
                  <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="w-8 h-8 bg-green-500 rounded-full mb-2 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-xs font-medium text-gray-800">Irrigation</div>
                      <div className="text-xs text-gray-500">6:00 AM</div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="w-8 h-8 bg-blue-500 rounded-full mb-2 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                      </div>
                      <div className="text-xs font-medium text-gray-800">Soil Check</div>
                      <div className="text-xs text-gray-500">10:00 AM</div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="w-8 h-8 bg-orange-500 rounded-full mb-2 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                        </svg>
                      </div>
                      <div className="text-xs font-medium text-gray-800">Team Meeting</div>
                      <div className="text-xs text-gray-500">2:00 PM</div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full mb-2 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div className="text-xs font-medium text-gray-800">Harvest</div>
                      <div className="text-xs text-gray-500">5:00 PM</div>
                    </div>
                  </div>
                </div>
              )}

              {activeCard === 1 && (
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                  {/* Analytics Dashboard Visual */}
                  <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-800">Crop Analytics</h3>
                      <div className="text-xs text-green-600 font-medium">↗ +12%</div>
                    </div>

                    {/* Chart representation */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Yield Prediction</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="w-4/5 h-full bg-green-500 rounded-full"></div>
                          </div>
                          <span className="text-xs font-medium text-gray-800">85%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Soil Health</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="w-3/4 h-full bg-blue-500 rounded-full"></div>
                          </div>
                          <span className="text-xs font-medium text-gray-800">78%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Water Usage</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="w-2/3 h-full bg-cyan-500 rounded-full"></div>
                          </div>
                          <span className="text-xs font-medium text-gray-800">67%</span>
                        </div>
                      </div>
                    </div>

                    {/* Mini chart bars */}
                    <div className="mt-4 flex items-end space-x-1 h-16">
                      {[40, 65, 45, 80, 60, 75, 90, 55, 70, 85].map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeCard === 2 && (
                <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-100 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                  {/* Collaboration Visual */}
                  <div className="w-full max-w-md">
                    {/* Team avatars */}
                    <div className="flex justify-center mb-6 -space-x-2">
                      <div className="w-12 h-12 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-sm font-medium">JD</span>
                      </div>
                      <div className="w-12 h-12 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-sm font-medium">SM</span>
                      </div>
                      <div className="w-12 h-12 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-sm font-medium">AL</span>
                      </div>
                      <div className="w-12 h-12 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-sm font-medium">MK</span>
                      </div>
                    </div>

                    {/* Chat messages */}
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">J</span>
                          </div>
                          <span className="text-xs font-medium text-gray-800">
                            John (Field Manager)
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">Field 3 irrigation complete ✅</p>
                      </div>

                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">S</span>
                          </div>
                          <span className="text-xs font-medium text-gray-800">
                            Sarah (Agronomist)
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">Soil pH levels look good 📊</p>
                      </div>

                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">A</span>
                          </div>
                          <span className="text-xs font-medium text-gray-800">
                            Alex (Equipment Tech)
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">Tractor maintenance scheduled 🚜</p>
                      </div>
                    </div>

                    {/* Online indicators */}
                    <div className="flex justify-center mt-4 space-x-4">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">3 online</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">1 away</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progressBar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(0%);
          }
        }
      `}</style>
    </div>
  )
}
