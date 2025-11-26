import { useEffect, useCallback, useRef } from "react";

type KeyHandler = (event: KeyboardEvent) => void;

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  handler: KeyHandler;
  preventDefault?: boolean;
  description?: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: ShortcutConfig[];
}

/**
 * Hook for managing keyboard shortcuts in the editor
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: " ", handler: togglePlay, description: "Play/Pause" },
 *     { key: "s", ctrlKey: true, handler: saveProject, description: "Save" },
 *     { key: "ArrowLeft", handler: () => seekBackward(5), description: "Seek -5s" },
 *   ]
 * });
 * ```
 */
export function useKeyboardShortcuts({ 
  enabled = true, 
  shortcuts 
}: UseKeyboardShortcutsOptions) {
  // Use ref to avoid recreating the handler on every render
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if disabled or typing in an input
    if (!enabled) return;
    
    const target = event.target as HTMLElement;
    const isInputField = 
      target.tagName === "INPUT" || 
      target.tagName === "TEXTAREA" || 
      target.isContentEditable;

    // Allow some shortcuts even in input fields (like Escape)
    const allowedInInput = ["Escape", "F1", "F2", "F3", "F4", "F5"];
    
    if (isInputField && !allowedInInput.includes(event.key)) {
      return;
    }

    for (const shortcut of shortcutsRef.current) {
      const keyMatches = event.key === shortcut.key || 
                        event.code === shortcut.key ||
                        event.key.toLowerCase() === shortcut.key.toLowerCase();
      
      const ctrlMatches = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey);
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
      const altMatches = !!shortcut.altKey === event.altKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler(event);
        return;
      }
    }
  }, [enabled]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Pre-defined shortcut configurations for the editor
 */
export const EDITOR_SHORTCUTS = {
  // Playback
  PLAY_PAUSE: { key: " ", description: "Oynat/Duraklat" },
  SEEK_FORWARD: { key: "ArrowRight", description: "5s İleri" },
  SEEK_BACKWARD: { key: "ArrowLeft", description: "5s Geri" },
  SEEK_FORWARD_FRAME: { key: "ArrowRight", shiftKey: true, description: "1 Kare İleri" },
  SEEK_BACKWARD_FRAME: { key: "ArrowLeft", shiftKey: true, description: "1 Kare Geri" },
  VOLUME_UP: { key: "ArrowUp", description: "Ses Artır" },
  VOLUME_DOWN: { key: "ArrowDown", description: "Ses Azalt" },
  MUTE: { key: "m", description: "Sesi Kapat/Aç" },
  FULLSCREEN: { key: "f", description: "Tam Ekran" },
  
  // Editing
  SAVE: { key: "s", ctrlKey: true, description: "Kaydet" },
  UNDO: { key: "z", ctrlKey: true, description: "Geri Al" },
  REDO: { key: "y", ctrlKey: true, description: "İleri Al" },
  REDO_ALT: { key: "z", ctrlKey: true, shiftKey: true, description: "İleri Al" },
  SELECT_ALL: { key: "a", ctrlKey: true, description: "Tümünü Seç" },
  DELETE: { key: "Delete", description: "Sil" },
  
  // Navigation
  NEXT_WORD: { key: "ArrowRight", ctrlKey: true, description: "Sonraki Kelime" },
  PREV_WORD: { key: "ArrowLeft", ctrlKey: true, description: "Önceki Kelime" },
  
  // UI
  ESCAPE: { key: "Escape", description: "İptal/Kapat" },
  HELP: { key: "?", shiftKey: true, description: "Kısayolları Göster" },
  EXPORT: { key: "e", ctrlKey: true, description: "Export" },
} as const;

/**
 * Formats a shortcut for display
 */
export function formatShortcut(shortcut: Partial<ShortcutConfig>): string {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push("Ctrl");
  if (shortcut.shiftKey) parts.push("Shift");
  if (shortcut.altKey) parts.push("Alt");
  if (shortcut.metaKey) parts.push("⌘");
  
  let key = shortcut.key || "";
  
  // Format special keys
  const keyMap: Record<string, string> = {
    " ": "Space",
    "ArrowUp": "↑",
    "ArrowDown": "↓",
    "ArrowLeft": "←",
    "ArrowRight": "→",
    "Escape": "Esc",
    "Delete": "Del",
    "Backspace": "⌫",
    "Enter": "↵",
    "Tab": "⇥",
  };
  
  key = keyMap[key] || key.toUpperCase();
  parts.push(key);
  
  return parts.join(" + ");
}

export default useKeyboardShortcuts;
