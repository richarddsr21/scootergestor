import type { Metadata } from "next"
import { Syne, Outfit, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
})

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
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
    url: "https://scootergestor.com.br",
    siteName: "ScooterGestor",
    locale: "pt_BR",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${syne.variable} ${outfit.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
