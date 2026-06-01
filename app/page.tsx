import type { Metadata } from "next"
import { LandingNav } from "@/components/landing/landing-nav"
import { HeroSection } from "@/components/landing/hero-section"
import { ProblemSection } from "@/components/landing/problem-section"
import { BeforeAfterSection } from "@/components/landing/before-after-section"
import { SolutionSection } from "@/components/landing/solution-section"
import { HowItWorksSection } from "@/components/landing/how-it-works"
import { FeaturesSection } from "@/components/landing/features-section"
import { WorkshopSection } from "@/components/landing/workshop-section"
import { InventorySalesSection } from "@/components/landing/inventory-sales-section"
import { CustomizationSection } from "@/components/landing/customization-section"
import { PilotCaseSection } from "@/components/landing/pilot-case-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { FAQSection } from "@/components/landing/faq-section"
import { CTASection } from "@/components/landing/cta-section"
import { LandingFooter } from "@/components/landing/landing-footer"

export const metadata: Metadata = {
  title: "ScooterGestor — Sistema para Lojas e Oficinas de Scooters Elétricas",
  description:
    "Controle vendas, estoque, clientes, ordens de serviço, garantias e financeiro em uma plataforma moderna feita para lojas de scooters elétricas.",
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-navy">
      <LandingNav />
      <HeroSection />
      <ProblemSection />
      <BeforeAfterSection />
      <SolutionSection />
      <HowItWorksSection />
      <FeaturesSection />
      <WorkshopSection />
      <InventorySalesSection />
      <CustomizationSection />
      <PilotCaseSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <LandingFooter />
    </div>
  )
}
