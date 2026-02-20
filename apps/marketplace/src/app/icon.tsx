import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#000',
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="22"
          height="20"
          viewBox="0 0 128 111"
          fill="white"
        >
          <polygon points="0,0 32,0 16,27.7" />
          <polygon points="32,0 64,0 48,27.7" />
          <polygon points="16,27.7 48,27.7 32,55.4" />
          <polygon points="64,0 96,0 80,27.7" />
          <polygon points="96,0 128,0 112,27.7" />
          <polygon points="80,27.7 112,27.7 96,55.4" />
          <polygon points="32,55.4 64,55.4 48,83.1" />
          <polygon points="64,55.4 96,55.4 80,83.1" />
          <polygon points="48,83.1 80,83.1 64,110.9" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
