import type React from 'react'

interface NumbersThatSpeakProps {
  /** Fixed width from Figma: 482px */
  width?: number | string
  /** Fixed height from Figma: 300px */
  height?: number | string
  /** Optional className to pass to root */
  className?: string
  /** Theme palette */
  theme?: 'light' | 'dark'
}

/**
 * Numbers that speak – Farm yield dashboard with layered charts
 * Generated from Figma via MCP with exact measurements (482×300px)
 * Single-file component following the v0-ready pattern used in this repo.
 */
const NumbersThatSpeak: React.FC<NumbersThatSpeakProps> = ({
  width = 482,
  height = 300,
  className = '',
  theme = 'dark'
}) => {
  // Design tokens (derived from Figma local variables)
  const themeVars =
    theme === 'light'
      ? {
          '--nts-surface': '#ffffff',
          '--nts-text-primary': '#2f3037',
          '--nts-text-secondary': 'rgba(47,48,55,0.8)',
          '--nts-text-muted': 'rgba(55,50,47,0.7)',
          '--nts-border': 'rgba(47,48,55,0.12)',
          '--nts-shadow': 'rgba(47,48,55,0.06)'
        }
      : ({
          '--nts-surface': '#ffffff',
          '--nts-text-primary': '#2f3037',
          '--nts-text-secondary': 'rgba(47,48,55,0.8)',
          '--nts-text-muted': 'rgba(55,50,47,0.7)',
          '--nts-border': 'rgba(47,48,55,0.12)',
          '--nts-shadow': 'rgba(47,48,55,0.06)'
        } as React.CSSProperties)

  return (
    <div
      className={className}
      style={
        {
          width,
          height,
          position: 'relative',
          background: 'transparent',
          ...themeVars
        } as React.CSSProperties
      }
      role="img"
      aria-label="Farm yield dashboard showing crop production charts"
      data-name="Numbers that speak"
      data-node-id="454:5856"
    >
      {/* Simplified dashboard visualization without mask dependencies */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '360px',
          height: '266px',
          background: 'var(--nts-surface)',
          borderRadius: '6px',
          boxShadow:
            '0px 0px 0px 0.783px rgba(47,48,55,0.12), 0px 1.565px 3.13px -0.783px rgba(47,48,55,0.06), 0px 2.348px 4.696px -1.174px rgba(47,48,55,0.06)',
          overflow: 'hidden',
          padding: '18px',
          boxSizing: 'border-box'
        }}
      >
        {/* Header Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginBottom: '20px'
          }}
        >
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '10px',
              lineHeight: '18px',
              color: 'var(--nts-text-secondary)',
              whiteSpace: 'pre'
            }}
          >
            Crop Yield (Tons)
          </div>
          <div
            className="tracking-widest"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '18px',
              lineHeight: '20px',
              letterSpacing: '-0.587px',
              color: 'var(--nts-text-primary)',
              whiteSpace: 'pre'
            }}
          >
            2,847 tons
          </div>
        </div>

        {/* Chart Container */}
        <div
          style={{
            height: '156px',
            position: 'relative',
            width: '100%'
          }}
        >
          {/* Y-Axis Labels */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingRight: '8px',
              boxSizing: 'border-box'
            }}
          >
            {['3000', '2500', '2000', '1500', '1000'].map((label, index) => (
              <div
                key={index}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  fontSize: '7px',
                  lineHeight: '14px',
                  color: 'var(--nts-text-muted)',
                  textAlign: 'right'
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid Lines */}
          <div
            style={{
              position: 'absolute',
              left: '30px',
              right: 0,
              top: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                style={{
                  width: '100%',
                  height: '1px',
                  backgroundColor: 'rgba(0,0,0,0.05)'
                }}
              />
            ))}
          </div>

          {/* Chart Data Bars */}
          <div
            style={{
              position: 'absolute',
              left: '30px',
              right: '10px',
              bottom: '23px',
              top: '12px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between'
            }}
          >
            {[
              { height: '83px', color: '#22C55E' },
              { height: '108px', color: '#22C55E' },
              { height: '58px', color: '#22C55E' },
              { height: '89px', color: '#22C55E' },
              { height: '83px', color: '#22C55E' },
              { height: '89px', color: '#22C55E' },
              { height: '83px', color: '#22C55E' },
              { height: '95px', color: '#22C55E' },
              { height: '108px', color: '#22C55E' },
              { height: '76px', color: '#22C55E' },
              { height: '89px', color: '#22C55E' }
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  width: '12px',
                  height: item.height,
                  backgroundColor: item.color,
                  borderRadius: '2px'
                }}
              />
            ))}
          </div>

          {/* X-Axis Labels */}
          <div
            style={{
              position: 'absolute',
              left: '30px',
              right: '10px',
              bottom: 0,
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              fontSize: '7px',
              lineHeight: '14px',
              color: 'var(--nts-text-muted)'
            }}
          >
            <div>Spring 2023</div>
            <div>Fall 2024</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NumbersThatSpeak
