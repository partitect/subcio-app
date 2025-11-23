export type WordCue = {
  start: number;
  end: number;
  text: string;
  confidence?: number;
};

export type SubtitleGroup = {
  start: number;
  end: number;
  words: WordCue[];
  active_word_index?: number;
};

export type StyleConfig = {
  id: string;
  font?: string;
  font_size?: number;
  primary_color?: string;
  secondary_color?: string;
  outline_color?: string;
  shadow_color?: string;
  shadow_blur?: number;
  border?: number;
  alignment?: number;
  margin_v?: number;
  letter_spacing?: number;
  bold?: number;
  italic?: number;
  [key: string]: unknown;
};

export type ProjectMeta = {
  id: string;
  name: string;
  created_at?: string;
  video_url?: string;
  thumb_url?: string;
  config?: Record<string, unknown>;
};
