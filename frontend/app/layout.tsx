
//app/layout.tsx
import "./globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>

        {/* Content Area */}
        <main className="flex-1">
          {children}
        </main>

        {/* Global Bottom Footer */}
        {/* <footer className="border-t py-3 text-center text-sm text-muted-foreground">
          Built by Fiber@home Software Team Version 1.0
        </footer> */}

      </body>
    </html>
  )
}



