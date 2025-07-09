import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "ACTOGRAM ",
  description: "Real-time chat application built with Next.js",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <title>ACTOGRAM</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          {`
            [id^="v0-built-with-button"] {
              display: none !important;
              visibility: hidden !important;
              pointer-events: none !important;
              opacity: 0 !important;
            }
          `}
        </style>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💬🅰</text></svg>"
        />
      </head>
      <body className={inter.className}>
        <div className="header" style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid #eee' }}>
          <button className="menu-btn" style={{ fontSize: '1.3rem', background: 'none', border: 'none', cursor: 'pointer', marginRight: '12px' }} title="Меню">
            ⋮
          </button>
          <span className="logo" style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>ACTOGRAM</span>
        </div>
        {children}
      </body>
    </html>
  )
}

