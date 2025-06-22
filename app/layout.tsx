import type React from "react"
import type { Metadata } from "next"
import { Oswald } from "next/font/google"
import "./globals.css"

const oswald = Oswald({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Método de Brent - Demostración Interactiva",
  description:
    "Demostración interactiva del método de Brent para encontrar raíces de funciones con visualizaciones y análisis detallado.",
  generator: "Next.js",
  keywords: ["método de Brent", "raíces de funciones", "análisis numérico", "matemáticas", "algoritmos"],
  authors: [{ name: "Brent Method Demo" }],
  openGraph: {
    title: "Método de Brent - Demostración Interactiva",
    description: "Algoritmo híbrido robusto para encontrar raíces de funciones con visualizaciones interactivas",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={oswald.className}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
