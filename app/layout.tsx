import type { Metadata } from "next"
import { Poppins, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/providers/theme-provider"
import "./globals.css"

const poppins = Poppins({
  variable: "--font-poppins-public",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "ScooterGestor — Sistema para Lojas de Scooters Elétricas",
    template: "%s | ScooterGestor",
  },
  description:
    "Sistema completo para lojas e oficinas de scooters elétricas. Controle vendas, estoque, clientes, ordens de serviço, garantias e financeiro em uma única plataforma.",
  keywords: ["scooter elétrica", "gestão de loja", "ordem de serviço", "oficina", "estoque", "PDV"],
  openGraph: {
    title: "ScooterGestor",
    description: "Sistema completo para lojas e oficinas de scooters elétricas.",
    url: "https://scootergestor.vercel.app",
    siteName: "ScooterGestor",
    locale: "pt_BR",
    type: "website",
  },
  verification: {
    google: "5jnKnCAhRBHYb5kMM9jICsnDjncmhSNxMs5Se5iDe2o",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${poppins.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
