/**
 * Cookie Policy Page
 * 
 * Cookie usage and GDPR compliance information
 */

import {
  Box,
  Container,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Cookie, Calendar } from "lucide-react";
import { Navbar, Footer } from "../components/landing";

const LAST_UPDATED = "December 1, 2024";

const COOKIE_TYPES = [
  {
    name: "Essential Cookies",
    description: "Required for the website to function properly. Cannot be disabled.",
    examples: "Session ID, authentication tokens, CSRF tokens",
    duration: "Session / 7 days",
  },
  {
    name: "Functional Cookies",
    description: "Remember your preferences and settings.",
    examples: "Language preference, theme preference, editor settings",
    duration: "1 year",
  },
  {
    name: "Analytics Cookies",
    description: "Help us understand how visitors use our website.",
    examples: "Google Analytics, page views, user journey",
    duration: "2 years",
  },
  {
    name: "Marketing Cookies",
    description: "Used to deliver relevant advertisements.",
    examples: "Ad targeting, conversion tracking",
    duration: "90 days",
  },
];

const COOKIE_SECTIONS = [
  {
    title: "1. What Are Cookies?",
    content: `Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.

**Types of cookies:**
- **Session cookies:** Temporary cookies that expire when you close your browser
- **Persistent cookies:** Remain on your device for a set period or until you delete them
- **First-party cookies:** Set by the website you're visiting
- **Third-party cookies:** Set by external services used on the website`,
  },
  {
    title: "2. How We Use Cookies",
    content: `We use cookies to:

- **Keep you signed in:** Remember your login status across pages
- **Remember preferences:** Store your language, theme, and other settings
- **Improve performance:** Load pages faster by caching content
- **Analyze usage:** Understand how visitors use our site to improve it
- **Security:** Protect against fraud and unauthorized access

We do NOT use cookies to:
- Collect sensitive personal information without consent
- Share data with third parties for advertising without your knowledge
- Track your activity across other websites without consent`,
  },
  {
    title: "3. Cookie Categories",
    content: `We categorize our cookies into four main types. See the table below for details about each category.`,
    showTable: true,
  },
  {
    title: "4. Third-Party Cookies",
    content: `Some cookies are placed by third-party services that appear on our pages:

**Stripe (Payments):**
- Purpose: Secure payment processing
- Privacy Policy: https://stripe.com/privacy

**Google Analytics:**
- Purpose: Website analytics and usage statistics
- Privacy Policy: https://policies.google.com/privacy
- Opt-out: https://tools.google.com/dlpage/gaoptout

**Google/GitHub OAuth:**
- Purpose: Social login functionality
- Set only when you use social login`,
  },
  {
    title: "5. Managing Cookies",
    content: `You have several options to manage cookies:

**Browser Settings:**
Most browsers allow you to:
- View what cookies are set
- Delete individual or all cookies
- Block third-party cookies
- Block all cookies from certain sites
- Block all cookies (may affect website functionality)

**Browser-specific instructions:**
- **Chrome:** Settings → Privacy and Security → Cookies
- **Firefox:** Settings → Privacy & Security → Cookies
- **Safari:** Preferences → Privacy → Cookies
- **Edge:** Settings → Cookies and site permissions

**Our Cookie Settings:**
You can manage non-essential cookies through our cookie consent banner that appears when you first visit our site.`,
  },
  {
    title: "6. Cookie Consent",
    content: `When you first visit Subcio, we ask for your consent to use non-essential cookies. You can:

- **Accept all:** Enable all cookie categories
- **Customize:** Choose which categories to enable
- **Reject non-essential:** Only essential cookies will be used

You can change your preferences at any time by clicking the cookie icon in the footer or by clearing your cookies and revisiting the site.`,
  },
  {
    title: "7. Do Not Track",
    content: `Some browsers have a "Do Not Track" (DNT) feature. We currently do not respond to DNT signals, as there is no industry-standard for compliance.

However, you can opt out of tracking by:
- Using our cookie preferences
- Installing browser extensions that block trackers
- Using private/incognito browsing mode`,
  },
  {
    title: "8. Updates to This Policy",
    content: `We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons.

Changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.`,
  },
  {
    title: "9. Contact Us",
    content: `If you have questions about our use of cookies, please contact us:

**Email:** privacy@subcio.io
**Address:** [Your Business Address]

For EU residents with GDPR-related inquiries, contact our Data Protection Officer at dpo@subcio.io`,
  },
];

export default function CookiePolicyPage() {
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
              <Cookie size={28} />
            </Box>
            <Typography variant="h3" fontWeight={800}>
              Cookie Policy
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
            <Calendar size={16} />
            <Typography variant="body2">
              Last updated: {LAST_UPDATED}
            </Typography>
          </Stack>
          <Typography variant="body1" color="text.secondary">
            This Cookie Policy explains how Subcio uses cookies and similar technologies
            to recognize you when you visit our website.
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
            {COOKIE_SECTIONS.map((section) => (
              <Box key={section.title}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {section.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    whiteSpace: "pre-line",
                    mb: section.showTable ? 3 : 0,
                    "& strong": { fontWeight: 600, color: "text.primary" },
                  }}
                  dangerouslySetInnerHTML={{
                    __html: section.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                  }}
                />

                {/* Cookie Types Table */}
                {section.showTable && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Purpose</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Examples</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {COOKIE_TYPES.map((cookie) => (
                          <TableRow key={cookie.name}>
                            <TableCell sx={{ fontWeight: 600 }}>{cookie.name}</TableCell>
                            <TableCell>{cookie.description}</TableCell>
                            <TableCell sx={{ fontSize: "0.75rem" }}>{cookie.examples}</TableCell>
                            <TableCell>{cookie.duration}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>
      </Container>

      <Footer />
    </Box>
  );
}
