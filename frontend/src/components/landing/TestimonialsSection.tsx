/**
 * Testimonials Section Component
 * 
 * Customer reviews and social proof
 */

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Rating,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { MessageSquareQuote, Star } from "lucide-react";
import { TESTIMONIALS } from "../../config/pricing";

export function TestimonialsSection() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{ py: 10 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Stack spacing={2} alignItems="center" sx={{ mb: 8, textAlign: "center" }}>
          <Chip
            icon={<MessageSquareQuote size={14} />}
            label="Testimonials"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{ fontSize: { xs: "1.75rem", md: "2.5rem" } }}
          >
            Loved by creators worldwide
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 500, fontWeight: 500 }}
          >
            Join thousands of content creators who trust Subcio for their subtitles.
          </Typography>
        </Stack>

        {/* Testimonials Grid */}
        <Grid container spacing={3}>
          {TESTIMONIALS.map((testimonial, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card
                sx={{
                  height: "100%",
                  bgcolor: "background.paper",
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: isDark
                      ? `0 20px 40px ${alpha("#000", 0.3)}`
                      : `0 20px 40px ${alpha(theme.palette.primary.main, 0.1)}`,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Rating
                    value={testimonial.rating}
                    readOnly
                    size="small"
                    sx={{ mb: 2 }}
                    icon={<Star size={16} fill={theme.palette.warning.main} color={theme.palette.warning.main} />}
                    emptyIcon={<Star size={16} color={alpha(theme.palette.warning.main, 0.3)} />}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 3,
                      fontStyle: "italic",
                      color: "text.secondary",
                      lineHeight: 1.7,
                    }}
                  >
                    "{testimonial.content}"
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={testimonial.avatar}
                      sx={{
                        width: 44,
                        height: 44,
                        border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      }}
                    />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Trust Badges */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={4}
          justifyContent="center"
          alignItems="center"
          sx={{ mt: 8, pt: 6, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" fontWeight={800} color="primary.main">
              10,000+
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Users
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" fontWeight={800} color="primary.main">
              50,000+
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Videos Created
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" fontWeight={800} color="primary.main">
              4.9/5
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Average Rating
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" fontWeight={800} color="primary.main">
              99.9%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Uptime
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

export default TestimonialsSection;
