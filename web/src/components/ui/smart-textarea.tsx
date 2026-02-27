import * as React from "react";
import ReactMarkdown from "react-markdown";
import { Textarea } from "./textarea";
import { cn } from "@/lib/utils";

interface SmartTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;

  // Feature flags
  autoGrow?: boolean;
  bulletList?: "manual" | "auto" | false; // manual = user adds bullets, auto = starts with bullet on focus
  markdown?: boolean; // Toggle between markdown preview and edit
  variant?: "default" | "title"; // title = large text, no bullets

  // Styling
  label?: string;
  minHeight?: string;
}

export const SmartTextarea = React.forwardRef<HTMLTextAreaElement, SmartTextareaProps>(
  ({
    value,
    onValueChange,
    autoGrow = false,
    bulletList = false,
    markdown = false,
    variant = "default",
    label,
    minHeight = "60px",
    className,
    onFocus,
    onKeyDown,
    ...props
  }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [isEditing, setIsEditing] = React.useState(!markdown);

    // Merge refs
    React.useImperativeHandle(ref, () => textareaRef.current!);

    // Auto-focus when switching to editing mode in markdown
    React.useEffect(() => {
      if (markdown && isEditing && textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }, [isEditing, markdown]);

    // Auto-grow logic
    React.useLayoutEffect(() => {
      if (autoGrow && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [value, autoGrow]);

    // Handle bullet list auto-start on focus
    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (markdown) {
        setIsEditing(true);
      }
      if (bulletList === "auto" && value === "") {
        onValueChange("• ");
        // Set cursor after bullet
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(2, 2);
          }
        }, 0);
      }
      onFocus?.(e);
    };

    // Handle blur for markdown mode
    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (markdown) {
        setIsEditing(false);
      }
      props.onBlur?.(e);
    };

    // Handle Enter key for bullet lists
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (bulletList && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const textarea = e.currentTarget;
        const { selectionStart } = textarea;
        const lines = value.split('\n');
        const currentLineIndex = value.substring(0, selectionStart).split('\n').length - 1;
        const currentLine = lines[currentLineIndex];

        // If current line is just bullet or empty, don't add new bullet line
        if (currentLine.trim() === "•" || currentLine.trim() === "") {
          return;
        }

        // Add new line with bullet
        const beforeCursor = value.substring(0, selectionStart);
        const afterCursor = value.substring(selectionStart);
        const newValue = `${beforeCursor}\n• ${afterCursor}`;
        onValueChange(newValue);

        // Set cursor after bullet on next frame
        setTimeout(() => {
          if (textareaRef.current) {
            const newPosition = selectionStart + 3; // "\n• "
            textareaRef.current.setSelectionRange(newPosition, newPosition);
          }
        }, 0);
        return;
      }
      onKeyDown?.(e);
    };

    // Variant-specific classes
    const variantClasses = variant === "title"
      ? "text-2xl font-black uppercase tracking-tight"
      : "";

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onValueChange(e.target.value);
    };

    const hasContent = value && value.trim().length > 0;

    // Markdown preview mode
    if (markdown && !isEditing) {
      return (
        <div className="space-y-2">
          {label && (
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {label}
            </label>
          )}
          <div
            onClick={() => setIsEditing(true)}
            className={cn(
              "w-full bg-input border border-input rounded-lg p-3 cursor-text hover:border-ring transition-all",
              !hasContent && "text-muted-foreground",
              className
            )}
            style={{ minHeight }}
          >
            {hasContent ? (
              <article className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-foreground prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2 prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2 prose-p:my-2 prose-p:text-foreground prose-ul:my-2 prose-ul:text-foreground prose-li:my-1 prose-strong:text-foreground">
                <ReactMarkdown>{value}</ReactMarkdown>
              </article>
            ) : (
              <span className="text-sm">{props.placeholder}</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {label}
          </label>
        )}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(variantClasses, className)}
          style={{ minHeight: autoGrow ? minHeight : undefined }}
          {...props}
        />
      </div>
    );
  }
);

SmartTextarea.displayName = "SmartTextarea";
