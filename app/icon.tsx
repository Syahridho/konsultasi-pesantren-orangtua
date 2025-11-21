import { ImageResponse } from "next/og";

export default function generateIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: "50%",
          fontWeight: "bold",
        }}
      >
        P
      </div>
    ),
    {
      width: 32,
      height: 32,
    }
  );
}

export const contentType = "image/png";
export const size = { width: 32, height: 32 };
