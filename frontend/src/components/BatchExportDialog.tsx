/**
 * Batch Export Dialog Component
 * 
 * Allows users to select multiple projects and export them in a queue.
 * Shows real-time progress for each export job.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  LinearProgress,
  Typography,
  Box,
  Stack,
  Chip,
  TextField,
  MenuItem,
  Alert,
  IconButton,
  Divider,
  alpha,
} from "@mui/material";
import {
  Download,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Play,
  Square,
  Trash2,
  RefreshCw,
} from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

interface Project {
  id: string;
  name: string;
  created_at?: string;
  thumbnail?: string;
}

interface ExportJob {
  id: string;
  project_id: string;
  project_name: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  error?: string;
  output_path?: string;
}

interface BatchExport {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  total_progress: number;
  completed_count: number;
  failed_count: number;
  total_count: number;
  current_job_index: number;
  jobs: ExportJob[];
  created_at: string;
}

interface BatchExportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function BatchExportDialog({ open, onClose }: BatchExportDialogProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [resolution, setResolution] = useState("1080p");
  const [loading, setLoading] = useState(false);
  const [activeBatch, setActiveBatch] = useState<BatchExport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "progress">("select");

  // Load projects
  useEffect(() => {
    if (open && step === "select") {
      axios
        .get(`${API_BASE}/projects`)
        .then((res) => setProjects(res.data || []))
        .catch((err) => {
          console.error("Failed to load projects", err);
          setError("Failed to load projects");
        });
    }
  }, [open, step]);

  // Poll batch status
  useEffect(() => {
    if (!activeBatch || !["pending", "processing"].includes(activeBatch.status)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/batch-export/${activeBatch.id}`);
        setActiveBatch(res.data);
        
        if (!["pending", "processing"].includes(res.data.status)) {
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Failed to poll batch status", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBatch?.id, activeBatch?.status]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === projects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projects.map((p) => p.id)));
    }
  };

  const handleStartExport = async () => {
    if (selectedIds.size === 0) {
      setError("Please select at least one project");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${API_BASE}/batch-export`, {
        project_ids: Array.from(selectedIds),
        resolution,
      });

      // Fetch full batch details
      const batchRes = await axios.get(`${API_BASE}/batch-export/${res.data.batch_id}`);
      setActiveBatch(batchRes.data);
      setStep("progress");
    } catch (err: any) {
      console.error("Failed to start batch export", err);
      setError(err.response?.data?.detail || "Failed to start export");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!activeBatch) return;

    try {
      await axios.post(`${API_BASE}/batch-export/${activeBatch.id}/cancel`);
      const res = await axios.get(`${API_BASE}/batch-export/${activeBatch.id}`);
      setActiveBatch(res.data);
    } catch (err) {
      console.error("Failed to cancel batch", err);
    }
  };

  const handleDownload = async (projectId: string, projectName: string) => {
    if (!activeBatch) return;

    try {
      const response = await axios.get(
        `${API_BASE}/batch-export/${activeBatch.id}/download/${projectId}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${projectName}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const handleClose = () => {
    setStep("select");
    setActiveBatch(null);
    setSelectedIds(new Set());
    setError(null);
    onClose();
  };

  const handleReset = () => {
    setStep("select");
    setActiveBatch(null);
    setError(null);
  };

  const getStatusIcon = (status: ExportJob["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={18} color="#4caf50" />;
      case "failed":
        return <XCircle size={18} color="#f44336" />;
      case "processing":
        return <Loader2 size={18} className="animate-spin" color="#2196f3" />;
      case "cancelled":
        return <Square size={18} color="#9e9e9e" />;
      default:
        return <Clock size={18} color="#9e9e9e" />;
    }
  };

  const getStatusColor = (status: BatchExport["status"]) => {
    switch (status) {
      case "completed":
        return "success";
      case "failed":
        return "error";
      case "processing":
        return "primary";
      case "cancelled":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "80vh",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Download size={24} />
        Batch Export
        <Box sx={{ flex: 1 }} />
        <IconButton size="small" onClick={handleClose}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {step === "select" && (
          <>
            <Stack spacing={2}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Select projects to export ({selectedIds.size} selected)
                </Typography>
                <Button size="small" onClick={handleSelectAll}>
                  {selectedIds.size === projects.length ? "Deselect All" : "Select All"}
                </Button>
              </Box>

              <List
                sx={{
                  maxHeight: 300,
                  overflow: "auto",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                {projects.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary="No projects found"
                      secondary="Create a project first"
                    />
                  </ListItem>
                ) : (
                  projects.map((project) => (
                    <ListItemButton
                      key={project.id}
                      onClick={() => handleToggle(project.id)}
                      dense
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedIds.has(project.id)}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={project.name || project.id}
                        secondary={project.created_at ? new Date(project.created_at).toLocaleDateString() : undefined}
                      />
                    </ListItemButton>
                  ))
                )}
              </List>

              <TextField
                select
                label="Resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                size="small"
                fullWidth
              >
                <MenuItem value="720p">720p (HD)</MenuItem>
                <MenuItem value="1080p">1080p (Full HD)</MenuItem>
                <MenuItem value="1440p">1440p (2K)</MenuItem>
                <MenuItem value="2160p">2160p (4K)</MenuItem>
              </TextField>
            </Stack>
          </>
        )}

        {step === "progress" && activeBatch && (
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Chip
                label={activeBatch.status.toUpperCase()}
                color={getStatusColor(activeBatch.status) as any}
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                {activeBatch.completed_count + activeBatch.failed_count} / {activeBatch.total_count} completed
              </Typography>
            </Box>

            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2">Overall Progress</Typography>
                <Typography variant="body2">{Math.round(activeBatch.total_progress)}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={activeBatch.total_progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Divider />

            <List sx={{ maxHeight: 300, overflow: "auto" }}>
              {activeBatch.jobs.map((job, idx) => (
                <ListItem
                  key={job.id}
                  sx={{
                    bgcolor:
                      job.status === "processing"
                        ? (theme) => alpha(theme.palette.primary.main, 0.1)
                        : "transparent",
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                  secondaryAction={
                    job.status === "completed" ? (
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(job.project_id, job.project_name)}
                      >
                        <Download size={18} />
                      </IconButton>
                    ) : null
                  }
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getStatusIcon(job.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={job.project_name}
                    secondary={
                      job.status === "processing" ? (
                        <LinearProgress
                          variant="determinate"
                          value={job.progress}
                          sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                        />
                      ) : job.error ? (
                        <Typography variant="caption" color="error">
                          {job.error}
                        </Typography>
                      ) : null
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {step === "select" && (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleStartExport}
              disabled={loading || selectedIds.size === 0}
              startIcon={loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
            >
              {loading ? "Starting..." : `Export ${selectedIds.size} Project${selectedIds.size !== 1 ? "s" : ""}`}
            </Button>
          </>
        )}

        {step === "progress" && activeBatch && (
          <>
            {["pending", "processing"].includes(activeBatch.status) ? (
              <Button
                color="error"
                onClick={handleCancel}
                startIcon={<Square size={18} />}
              >
                Cancel
              </Button>
            ) : (
              <Button
                onClick={handleReset}
                startIcon={<RefreshCw size={18} />}
              >
                New Batch
              </Button>
            )}
            <Button onClick={handleClose}>Close</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default BatchExportDialog;
