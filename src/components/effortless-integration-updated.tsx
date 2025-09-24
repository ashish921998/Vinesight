import type React from "react"

interface EffortlessIntegrationProps {
  /** Fixed width from Figma: 482px */
  width?: number | string
  /** Fixed height from Figma: 300px */
  height?: number | string
  /** Optional className to pass to root */
  className?: string
}

/**
 * Effortless Integration – Farm equipment integration constellation
 * Three concentric rings with farm equipment and service logos positioned on ring axes
 */
const EffortlessIntegration: React.FC<EffortlessIntegrationProps> = ({ width = 482, height = 300, className = "" }) => {
  const centerX = 250
  const centerY = 179
  const rings = [
    { radius: 80, logos: 2 }, // Inner ring - 2 logos
    { radius: 120, logos: 3 }, // Middle ring - 3 logos
    { radius: 160, logos: 2 }, // Outer ring - 2 logos
  ]

  const getPositionOnRing = (ringRadius: number, angle: number) => ({
    x: centerX + ringRadius * Math.cos(angle),
    y: centerY + ringRadius * Math.sin(angle),
  })

  return (
    <div
      className={className}
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 20%, transparent 80%, rgba(255,255,255,0.1) 100%)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      {/* Outer ring */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          border: "1px solid rgba(55, 50, 47, 0.2)",
          opacity: 0.8,
        }}
      />
      {/* Middle ring */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "240px",
          height: "240px",
          borderRadius: "50%",
          border: "1px solid rgba(55, 50, 47, 0.25)",
          opacity: 0.7,
        }}
      />
      {/* Inner ring */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "160px",
          height: "160px",
          borderRadius: "50%",
          border: "1px solid rgba(55, 50, 47, 0.3)",
          opacity: 0.6,
        }}
      />

      {/* Company logos positioned systematically on ring axes */}
      <div
        style={{
          width: "500px",
          height: "358px",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          position: "absolute",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            left: `${centerX - 36}px`,
            top: `${centerY - 36}px`,
            position: "absolute",
            background: "#37322f",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            borderRadius: "99px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: "32px",
            color: "#ffffff",
          }}
        >
          🌾
        </div>

        <div
          style={{
            width: "32px",
            height: "32px",
            left: `${getPositionOnRing(80, Math.PI).x - 16}px`,
            top: `${getPositionOnRing(80, Math.PI).y - 16}px`,
            position: "absolute",
            background: "#367C2B",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: "bold", color: "#FFDE00" }}>JD</span>
        </div>

        <div
          style={{
            width: "32px",
            height: "32px",
            left: `${getPositionOnRing(80, 0).x - 16}px`,
            top: `${getPositionOnRing(80, 0).y - 16}px`,
            position: "absolute",
            background: "#0EA5E9",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "16px" }}>☁️</span>
        </div>

        <div
          style={{
            width: "32px",
            height: "32px",
            left: `${getPositionOnRing(120, -Math.PI / 4).x - 16}px`,
            top: `${getPositionOnRing(120, -Math.PI / 4).y - 16}px`,
            position: "absolute",
            background: "#8B4513",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "14px", color: "#ffffff" }}>📊</span>
        </div>

        <div
          style={{
            width: "32px",
            height: "32px",
            left: `${getPositionOnRing(120, (3 * Math.PI) / 4).x - 16}px`,
            top: `${getPositionOnRing(120, (3 * Math.PI) / 4).y - 16}px`,
            position: "absolute",
            background: "#06B6D4",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "16px" }}>💧</span>
        </div>

        <div
          style={{
            width: "32px",
            height: "32px",
            left: `${getPositionOnRing(120, (5 * Math.PI) / 4).x - 16}px`,
            top: `${getPositionOnRing(120, (5 * Math.PI) / 4).y - 16}px`,
            position: "absolute",
            background: "#6366F1",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "14px" }}>🚁</span>
        </div>

        <div
          style={{
            width: "32px",
            height: "32px",
            left: `${getPositionOnRing(160, Math.PI).x - 16}px`,
            top: `${getPositionOnRing(160, Math.PI).y - 16}px`,
            position: "absolute",
            background: "#1F2937",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "16px" }}>🛰️</span>
        </div>

        <div
          style={{
            width: "32px",
            height: "32px",
            left: `${getPositionOnRing(160, 0).x - 16}px`,
            top: `${getPositionOnRing(160, 0).y - 16}px`,
            position: "absolute",
            background: "#059669",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "16px" }}>📈</span>
        </div>

        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(55, 50, 47, 0.1)" />
              <stop offset="50%" stopColor="rgba(55, 50, 47, 0.05)" />
              <stop offset="100%" stopColor="rgba(55, 50, 47, 0.1)" />
            </linearGradient>
          </defs>

          {/* Inner ring connections */}
          <line
            x1={centerX}
            y1={centerY}
            x2={getPositionOnRing(80, 0).x}
            y2={getPositionOnRing(80, 0).y}
            stroke="url(#connectionGradient)"
            strokeWidth="1"
            opacity="0.2"
          />
          <line
            x1={centerX}
            y1={centerY}
            x2={getPositionOnRing(80, Math.PI).x}
            y2={getPositionOnRing(80, Math.PI).y}
            stroke="url(#connectionGradient)"
            strokeWidth="1"
            opacity="0.2"
          />

          {/* Middle ring connections */}
          <line
            x1={centerX}
            y1={centerY}
            x2={getPositionOnRing(120, -Math.PI / 4).x}
            y2={getPositionOnRing(120, -Math.PI / 4).y}
            stroke="url(#connectionGradient)"
            strokeWidth="1"
            opacity="0.15"
          />
          <line
            x1={centerX}
            y1={centerY}
            x2={getPositionOnRing(120, (3 * Math.PI) / 4).x}
            y2={getPositionOnRing(120, (3 * Math.PI) / 4).y}
            stroke="url(#connectionGradient)"
            strokeWidth="1"
            opacity="0.15"
          />
          <line
            x1={centerX}
            y1={centerY}
            x2={getPositionOnRing(120, (5 * Math.PI) / 4).x}
            y2={getPositionOnRing(120, (5 * Math.PI) / 4).y}
            stroke="url(#connectionGradient)"
            strokeWidth="1"
            opacity="0.15"
          />

          {/* Outer ring connections */}
          <line
            x1={centerX}
            y1={centerY}
            x2={getPositionOnRing(160, 0).x}
            y2={getPositionOnRing(160, 0).y}
            stroke="url(#connectionGradient)"
            strokeWidth="1"
            opacity="0.1"
          />
          <line
            x1={centerX}
            y1={centerY}
            x2={getPositionOnRing(160, Math.PI).x}
            y2={getPositionOnRing(160, Math.PI).y}
            stroke="url(#connectionGradient)"
            strokeWidth="1"
            opacity="0.1"
          />
        </svg>
      </div>
    </div>
  )
}

export default EffortlessIntegration
