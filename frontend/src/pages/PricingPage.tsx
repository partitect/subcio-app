/**
 * Pricing Page
 * 
 * Standalone pricing page with full feature comparison
 */

import { Box, Container, Typography, alpha, useTheme } from "@mui/material";
import { Navbar, Footer, PricingSection, FAQSection } from "../components/landing";

export default function PricingPage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <Navbar />
      
      <Container maxWidth="lg" sx={{ pt: 8 }}>
        <PricingSection />
      </Container>

      <FAQSection />
      <Footer />
    </Box>
  );
}
