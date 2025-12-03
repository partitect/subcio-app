/**
 * Privacy Policy Page
 * 
 * Legal privacy policy content
 */

import {
  Box,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Shield, Calendar } from "lucide-react";
import { Navbar, Footer } from "../components/landing";

const LAST_UPDATED = "December 1, 2024";

const PRIVACY_SECTIONS = [
  {
    title: "1. Information We Collect",
    content: `We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.

**Personal Information:**
- Email address
- Name (optional)
- Payment information (processed securely via Stripe)
- Profile preferences

**Usage Information:**
- Log data (IP address, browser type, pages visited)
- Device information
- Usage patterns and preferences

**Content:**
- Video files you upload (processed temporarily)
- Subtitle files and configurations
- Project settings`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use the information we collect to:

- Provide, maintain, and improve our services
- Process transactions and send related information
- Send technical notices, updates, and support messages
- Respond to your comments, questions, and requests
- Monitor and analyze trends, usage, and activities
- Detect, investigate, and prevent fraudulent transactions and abuse
- Personalize and improve your experience`,
  },
  {
    title: "3. Information Sharing",
    content: `We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:

- **Service Providers:** With third-party vendors who assist in providing our services (e.g., Stripe for payments, cloud hosting)
- **Legal Requirements:** When required by law or to protect our rights
- **Business Transfers:** In connection with any merger, sale of company assets, or acquisition
- **Consent:** With your explicit consent`,
  },
  {
    title: "4. Data Security",
    content: `We implement appropriate technical and organizational measures to protect your personal information:

- Encryption of data in transit (TLS/SSL)
- Secure storage with access controls
- Regular security audits
- Employee training on data protection

However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.`,
  },
  {
    title: "5. Data Retention",
    content: `We retain your personal information for as long as your account is active or as needed to provide you services. We will retain and use your information as necessary to:

- Comply with legal obligations
- Resolve disputes
- Enforce our agreements

**Video Files:** Uploaded videos are processed temporarily and automatically deleted within 24 hours after processing is complete.

**Account Data:** Retained until you delete your account. Upon deletion, your data will be removed within 30 days.`,
  },
  {
    title: "6. Your Rights",
    content: `Depending on your location, you may have the following rights:

- **Access:** Request access to your personal information
- **Correction:** Request correction of inaccurate data
- **Deletion:** Request deletion of your personal information
- **Portability:** Request a copy of your data in a portable format
- **Objection:** Object to processing of your personal information
- **Withdraw Consent:** Withdraw consent where processing is based on consent

To exercise these rights, contact us at privacy@subcio.io`,
  },
  {
    title: "7. Cookies and Tracking",
    content: `We use cookies and similar technologies to:

- Keep you logged in
- Remember your preferences
- Understand how you use our services
- Improve our services

You can control cookies through your browser settings. See our Cookie Policy for more details.`,
  },
  {
    title: "8. International Transfers",
    content: `Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.`,
  },
  {
    title: "9. Children's Privacy",
    content: `Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it promptly.`,
  },
  {
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this policy periodically.`,
  },
  {
    title: "11. Contact Us",
    content: `If you have any questions about this Privacy Policy, please contact us:

**Email:** privacy@subcio.io
**Address:** [Your Business Address]

For GDPR-related inquiries, you may also contact our Data Protection Officer at dpo@subcio.io`,
  },
];

export default function PrivacyPolicyPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <Navbar />

      <Container maxWidth="md" sx={{ py: 8, flex: 1 }}>
        {/* Header */}
        <Stack spacing={3} sx={{ mb: 6 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
              }}
            >
              <Shield size={28} />
            </Box>
            <Typography variant="h3" fontWeight={800}>
              Privacy Policy
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
            <Calendar size={16} />
            <Typography variant="body2">
              Last updated: {LAST_UPDATED}
            </Typography>
          </Stack>
          <Typography variant="body1" color="text.secondary">
            At Subcio, we take your privacy seriously. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use our service.
          </Typography>
        </Stack>

        {/* Content */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            bgcolor: isDark ? "grey.900" : "grey.50",
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Stack spacing={4} divider={<Divider />}>
            {PRIVACY_SECTIONS.map((section) => (
              <Box key={section.title}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {section.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    whiteSpace: "pre-line",
                    "& strong": { fontWeight: 600, color: "text.primary" },
                  }}
                  dangerouslySetInnerHTML={{
                    __html: section.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                  }}
                />
              </Box>
            ))}
          </Stack>
        </Paper>
      </Container>

      <Footer />
    </Box>
  );
}
