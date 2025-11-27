/**
 * Accessibility Utilities
 * 
 * Helper functions and hooks for improving accessibility across the application.
 * Implements WCAG 2.1 guidelines for web content accessibility.
 */

import { useCallback, useEffect, useRef } from "react";

/**
 * Live region announcements for screen readers
 */
class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer;
  private container: HTMLDivElement | null = null;
  private politeRegion: HTMLDivElement | null = null;
  private assertiveRegion: HTMLDivElement | null = null;

  private constructor() {
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  public static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
    }
    return ScreenReaderAnnouncer.instance;
  }

  private init() {
    // Create container
    this.container = document.createElement("div");
    this.container.id = "sr-announcer";
    this.container.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;

    // Create polite live region
    this.politeRegion = document.createElement("div");
    this.politeRegion.setAttribute("role", "status");
    this.politeRegion.setAttribute("aria-live", "polite");
    this.politeRegion.setAttribute("aria-atomic", "true");

    // Create assertive live region
    this.assertiveRegion = document.createElement("div");
    this.assertiveRegion.setAttribute("role", "alert");
    this.assertiveRegion.setAttribute("aria-live", "assertive");
    this.assertiveRegion.setAttribute("aria-atomic", "true");

    this.container.appendChild(this.politeRegion);
    this.container.appendChild(this.assertiveRegion);
    document.body.appendChild(this.container);
  }

  /**
   * Announce a message to screen readers
   * @param message - The message to announce
   * @param priority - "polite" waits for current speech, "assertive" interrupts
   */
  public announce(message: string, priority: "polite" | "assertive" = "polite") {
    const region = priority === "assertive" ? this.assertiveRegion : this.politeRegion;
    if (!region) return;

    // Clear and re-add to trigger announcement
    region.textContent = "";
    setTimeout(() => {
      region.textContent = message;
    }, 50);
  }
}

// Singleton instance
export const announcer = ScreenReaderAnnouncer.getInstance();

/**
 * Announce a message to screen readers
 */
export const announce = (message: string, priority: "polite" | "assertive" = "polite") => {
  announcer.announce(message, priority);
};

/**
 * Hook for managing focus trap within a container
 * Useful for modals, dialogs, and dropdown menus
 */
export function useFocusTrap(active: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Store currently focused element
    previousActiveElement.current = document.activeElement;

    // Get all focusable elements
    const getFocusableElements = () => {
      if (!containerRef.current) return [];
      return Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle tab key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to previously focused element
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [active]);

  return containerRef;
}

/**
 * Hook for roving tabindex pattern
 * Useful for radio groups, toolbars, and menu bars
 */
export function useRovingTabindex<T extends HTMLElement>(
  items: React.RefObject<T>[],
  options: {
    orientation?: "horizontal" | "vertical" | "both";
    loop?: boolean;
    onSelect?: (index: number) => void;
  } = {}
) {
  const { orientation = "horizontal", loop = true, onSelect } = options;
  const currentIndex = useRef(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const key = e.key;
      let newIndex = currentIndex.current;
      const maxIndex = items.length - 1;

      const prevKeys = orientation === "vertical" ? ["ArrowUp"] : ["ArrowLeft"];
      const nextKeys = orientation === "vertical" ? ["ArrowDown"] : ["ArrowRight"];
      
      if (orientation === "both") {
        prevKeys.push("ArrowUp", "ArrowLeft");
        nextKeys.push("ArrowDown", "ArrowRight");
      }

      if (prevKeys.includes(key)) {
        e.preventDefault();
        newIndex = currentIndex.current - 1;
        if (newIndex < 0) {
          newIndex = loop ? maxIndex : 0;
        }
      } else if (nextKeys.includes(key)) {
        e.preventDefault();
        newIndex = currentIndex.current + 1;
        if (newIndex > maxIndex) {
          newIndex = loop ? 0 : maxIndex;
        }
      } else if (key === "Home") {
        e.preventDefault();
        newIndex = 0;
      } else if (key === "End") {
        e.preventDefault();
        newIndex = maxIndex;
      } else if (key === "Enter" || key === " ") {
        e.preventDefault();
        onSelect?.(currentIndex.current);
        return;
      } else {
        return;
      }

      if (newIndex !== currentIndex.current) {
        currentIndex.current = newIndex;
        items[newIndex]?.current?.focus();
      }
    },
    [items, orientation, loop, onSelect]
  );

  const getTabIndex = useCallback(
    (index: number) => (index === currentIndex.current ? 0 : -1),
    []
  );

  const setCurrentIndex = useCallback((index: number) => {
    currentIndex.current = index;
  }, []);

  return { handleKeyDown, getTabIndex, setCurrentIndex };
}

