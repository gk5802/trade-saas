import './styles/globals.css'

export const metadata = {
  title: 'wkt3 Messenger',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          {children}
        </div>
      </body>
    </html>
  )
}