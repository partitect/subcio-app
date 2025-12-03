/**
 * Contact Page
 * 
 * Contact form and support information
 */

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Mail,
  MessageSquare,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  Headphones,
  FileQuestion,
  Bug,
} from "lucide-react";
import { Navbar, Footer } from "../components/landing";

const CONTACT_INFO = [
  {
    icon: Mail,
    title: "Email",
    value: "support@subcio.io",
    description: "For general inquiries",
  },
  {
    icon: Headphones,
    title: "Technical Support",
    value: "help@subcio.io",
    description: "For technical issues",
  },
  {
    icon: Clock,
    title: "Response Time",
    value: "24-48 hours",
    description: "Business days",
  },
];

const SUPPORT_TOPICS = [
  { value: "general", label: "General Inquiry", icon: MessageSquare },
  { value: "technical", label: "Technical Support", icon: Headphones },
  { value: "billing", label: "Billing Question", icon: FileQuestion },
  { value: "bug", label: "Bug Report", icon: Bug },
  { value: "feature", label: "Feature Request", icon: Send },
];

export default function ContactPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    topic: "general",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // TODO: Implement actual form submission
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In production, send to backend:
      // await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      setIsSubmitted(true);
    } catch (err) {
      setError("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <Container maxWidth="lg" sx={{ py: 8, flex: 1 }}>
        {/* Header */}
        <Stack spacing={2} sx={{ mb: 6, textAlign: "center" }}>
          <Typography variant="h3" fontWeight={800}>
            Get in Touch
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
            Have a question or need help? We're here for you. Fill out the form below
            and we'll get back to you as soon as possible.
          </Typography>
        </Stack>

        <Grid container spacing={4}>
          {/* Contact Info Cards */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {CONTACT_INFO.map((info) => {
                const Icon = info.icon;
                return (
                  <Card
                    key={info.title}
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      bgcolor: isDark ? "grey.900" : "grey.50",
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: "primary.main",
                          }}
                        >
                          <Icon size={24} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {info.title}
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {info.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {info.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}

              {/* FAQ Card */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Looking for quick answers?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Check out our FAQ section for answers to commonly asked questions.
                    </Typography>
                    <Button
                      href="/#faq"
                      variant="outlined"
                      size="small"
                      sx={{ alignSelf: "flex-start" }}
                    >
                      View FAQ
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Contact Form */}
          <Grid item xs={12} md={8}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                bgcolor: isDark ? "grey.900" : "grey.50",
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                {isSubmitted ? (
                  <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: "50%",
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: "success.main",
                      }}
                    >
                      <CheckCircle size={48} />
                    </Box>
                    <Typography variant="h5" fontWeight={700}>
                      Message Sent!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                      Thank you for reaching out. We'll get back to you within 24-48 business hours.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({
                          name: "",
                          email: "",
                          topic: "general",
                          subject: "",
                          message: "",
                        });
                      }}
                    >
                      Send Another Message
                    </Button>
                  </Stack>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                      <Typography variant="h6" fontWeight={700}>
                        Send us a message
                      </Typography>

                      {error && (
                        <Alert severity="error" onClose={() => setError("")}>
                          {error}
                        </Alert>
                      )}

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Your Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Email Address"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </Grid>
                      </Grid>

                      {/* Topic Selection */}
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Topic
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                          {SUPPORT_TOPICS.map((topic) => {
                            const Icon = topic.icon;
                            const isSelected = formData.topic === topic.value;
                            return (
                              <Button
                                key={topic.value}
                                variant={isSelected ? "contained" : "outlined"}
                                size="small"
                                startIcon={<Icon size={16} />}
                                onClick={() =>
                                  setFormData((prev) => ({ ...prev, topic: topic.value }))
                                }
                                sx={{
                                  borderRadius: 2,
                                  textTransform: "none",
                                }}
                              >
                                {topic.label}
                              </Button>
                            );
                          })}
                        </Stack>
                      </Box>

                      <TextField
                        fullWidth
                        label="Subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      />

                      <TextField
                        fullWidth
                        label="Message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        multiline
                        rows={5}
                        placeholder="Describe your question or issue in detail..."
                      />

                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? null : <Send size={20} />}
                        sx={{
                          py: 1.5,
                          borderRadius: 2,
                          fontWeight: 600,
                        }}
                      >
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </Button>

                      <Typography variant="caption" color="text.secondary">
                        By submitting this form, you agree to our{" "}
                        <a href="/privacy" style={{ color: theme.palette.primary.main }}>
                          Privacy Policy
                        </a>
                        .
                      </Typography>
                    </Stack>
                  </form>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
}
