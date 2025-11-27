/**
 * Landing Page - Subcio SaaS
 * 
 * Professional landing page with pricing, features, testimonials
 */

import { Box } from "@mui/material";
import {
  Navbar,
  HeroSection,
  FeaturesSection,
  PricingSection,
  TestimonialsSection,
  FAQSection,
  CTASection,
  Footer,
} from "../components/landing";

export default function LandingPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <Box id="pricing">
        <PricingSection />
      </Box>
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </Box>
  );
}
