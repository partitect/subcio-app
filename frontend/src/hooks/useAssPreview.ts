/**
 * useAssPreview Hook
 * 
 * Manages ASS preview generation with caching and debouncing.
 * Reduces API calls by:
 * 1. Caching previous results
 * 2. Debouncing rapid changes
 * 3. Only updating when words or style actually change
 */

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { StyleConfig, WordCue } from "../types";
import { 
  getCachedAss, 
  setCachedAss, 
  hasWordsChanged, 
  hasStyleChanged 
} from "../utils/assCache";
import { styleToAssColors } from "../utils/colorConvert";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

interface UseAssPreviewOptions {
  words: WordCue[];
  style: StyleConfig;
  projectId?: string;
  debounceMs?: number;
  enabled?: boolean;
}

interface UseAssPreviewReturn {
  assContent: string;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  cacheHit: boolean;
}

export function useAssPreview({
  words,
  style,
  projectId,
  debounceMs = 400, // Reduced from 700ms
  enabled = true,
}: UseAssPreviewOptions): UseAssPreviewReturn {
  const [assContent, setAssContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  // Track previous values for change detection
  const prevWordsRef = useRef<WordCue[]>([]);
  const prevStyleRef = useRef<StyleConfig | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAssPreview = useCallback(async (
    currentWords: WordCue[],
    currentStyle: StyleConfig,
    currentProjectId?: string
  ) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first
    const cached = getCachedAss(currentWords, currentStyle);
    if (cached) {
      setAssContent(cached);
      setCacheHit(true);
      setIsLoading(false);
      return;
    }

    setCacheHit(false);
    setIsLoading(true);
    setError(null);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const styleForBackend = styleToAssColors(currentStyle);
      const form = new FormData();
      form.append("words_json", JSON.stringify(currentWords));
      form.append("style_json", JSON.stringify(styleForBackend));
      if (currentProjectId && currentProjectId !== "demo") {
        form.append("project_id", currentProjectId);
      }

      const res = await axios.post(`${API_BASE}/preview-ass`, form, {
        signal: abortControllerRef.current.signal,
      });

      const newAssContent = res.data;
      setAssContent(newAssContent);
      
      // Cache the result
      setCachedAss(currentWords, currentStyle, newAssContent);
    } catch (err: any) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        console.error("ASS preview failed", err);
        setError(err.message || "Preview generation failed");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Manual refresh (bypasses cache)
  const refresh = useCallback(() => {
    if (!words.length || !enabled) return;
    
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Force fetch without cache check
    setIsLoading(true);
    const styleForBackend = styleToAssColors(style);
    const form = new FormData();
    form.append("words_json", JSON.stringify(words));
    form.append("style_json", JSON.stringify(styleForBackend));
    if (projectId && projectId !== "demo") {
      form.append("project_id", projectId);
    }

    axios.post(`${API_BASE}/preview-ass`, form)
      .then(res => {
        setAssContent(res.data);
        setCachedAss(words, style, res.data);
        setCacheHit(false);
      })
      .catch(err => {
        console.error("ASS preview refresh failed", err);
        setError(err.message);
      })
      .finally(() => setIsLoading(false));
  }, [words, style, projectId, enabled]);

  useEffect(() => {
    if (!enabled || !words.length) {
      return;
    }

    // Check if anything actually changed
    const wordsChanged = hasWordsChanged(prevWordsRef.current, words);
    const styleChanged = prevStyleRef.current ? hasStyleChanged(prevStyleRef.current, style) : true;

    // Update refs
    prevWordsRef.current = [...words];
    prevStyleRef.current = { ...style };

    // If nothing changed, skip the update
    if (!wordsChanged && !styleChanged && assContent) {
      return;
    }

    // Check cache immediately for instant feedback
    const cached = getCachedAss(words, style);
    if (cached) {
      setAssContent(cached);
      setCacheHit(true);
      return;
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the API call
    debounceTimerRef.current = setTimeout(() => {
      fetchAssPreview(words, style, projectId);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [words, style, projectId, enabled, debounceMs, fetchAssPreview, assContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    assContent,
    isLoading,
    error,
    refresh,
    cacheHit,
  };
}

export default useAssPreview;
