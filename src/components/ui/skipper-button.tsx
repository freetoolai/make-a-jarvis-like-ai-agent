"use client";

import { motion } from "framer-motion";
import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkiperButtonProps {
  /** Icon to show on the right side when expanded */
  icon?: LucideIcon;
  /** Label text to show when expanded */
  label?: string;
  /** Whether the button is in expanded state */
  isExpanded?: boolean;
  /** Callback when toggle is clicked */
  onToggle?: () => void;
  /** Additional class names */
  className?: string;
  /** Button variant */
  variant?: "default" | "primary" | "secondary" | "danger";
  /** Size of the button */
  size?: "sm" | "md" | "lg";
  /** Whether the button is disabled */
  disabled?: boolean;
  /** onClick handler */
  onClick?: () => void;
  /** Button content (alternative to icon/label) */
  children?: React.ReactNode;
}

/**
 * SkiperButton - A pill-shaped toggle button with animated dots
 * Expands to show content with smooth spring animation
 */
export function SkiperButton({
  icon: Icon,
  label,
  isExpanded = false,
  onToggle,
  className,
  variant = "default",
  size = "md",
  disabled = false,
  onClick,
  children,
}: SkiperButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    if (onToggle) {
      onToggle();
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: { collapsed: 40, expanded: 200, iconSize: 14, dotSize: 6, padding: "px-3 py-1" },
    md: { collapsed: 50, expanded: 280, iconSize: 18, dotSize: 8, padding: "px-4 py-2" },
    lg: { collapsed: 60, expanded: 330, iconSize: 20, dotSize: 10, padding: "px-5 py-2" },
  };

  const config = sizeConfig[size];

  // Variant styles
  const variantStyles = {
    default: "bg-foreground/10 hover:bg-foreground/20 text-foreground",
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    secondary: "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
    danger: "bg-red-500 hover:bg-red-600 text-white",
  };

  // Determine the content
  const showContent = isExpanded || children;

  return (
    <div className={cn("relative flex items-center", className)}>
      <motion.div
        layout
        className={cn(
          "relative flex items-center overflow-hidden rounded-full",
          variantStyles[variant],
          disabled && "opacity-50 cursor-not-allowed",
          config.padding
        )}
        style={{
          borderRadius: 9999,
          width: isExpanded ? config.expanded : config.collapsed,
        }}
        initial={{ scale: 0, y: "100%" }}
        transition={{ type: "spring", bounce: 0.16 }}
        animate={{ 
          scale: 1, 
          y: 0, 
          width: isExpanded ? config.expanded : config.collapsed 
        }}
        onClick={disabled ? undefined : handleClick}
      >
        {/* Dots on the left - always visible when expanded */}
        <div 
          className="flex items-center justify-center gap-1.5"
          style={{ 
            width: isExpanded ? config.expanded - 50 : config.collapsed,
            opacity: isExpanded ? 1 : 0,
            transition: "opacity 0.2s ease"
          }}
        >
          {isExpanded && label && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-sm font-medium whitespace-nowrap mr-2"
            >
              {label}
            </motion.span>
          )}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1"
            >
              <span 
                className="bg-foreground/30 rounded-full" 
                style={{ width: config.dotSize, height: config.dotSize }} 
              />
              <span 
                className="bg-foreground/30 rounded-full" 
                style={{ width: config.dotSize, height: config.dotSize }} 
              />
              <span 
                className="bg-foreground/30 rounded-full" 
                style={{ width: config.dotSize, height: config.dotSize }} 
              />
              <span 
                className="bg-foreground/30 rounded-full" 
                style={{ width: config.dotSize, height: config.dotSize }} 
              />
              <span 
                className="bg-foreground/30 rounded-full" 
                style={{ width: config.dotSize, height: config.dotSize }} 
              />
            </motion.div>
          )}
        </div>

        {/* Icon on the right - always visible */}
        {Icon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
            className={cn(
              "flex items-center justify-center",
              isExpanded ? "ml-auto" : "mx-auto"
            )}
          >
            <Icon 
              size={config.iconSize} 
              className={cn(
                "fill-current",
                variant === "default" && !isExpanded && "text-foreground/60"
              )} 
            />
          </motion.div>
        )}

        {/* Custom children */}
        {children && !Icon && (
          <div className={cn("flex items-center", isExpanded ? "ml-auto" : "mx-auto")}>
            {children}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default SkiperButton;
