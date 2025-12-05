/**
 * Dashboard Page
 * 
 * User's project dashboard with recent projects, usage stats
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Grid,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
  Avatar,
  Divider,
} from "@mui/material";
import {
  Plus,
  Upload,
  FolderOpen,
  MoreVertical,
  Trash2,
  Edit,
  Download,
  Clock,
  Film,
  Layers,
  Settings,
  Sun,
  Moon,
  LogOut,
  User,
  CreditCard,
} from "lucide-react";
import { ProjectMeta } from "../types";
import { useTheme as useAppTheme } from "../ThemeContext";
// import { useAuth } from "../contexts/AuthContext"; // REMOVED
import { getAssetPath } from "../utils/assetPath";


const API_BASE = "http://localhost:8000/api";

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const theme = useTheme();
  const { isDark, toggleTheme } = useAppTheme();
  // const { user, logout } = useAuth(); // REMOVED
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/projects`);
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, projectId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedProject(projectId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    try {
      await fetch(`${API_BASE}/projects/${selectedProject}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== selectedProject));
    } catch (err) {
      console.error("Failed to delete project", err);
    }
    handleMenuClose();
  };

  const resolveAssetUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const apiHost = API_BASE.replace(/\/api$/, "");
    return `${apiHost}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const userName = "Desktop User";
  const userPlan = "Pro";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: isDark ? "grey.900" : "grey.50",
      }}
    >
      {/* Top Bar */}
      <Paper
        elevation={0}
        sx={{
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          bgcolor: "background.paper",
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ py: 2 }}
          >
            {/* Logo */}
            <Stack
              component={Link}
              to="/"
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ textDecoration: "none", color: "inherit" }}
            >
              <Box
                component="img"
                src={getAssetPath('assets/images/subcio-logo.png')}
                alt="Subcio"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                }}
              />
              <Typography variant="h6" fontWeight={800}>
                Subcio
              </Typography>
            </Stack>

            {/* Actions */}
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton onClick={toggleTheme} size="small">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </IconButton>
              <IconButton
                size="small"
                component={Link}
                to="/settings"
              >
                <Settings size={20} />
              </IconButton>
            </Stack>
          </Stack>
        </Container>
      </Paper>

      {/* User Menu Removed for Desktop */}

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Box>
            <Typography variant="h4" fontWeight={800}>
              {t('dashboard.welcome', { name: userName.split(" ")[0] })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.subtitle')}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>

            <Button
              component={Link}
              to="/upload"
              variant="contained"
              startIcon={<Plus size={16} />}
            >
              {t('dashboard.newProject')}
            </Button>
          </Stack>
        </Stack>

        {/* Stats Section Removed for Desktop */}

        {/* Projects Section */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" fontWeight={700}>
            {t('dashboard.projects.title')}
          </Typography>
          <Button
            component={Link}
            to="/projects"
            size="small"
            sx={{ color: "text.secondary" }}
          >
            {t('dashboard.projects.viewAll')}
          </Button>
        </Stack>

        {loading ? (
          <Card sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
            <Typography color="text.secondary">{t('dashboard.projects.loading')}</Typography>
          </Card>
        ) : projects.length === 0 ? (
          <Card sx={{ p: 6, textAlign: "center", borderRadius: 2 }}>
            <FolderOpen size={48} color={theme.palette.text.secondary} style={{ marginBottom: 16 }} />
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t('dashboard.projects.empty.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('dashboard.projects.empty.subtitle')}
            </Typography>
            <Button
              component={Link}
              to="/upload"
              variant="contained"
              startIcon={<Upload size={18} />}
            >
              {t('dashboard.projects.empty.cta')}
            </Button>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {projects.slice(0, 8).map((project) => (
              <Grid item xs={12} sm={6} md={3} key={project.id}>
                <Card
                  component={Link}
                  to={`/editor/${project.id}`}
                  sx={{
                    textDecoration: "none",
                    borderRadius: 2,
                    transition: "all 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                  }}
                >
                  {project.thumb_url ? (
                    <CardMedia
                      component="img"
                      height="140"
                      image={resolveAssetUrl(project.thumb_url)}
                      alt={project.name}
                      sx={{ objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 140,
                        bgcolor: isDark ? "grey.800" : "grey.100",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Film size={32} color={theme.palette.text.secondary} />
                    </Box>
                  )}
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          noWrap
                          color="text.primary"
                        >
                          {project.name}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Clock size={12} color={theme.palette.text.secondary} />
                          <Typography variant="caption" color="text.secondary">
                            {project.created_at
                              ? new Date(project.created_at).toLocaleDateString()
                              : "Unknown"}
                          </Typography>
                        </Stack>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, project.id)}
                        sx={{ ml: 1 }}
                      >
                        <MoreVertical size={16} />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem
            component={Link}
            to={`/editor/${selectedProject}`}
            onClick={handleMenuClose}
          >
            <Edit size={16} style={{ marginRight: 8 }} />
            {t('dashboard.projects.actions.edit')}
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Download size={16} style={{ marginRight: 8 }} />
            {t('dashboard.projects.actions.export')}
          </MenuItem>
          <MenuItem onClick={handleDeleteProject} sx={{ color: "error.main" }}>
            <Trash2 size={16} style={{ marginRight: 8 }} />
            {t('dashboard.projects.actions.delete')}
          </MenuItem>
        </Menu>
      </Container>

      {/* Batch Export Dialog */}

    </Box>
  );
}
