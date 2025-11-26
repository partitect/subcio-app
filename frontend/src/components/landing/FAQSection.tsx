/**
 * FAQ Section Component
 * 
 * Frequently asked questions with accordion
 */

import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { ChevronDown, HelpCircle } from "lucide-react";
import { FAQ_ITEMS } from "../../config/pricing";

export function FAQSection() {
  const [expanded, setExpanded] = useState<string | false>("panel-0");
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const handleChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <Box sx={{ py: 10, bgcolor: isDark ? "grey.900" : "grey.50" }}>
      <Container maxWidth="md">
        {/* Header */}
        <Stack spacing={2} alignItems="center" sx={{ mb: 6, textAlign: "center" }}>
          <Chip
            icon={<HelpCircle size={14} />}
            label="FAQ"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{ fontSize: { xs: "1.75rem", md: "2.5rem" } }}
          >
            Frequently asked questions
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 500, fontWeight: 500 }}
          >
            Everything you need to know about PyCaps. Can't find the answer
            you're looking for? Contact our support team.
          </Typography>
        </Stack>

        {/* FAQ Accordion */}
        <Box>
          {FAQ_ITEMS.map((item, idx) => (
            <Accordion
              key={idx}
              expanded={expanded === `panel-${idx}`}
              onChange={handleChange(`panel-${idx}`)}
              sx={{
                bgcolor: "background.paper",
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 2,
                mb: 1.5,
                "&:before": { display: "none" },
                "&.Mui-expanded": {
                  margin: 0,
                  mb: 1.5,
                },
                boxShadow: "none",
                overflow: "hidden",
              }}
            >
              <AccordionSummary
                expandIcon={
                  <ChevronDown
                    size={20}
                    style={{
                      transition: "transform 0.3s ease",
                      transform:
                        expanded === `panel-${idx}` ? "rotate(180deg)" : "none",
                    }}
                  />
                }
                sx={{
                  px: 3,
                  py: 1,
                  "&.Mui-expanded": {
                    minHeight: 56,
                  },
                }}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {item.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

export default FAQSection;
