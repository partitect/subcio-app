import { memo } from "react";
import {
  Box,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Copy, ListOrdered, Play, Plus, Trash2 } from "lucide-react";
import { WordCue } from "../../types";

interface TranscriptPanelProps {
  words: WordCue[];
  totalDuration: number;
  activeIndex: number;
  onWordChange: (idx: number, text: string) => void;
  onWordTimeChange: (idx: number, field: "start" | "end", value: number) => void;
  onAddWord: () => void;
  onDeleteWord: (idx: number) => void;
  onDuplicateWord: (idx: number) => void;
  onSortWords: () => void;
  onSeekToWord: (start: number) => void;
}

/**
 * Transcript Panel Component
 * Handles word list editing and timing adjustments
 */
function TranscriptPanelComponent({
  words,
  totalDuration,
  activeIndex,
  onWordChange,
  onWordTimeChange,
  onAddWord,
  onDeleteWord,
  onDuplicateWord,
  onSortWords,
  onSeekToWord,
}: TranscriptPanelProps) {
  return (
    <Stack
      spacing={1.5}
      sx={{
        overflowY: { md: "auto" },
        maxHeight: { xs: "none", md: "75vh" },
        pr: 1.5,
      }}
    >
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="h6" fontWeight={700}>
            Transcript Editor
          </Typography>
          <Chip label={`${words.length} lines`} size="small" />
          <Chip label={`Ends at ${(totalDuration || 0).toFixed(2)}s`} size="small" />
        </Stack>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Sort by start time">
            <IconButton color="default" onClick={onSortWords}>
              <ListOrdered size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add new line">
            <IconButton color="primary" onClick={onAddWord}>
              <Plus size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Divider />

      {/* Word List */}
      {words.map((w, idx) => (
        <Paper
          key={`word-${idx}`}
          variant="outlined"
          sx={{
            p: 1.5,
            borderColor: idx === activeIndex ? "primary.main" : "divider",
            bgcolor: idx === activeIndex ? "action.selected" : "background.paper",
          }}
        >
          {/* Time Controls Row */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ sm: "center" }}
            justifyContent="space-between"
            mb={1}
          >
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <TextField
                label="Start"
                type="number"
                size="small"
                value={w.start.toFixed(2)}
                onChange={(e) => onWordTimeChange(idx, "start", Number(e.target.value))}
                inputProps={{ step: "0.01", min: 0 }}
                sx={{ width: 120 }}
              />
              <TextField
                label="End"
                type="number"
                size="small"
                value={w.end.toFixed(2)}
                onChange={(e) => onWordTimeChange(idx, "end", Number(e.target.value))}
                inputProps={{ step: "0.01", min: 0 }}
                sx={{ width: 120 }}
              />
              <Typography variant="caption" color="text.secondary">
                Dur. {(w.end - w.start).toFixed(2)}s
              </Typography>
            </Stack>

            {/* Action Buttons */}
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Seek to start">
                <IconButton size="small" onClick={() => onSeekToWord(w.start)}>
                  <Play size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Duplicate line">
                <IconButton size="small" onClick={() => onDuplicateWord(idx)}>
                  <Copy size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete line">
                <IconButton size="small" color="error" onClick={() => onDeleteWord(idx)}>
                  <Trash2 size={16} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {/* Text Input */}
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={2}
            value={w.text}
            onChange={(e) => onWordChange(idx, e.target.value)}
            InputProps={{ sx: { px: 1, py: 1 } }}
          />
        </Paper>
      ))}
    </Stack>
  );
}

export const TranscriptPanel = memo(TranscriptPanelComponent);
export default TranscriptPanel;
