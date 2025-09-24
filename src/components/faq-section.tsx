"use client"

import { useState } from "react"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "What is FarmSight and who is it designed for?",
    answer:
      "FarmSight is an AI-powered farm management platform designed for modern farmers, agricultural cooperatives, and agribusiness operations. It's perfect for crop producers looking to optimize yields, reduce costs, and make data-driven farming decisions.",
  },
  {
    question: "How does the AI crop monitoring work?",
    answer:
      "Our platform uses satellite imagery, drone data, and IoT sensors to continuously monitor crop health, soil conditions, and growth patterns. Machine learning algorithms analyze this data to detect issues early and provide actionable recommendations for optimal crop management.",
  },
  {
    question: "Can FarmSight integrate with my existing farm equipment?",
    answer:
      "Yes! FarmSight connects with most modern tractors, irrigation systems, and agricultural sensors through standard APIs and protocols. We support John Deere, Case IH, New Holland, and many other major equipment manufacturers.",
  },
  {
    question: "What kind of support and training do you provide?",
    answer:
      "We offer comprehensive onboarding, 24/7 technical support, and ongoing training programs. Our agricultural specialists work directly with farmers to ensure successful implementation and maximum ROI from day one.",
  },
  {
    question: "How secure is my farm data with FarmSight?",
    answer:
      "Your farm data is completely secure with enterprise-grade encryption, secure cloud storage, and strict privacy controls. We never share your data with competitors or third parties, and you maintain full ownership of all your agricultural information.",
  },
  {
    question: "How quickly can I see results with FarmSight?",
    answer:
      "Most farmers see immediate benefits in field monitoring and task management within the first week. Yield optimization and predictive insights typically show measurable results within one growing season, with many customers reporting 15-25% efficiency improvements.",
  },
]

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <div className="w-full flex justify-center items-start">
      <div className="flex-1 px-4 md:px-12 py-16 md:py-20 flex flex-col lg:flex-row justify-start items-start gap-6 lg:gap-12">
        {/* Left Column - Header */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-start gap-4 lg:py-5">
          <div className="w-full flex flex-col justify-center text-[#49423D] font-semibold leading-tight md:leading-[44px] font-sans text-4xl tracking-tight">
            Frequently Asked Questions
          </div>
          <div className="w-full text-[#605A57] text-base font-normal leading-7 font-sans">
            Explore your data, build your dashboard,
            <br className="hidden md:block" />
            bring your team together.
          </div>
        </div>

        {/* Right Column - FAQ Items */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-center">
          <div className="w-full flex flex-col">
            {faqData.map((item, index) => {
              const isOpen = openItems.includes(index)

              return (
                <div key={index} className="w-full border-b border-[rgba(73,66,61,0.16)] overflow-hidden">
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-5 py-[18px] flex justify-between items-center gap-5 text-left hover:bg-[rgba(73,66,61,0.02)] transition-colors duration-200"
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1 text-[#49423D] text-base font-medium leading-6 font-sans">
                      {item.question}
                    </div>
                    <div className="flex justify-center items-center">
                      <ChevronDownIcon
                        className={`w-6 h-6 text-[rgba(73,66,61,0.60)] transition-transform duration-300 ease-in-out ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-[18px] text-[#605A57] text-sm font-normal leading-6 font-sans">
                      {item.answer}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
