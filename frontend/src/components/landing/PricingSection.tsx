/**
 * PricingSection Component
 * 
 * Displays subscription plans with pricing toggle (monthly/yearly)
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Switch,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Check, Sparkles, Zap } from "lucide-react";
import { PRICING_PLANS, PricingPlan } from "../../config/pricing";

interface PricingSectionProps {
  onSelectPlan?: (planId: string) => void;
}

export function PricingSection({ onSelectPlan }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(true);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const formatPrice = (plan: PricingPlan) => {
    const price = isYearly ? plan.price.yearly / 12 : plan.price.monthly;
    if (price === 0) return "Free";
    return `$${Math.round(price)}`;
  };

  const getYearlySavings = (plan: PricingPlan) => {
    if (plan.price.monthly === 0) return null;
    const monthlyCost = plan.price.monthly * 12;
    const yearlyCost = plan.price.yearly;
    const savings = Math.round(((monthlyCost - yearlyCost) / monthlyCost) * 100);
    return savings > 0 ? savings : null;
  };

  return (
    <Box sx={{ py: 8, px: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Stack spacing={2} alignItems="center" sx={{ mb: 6, textAlign: "center" }}>
        <Chip
          icon={<Sparkles size={14} />}
          label="Pricing"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
        <Typography
          variant="h3"
          fontWeight={800}
          sx={{ fontSize: { xs: "1.75rem", md: "2.5rem" } }}
        >
          Simple, transparent pricing
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 500, fontWeight: 500 }}
        >
          Start free and upgrade as you grow. All plans include a 7-day free trial.
        </Typography>

        {/* Billing Toggle */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            color={!isYearly ? "primary.main" : "text.secondary"}
          >
            Monthly
          </Typography>
          <Switch
            checked={isYearly}
            onChange={() => setIsYearly(!isYearly)}
            color="primary"
          />
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography
              variant="body2"
              fontWeight={600}
              color={isYearly ? "primary.main" : "text.secondary"}
            >
              Yearly
            </Typography>
            <Chip
              label="Save 20%"
              size="small"
              color="success"
              sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }}
            />
          </Stack>
        </Stack>
      </Stack>

      {/* Pricing Cards */}
      <Grid container spacing={3} justifyContent="center" sx={{ pt: 3 }}>
        {PRICING_PLANS.map((plan) => {
          const savings = getYearlySavings(plan);

          return (
            <Grid item xs={12} sm={6} lg={3} key={plan.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  overflow: "visible",
                  borderRadius: 3,
                  border: plan.popular
                    ? `2px solid ${theme.palette.primary.main}`
                    : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  bgcolor: plan.popular
                    ? alpha(theme.palette.primary.main, 0.03)
                    : "background.paper",
                  boxShadow: plan.popular
                    ? `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`
                    : isDark
                    ? "0 8px 32px rgba(0,0,0,0.3)"
                    : "0 4px 24px rgba(0,0,0,0.06)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: `0 24px 48px ${alpha(
                      theme.palette.primary.main,
                      0.2
                    )}`,
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: 3,
                    pt: plan.badge ? 4 : 3,
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    position: "relative",
                  }}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <Chip
                      label={plan.badge}
                      color={plan.popular ? "primary" : "default"}
                      size="small"
                      icon={plan.popular ? <Zap size={12} /> : undefined}
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        fontWeight: 700,
                        fontSize: "0.7rem",
                      }}
                    />
                  )}

                  {/* Plan Name */}
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3, minHeight: 40 }}
                  >
                    {plan.description}
                  </Typography>

                  {/* Price */}
                  <Box sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="baseline" spacing={0.5}>
                      <Typography
                        variant="h3"
                        fontWeight={800}
                        sx={{ fontSize: { xs: "2rem", md: "2.5rem" } }}
                      >
                        {formatPrice(plan)}
                      </Typography>
                      {plan.price.monthly > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          /month
                        </Typography>
                      )}
                    </Stack>
                    {isYearly && savings && (
                      <Typography variant="caption" color="success.main" fontWeight={600}>
                        Save {savings}% with yearly billing
                      </Typography>
                    )}
                    {isYearly && plan.price.yearly > 0 && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        ${plan.price.yearly} billed annually
                      </Typography>
                    )}
                  </Box>

                  {/* CTA Button */}
                  <Button
                    component={Link}
                    to={plan.id === "enterprise" ? "/contact" : "/signup"}
                    variant={plan.ctaVariant}
                    color="primary"
                    size="large"
                    fullWidth
                    sx={{
                      mb: 3,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 700,
                      ...(plan.popular && {
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        "&:hover": {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                        },
                      }),
                    }}
                    onClick={() => onSelectPlan?.(plan.id)}
                  >
                    {plan.cta}
                  </Button>

                  {/* Features */}
                  <Stack spacing={1.5} sx={{ flex: 1 }}>
                    {plan.features.map((feature, idx) => (
                      <Stack
                        key={idx}
                        direction="row"
                        spacing={1.5}
                        alignItems="flex-start"
                      >
                        <Check
                          size={16}
                          style={{
                            color: theme.palette.success.main,
                            marginTop: 2,
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {feature}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default PricingSection;
