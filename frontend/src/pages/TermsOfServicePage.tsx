/**
 * Terms of Service Page
 * 
 * Legal terms and conditions
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
import { FileText, Calendar } from "lucide-react";
import { Navbar, Footer } from "../components/landing";

const LAST_UPDATED = "December 1, 2024";

const TERMS_SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using Subcio ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.

These Terms apply to all visitors, users, and others who access or use the Service. By using the Service, you represent that you are at least 18 years old or have the consent of a parent or guardian.`,
  },
  {
    title: "2. Description of Service",
    content: `Subcio provides an AI-powered subtitle generation and styling service that allows users to:

- Upload video/audio files for transcription
- Generate styled subtitles with various effects
- Export subtitles in multiple formats (ASS, SRT, VTT)
- Manage subtitle projects

We reserve the right to modify, suspend, or discontinue the Service at any time without notice.`,
  },
  {
    title: "3. User Accounts",
    content: `**Account Creation:**
- You must provide accurate, complete, and current information
- You are responsible for maintaining the confidentiality of your account
- You are responsible for all activities that occur under your account
- You must notify us immediately of any unauthorized use

**Account Termination:**
We may terminate or suspend your account at any time for violations of these Terms, without prior notice or liability.`,
  },
  {
    title: "4. Subscription and Payments",
    content: `**Subscription Plans:**
- Free tier with limited features and usage
- Paid plans with additional features and higher limits
- Enterprise plans with custom features

**Billing:**
- Payments are processed securely through Stripe
- Subscriptions auto-renew unless cancelled
- Prices may change with 30 days notice

**Refunds:**
- Refund requests must be made within 7 days of purchase
- Refunds are provided at our discretion
- No refunds for partial subscription periods`,
  },
  {
    title: "5. User Content",
    content: `**Your Content:**
- You retain ownership of content you upload
- You grant us a license to process your content to provide the Service
- You are responsible for the legality of your content

**Content Restrictions:**
You may not upload content that:
- Infringes on intellectual property rights
- Contains illegal material
- Contains malware or harmful code
- Violates any applicable laws

**Content Removal:**
We may remove content that violates these Terms without notice.`,
  },
  {
    title: "6. Intellectual Property",
    content: `**Our Property:**
- The Service, including all features, functionality, and content created by us, is owned by Subcio
- Our trademarks, logos, and service names may not be used without permission

**Your License:**
- We grant you a limited, non-exclusive, non-transferable license to use the Service
- This license is revocable and subject to these Terms

**Generated Content:**
- Subtitles generated using our Service may be used freely by you
- We retain no ownership over your generated subtitles`,
  },
  {
    title: "7. Prohibited Uses",
    content: `You agree not to:

- Use the Service for any illegal purpose
- Attempt to gain unauthorized access to the Service
- Interfere with or disrupt the Service
- Use automated systems to access the Service excessively
- Reverse engineer or attempt to extract source code
- Resell or redistribute the Service without authorization
- Use the Service to compete with us
- Harass, abuse, or harm others through the Service`,
  },
  {
    title: "8. API Usage",
    content: `If you access our API:

- You must comply with our API documentation and rate limits
- API keys are confidential and must not be shared
- We may revoke API access for violations
- Excessive API usage may result in throttling or suspension`,
  },
  {
    title: "9. Disclaimers",
    content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.

We do not warrant that:
- The Service will be uninterrupted or error-free
- Results will be accurate or reliable
- The Service will meet your requirements

**AI Limitations:**
Our AI-powered transcription may contain errors. You are responsible for reviewing and correcting generated content.`,
  },
  {
    title: "10. Limitation of Liability",
    content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, SUBCIO SHALL NOT BE LIABLE FOR:

- Any indirect, incidental, special, consequential, or punitive damages
- Loss of profits, data, use, or goodwill
- Service interruptions or data loss
- Actions of third parties

Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.`,
  },
  {
    title: "11. Indemnification",
    content: `You agree to indemnify and hold harmless Subcio and its affiliates, officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from:

- Your use of the Service
- Your violation of these Terms
- Your violation of any third-party rights
- Your uploaded content`,
  },
  {
    title: "12. Governing Law",
    content: `These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.

Any disputes arising from these Terms shall be resolved through binding arbitration, except where prohibited by law.`,
  },
  {
    title: "13. Changes to Terms",
    content: `We reserve the right to modify these Terms at any time. We will provide notice of material changes by:

- Posting the updated Terms on our website
- Sending an email to registered users
- Displaying a notice in the Service

Continued use of the Service after changes constitutes acceptance of the new Terms.`,
  },
  {
    title: "14. Contact Information",
    content: `For questions about these Terms, please contact us:

**Email:** legal@subcio.io
**Address:** [Your Business Address]`,
  },
];

export default function TermsOfServicePage() {
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
              <FileText size={28} />
            </Box>
            <Typography variant="h3" fontWeight={800}>
              Terms of Service
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
            <Calendar size={16} />
            <Typography variant="body2">
              Last updated: {LAST_UPDATED}
            </Typography>
          </Stack>
          <Typography variant="body1" color="text.secondary">
            Please read these Terms of Service carefully before using Subcio. By using our Service,
            you agree to be bound by these terms.
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
            {TERMS_SECTIONS.map((section) => (
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
