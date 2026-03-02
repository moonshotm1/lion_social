import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#080808",
          borderRadius: "6px",
        }}
      >
        {/* Crown: 3-point shape via overlapping triangles + band */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0px",
          }}
        >
          {/* Three crown points */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0px" }}>
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "4px solid transparent",
                borderRight: "4px solid transparent",
                borderBottom: "9px solid #F5C842",
              }}
            />
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderBottom: "13px solid #F5C842",
                marginLeft: "-1px",
                marginRight: "-1px",
              }}
            />
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "4px solid transparent",
                borderRight: "4px solid transparent",
                borderBottom: "9px solid #F5C842",
              }}
            />
          </div>
          {/* Crown band */}
          <div
            style={{
              width: "22px",
              height: "6px",
              background: "#C8921A",
              borderRadius: "1px",
              marginTop: "-1px",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
