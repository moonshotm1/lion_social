import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Crown points */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "0px",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "22px solid transparent",
                borderRight: "22px solid transparent",
                borderBottom: "55px solid #F5C842",
              }}
            />
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "26px solid transparent",
                borderRight: "26px solid transparent",
                borderBottom: "70px solid #F5C842",
                marginLeft: "-8px",
                marginRight: "-8px",
              }}
            />
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "22px solid transparent",
                borderRight: "22px solid transparent",
                borderBottom: "55px solid #F5C842",
              }}
            />
          </div>
          {/* Crown band */}
          <div
            style={{
              width: "130px",
              height: "32px",
              background: "#D4AA2A",
              borderRadius: "6px",
              marginTop: "-2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "24px",
            }}
          >
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "#0A0A0A",
              }}
            />
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "#0A0A0A",
              }}
            />
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "#0A0A0A",
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
