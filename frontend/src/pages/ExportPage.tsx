import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import { Download, ArrowLeft, Plus } from "lucide-react";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";

export default function ExportPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const videoUrl = useMemo(() => (location.state as any)?.videoUrl as string | undefined, [location.state]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary", display: "flex", alignItems: "center", py: 8 }}>
      <Container maxWidth="md">
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, boxShadow: "0 12px 36px rgba(0,0,0,0.25)" }}>
          <Typography variant="overline" color="text.secondary" letterSpacing="0.2em">
            Export Ready
          </Typography>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Your video is ready
          </Typography>

          {videoUrl ? (
            <Box
              component="video"
              src={videoUrl}
              controls
              sx={{
                width: "100%",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                mb: 3,
                overflow: "hidden",
              }}
            />
          ) : (
            <Box
              sx={{
                height: 220,
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
                display: "grid",
                placeItems: "center",
                color: "text.secondary",
                mb: 3,
              }}
            >
              Provide a video to preview here.
            </Box>
          )}

          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {videoUrl && (
              <Button
                component="a"
                href={videoUrl}
                download={`pycaps-${projectId || "export"}.mp4`}
                variant="contained"
                startIcon={<Download size={16} />}
              >
                Download
              </Button>
            )}
            <Button variant="outlined" startIcon={<ArrowLeft size={16} />} onClick={() => navigate(`/editor/${projectId || "latest"}`)}>
              Back to Editor
            </Button>
            <Button variant="outlined" startIcon={<Plus size={16} />} onClick={() => navigate("/upload")}>
              New Project
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