/**
 * Hook to detect if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const mediaQuery = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  const getInitialState = () => mediaQuery?.matches ?? false;

  const prefersReducedMotion = useRef(getInitialState());

  useEffect(() => {
    if (!mediaQuery) return;

    const listener = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [mediaQuery]);

  return prefersReducedMotion.current;
}

/**
 * Skip link component for keyboard users to skip navigation
 */
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={{
        position: "absolute",
        left: "-10000px",
        top: "auto",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      }}
      onFocus={(e) => {
        const target = e.currentTarget;
        target.style.left = "10px";
        target.style.top = "10px";
        target.style.width = "auto";
        target.style.height = "auto";
        target.style.overflow = "visible";
        target.style.zIndex = "9999";
        target.style.padding = "8px 16px";
        target.style.backgroundColor = "#6366f1";
        target.style.color = "white";
        target.style.borderRadius = "4px";
        target.style.textDecoration = "none";
        target.style.fontWeight = "600";
      }}
      onBlur={(e) => {
        const target = e.currentTarget;
        target.style.left = "-10000px";
        target.style.width = "1px";
        target.style.height = "1px";
        target.style.overflow = "hidden";
      }}
    >
      {children}
    </a>
  );
}

/**
 * Visually hidden text (for screen readers only)
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      {children}
    </span>
  );
}

/**
 * Generate unique ID for ARIA relationships
 */
let idCounter = 0;
export function generateId(prefix: string = "id"): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * ARIA attribute helpers
 */
export const ariaHelpers = {
  /**
   * Create describedby relationship
   */
  describedBy: (ids: (string | undefined | null)[]) => {
    const filtered = ids.filter(Boolean).join(" ");
    return filtered ? { "aria-describedby": filtered } : {};
  },

  /**
   * Create labelledby relationship
   */
  labelledBy: (ids: (string | undefined | null)[]) => {
    const filtered = ids.filter(Boolean).join(" ");
    return filtered ? { "aria-labelledby": filtered } : {};
  },

  /**
   * Expansion state
   */
  expanded: (isExpanded: boolean) => ({
    "aria-expanded": isExpanded,
  }),

  /**
   * Selection state
   */
  selected: (isSelected: boolean) => ({
    "aria-selected": isSelected,
  }),

  /**
   * Current state (for navigation)
   */
  current: (isCurrent: boolean | "page" | "step" | "location" | "date" | "time") => ({
    "aria-current": isCurrent,
  }),

  /**
   * Pressed state (toggle buttons)
   */
  pressed: (isPressed: boolean | "mixed") => ({
    "aria-pressed": isPressed,
  }),

  /**
   * Disabled state
   */
  disabled: (isDisabled: boolean) => ({
    "aria-disabled": isDisabled,
  }),

  /**
   * Hidden state
   */
  hidden: (isHidden: boolean) => ({
    "aria-hidden": isHidden,
  }),

  /**
   * Progress/loading state
   */
  busy: (isBusy: boolean) => ({
    "aria-busy": isBusy,
  }),

  /**
   * Value for sliders, progress bars
   */
  value: (current: number, min: number = 0, max: number = 100, text?: string) => ({
    "aria-valuenow": current,
    "aria-valuemin": min,
    "aria-valuemax": max,
    ...(text ? { "aria-valuetext": text } : {}),
  }),
};

/**
 * Focus visible styles (for custom focus indicators)
 */
export const focusVisibleStyles = {
  outline: "2px solid #6366f1",
  outlineOffset: "2px",
};

/**
 * Check if element should receive focus
 */
export function isFocusable(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false;
  if (element.tabIndex < 0) return false;
  if ((element as HTMLInputElement).disabled) return false;
  if (element.getAttribute("aria-disabled") === "true") return false;
  
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return false;
  
  return true;
}

export default {
  announce,
  useFocusTrap,
  useRovingTabindex,
  usePrefersReducedMotion,
  SkipLink,
  VisuallyHidden,
  generateId,
  ariaHelpers,
  focusVisibleStyles,
  isFocusable,
};
