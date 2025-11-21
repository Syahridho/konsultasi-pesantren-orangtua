import { ImageResponse } from "next/og";

// Export as named function instead of default export
export function generateIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#10B981",
          borderRadius: "50%",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="512" height="512" rx="120" fill="#10B981" />

          <g transform="translate(106, 106) scale(0.6)">
            <path
              d="M430 350C430 350 360 340 250 380C140 340 70 350 70 350V100C70 100 140 90 250 130C360 90 430 100 430 100V350Z"
              stroke="white"
              stroke-width="40"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            />
            <path
              d="M250 130V380"
              stroke="white"
              stroke-width="40"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <path
              d="M220 50C230 40 270 40 280 50"
              stroke="white"
              stroke-width="30"
              stroke-linecap="round"
            />
            <path
              d="M190 20C210 -5 290 -5 310 20"
              stroke="white"
              stroke-width="30"
              stroke-linecap="round"
            />
          </g>
        </svg>
      </div>
    ),
    {
      width: 32,
      height: 32,
    }
  );
}

// Also export as default for compatibility
export default generateIcon;

export const contentType = "image/png";
export const size = { width: 32, height: 32 };
