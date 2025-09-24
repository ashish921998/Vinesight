import type React from "react"

interface SmartSimpleBrilliantProps {
  /** Fixed width from Figma: 482px */
  width?: number | string
  /** Fixed height from Figma: 300px */
  height?: number | string
  /** Optional className to pass to root */
  className?: string
  /** Theme palette */
  theme?: "light" | "dark"
}

/**
 * Smart · Simple · Brilliant – Farm task scheduling cards
 * Generated from Figma via MCP with exact measurements (482×300px)
 * Single-file component following the v0-ready pattern used in this repo.
 */
const SmartSimpleBrilliant: React.FC<SmartSimpleBrilliantProps> = ({
  width = 482,
  height = 300,
  className = "",
  theme = "dark",
}) => {
  // Design tokens (derived from Figma local variables)
  const themeVars =
    theme === "light"
      ? {
          "--ssb-surface": "#ffffff",
          "--ssb-text": "#1b1919",
          "--ssb-border": "rgba(0,0,0,0.08)",
          "--ssb-inner-border": "rgba(0,0,0,0.12)",
          "--ssb-shadow": "rgba(0,0,0,0.12)",
        }
      : ({
          "--ssb-surface": "#333937",
          "--ssb-text": "#f8f8f8",
          "--ssb-border": "rgba(255,255,255,0.16)",
          "--ssb-inner-border": "rgba(255,255,255,0.12)",
          "--ssb-shadow": "rgba(0,0,0,0.28)",
        } as React.CSSProperties)

  const img =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Cpath d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'/%3E%3C/svg%3E"
  const img1 =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Cpath d='M3 3v18h18'/%3E%3Cpath d='m19 9-5 5-4-4-3 3'/%3E%3C/svg%3E"
  const img2 =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5z'/%3E%3Cpath d='m2 17 10 5 10-5'/%3E%3Cpath d='m2 12 10 5 10-5'/%3E%3C/svg%3E"
  const img3 =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Cpath d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'/%3E%3C/svg%3E"

  return (
    <div
      className={className}
      style={
        {
          width,
          height,
          position: "relative",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...themeVars,
        } as React.CSSProperties
      }
      role="img"
      aria-label="Two farm task scheduling cards with colored event rows"
    >
      <div
        style={{
          position: "relative",
          width: "295.297px",
          height: "212.272px",
          transform: "scale(1.2)", // Added 1.2x scale transform
        }}
      >
        {/* Left tilted card group */}
        <div style={{ position: "absolute", left: "123.248px", top: "0px", width: 0, height: 0 }}>
          <div style={{ transform: "rotate(5deg)", transformOrigin: "center" }}>
            <div
              style={{
                width: "155.25px",
                background: "#ffffff",
                borderRadius: "9px",
                padding: "6px",
                boxShadow: "0px 0px 0px 1px rgba(0,0,0,0.08), 0px 2px 4px rgba(0,0,0,0.07)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "51px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background: "rgba(34,197,94,0.1)",
                  display: "flex",
                }}
              >
                <div style={{ width: "2.25px", background: "#22C55E" }} />
                <div style={{ padding: "4.5px", width: "100%" }}>
                  <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#15803D" }}
                    >
                      8:00
                    </span>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#15803D" }}
                    >
                      AM
                    </span>
                    <div style={{ background: "#15803D", padding: "1.5px", borderRadius: "100px" }}>
                      <div style={{ width: "8px", height: "8px", overflow: "hidden", position: "relative" }}>
                        <img
                          src={img || "/placeholder.svg"}
                          alt="crop"
                          style={{ position: "absolute", inset: "20% 10% 20% 10%" }}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "9px", color: "#15803D" }}>
                    Crop Health Check
                  </div>
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  height: "79.5px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background: "rgba(59,130,246,0.1)",
                  marginTop: "3px",
                  display: "flex",
                }}
              >
                <div style={{ width: "2.25px", background: "#3B82F6" }} />
                <div style={{ padding: "4.5px", width: "100%" }}>
                  <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#1E40AF" }}
                    >
                      10:00
                    </span>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#1E40AF" }}
                    >
                      AM
                    </span>
                    <div style={{ background: "#1E40AF", padding: "1.5px", borderRadius: "100px" }}>
                      <div style={{ width: "8px", height: "8px", overflow: "hidden", position: "relative" }}>
                        <img
                          src={img1 || "/placeholder.svg"}
                          alt="irrigation"
                          style={{ position: "absolute", inset: "20% 10% 20% 10%" }}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "9px", color: "#1E40AF" }}>
                    Irrigation System Check
                  </div>
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  height: "51px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background: "rgba(168,85,247,0.1)",
                  marginTop: "3px",
                  display: "flex",
                }}
              >
                <div style={{ width: "2.25px", background: "#A855F7" }} />
                <div style={{ padding: "4.5px", width: "100%" }}>
                  <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#7C3AED" }}
                    >
                      2:00
                    </span>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#7C3AED" }}
                    >
                      PM
                    </span>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "9px", color: "#7C3AED" }}>
                    Soil Analysis Report
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right card */}
        <div style={{ position: "absolute", left: "0px", top: "6.075px", width: "155.25px" }}>
          <div style={{ transform: "rotate(-5deg)", transformOrigin: "center" }}>
            <div
              style={{
                width: "155.25px",
                background: "#ffffff",
                borderRadius: "9px",
                padding: "6px",
                boxShadow:
                  "-8px 6px 11.3px rgba(0,0,0,0.12), 0px 0px 0px 1px rgba(0,0,0,0.08), 0px 2px 4px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "51px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background: "rgba(245,158,11,0.1)",
                  display: "flex",
                }}
              >
                <div style={{ width: "2.25px", background: "#F59E0B" }} />
                <div style={{ padding: "4.5px", width: "100%" }}>
                  <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#92400E" }}
                    >
                      9:00
                    </span>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#92400E" }}
                    >
                      AM
                    </span>
                    <div style={{ background: "#92400E", padding: "1.5px", borderRadius: "100px" }}>
                      <div style={{ width: "8px", height: "8px", overflow: "hidden", position: "relative" }}>
                        <img
                          src={img2 || "/placeholder.svg"}
                          alt="equipment"
                          style={{ position: "absolute", inset: "20% 10% 20% 10%" }}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "9px", color: "#92400E" }}>
                    Tractor Maintenance
                  </div>
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  height: "51px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background: "#FFE4E6",
                  display: "flex",
                  marginTop: "3px",
                }}
              >
                <div style={{ width: "2.25px", background: "#F43F5E" }} />
                <div style={{ padding: "4.5px", width: "100%" }}>
                  <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#BE123C" }}
                    >
                      4:00
                    </span>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#BE123C" }}
                    >
                      PM
                    </span>
                    <div style={{ background: "#BE123C", padding: "1.5px", borderRadius: "100px" }}>
                      <div style={{ width: "8px", height: "8px", overflow: "hidden", position: "relative" }}>
                        <img
                          src={img3 || "/placeholder.svg"}
                          alt="harvest"
                          style={{ position: "absolute", inset: "20% 10% 20% 10%" }}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "9px", color: "#BE123C" }}>
                    🌾 Harvest Planning
                  </div>
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  height: "79.5px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background: "rgba(34,197,94,0.1)",
                  display: "flex",
                  marginTop: "3px",
                }}
              >
                <div style={{ width: "2.25px", background: "#22C55E" }} />
                <div style={{ padding: "4.5px", width: "100%" }}>
                  <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#15803D" }}
                    >
                      6:00
                    </span>
                    <span
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "9px", color: "#15803D" }}
                    >
                      PM
                    </span>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "9px", color: "#15803D" }}>
                    🚜 Field Inspection Walk
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartSimpleBrilliant
