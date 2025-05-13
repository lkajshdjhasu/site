import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const copyVariants = {
  initial: { 
    opacity: 0,
    scale: 0.85,
    y: 10 
  },
  animate: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.85,
    y: -10,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

export const CopyButton = ({ className, value, ...props }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      className={cn(
        "group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-lg border bg-background px-6 font-medium transition-all duration-300",
        "hover:border-primary/50 hover:bg-background/80 hover:pr-8",
        "active:scale-[0.98]",
        className
      )}
      onClick={onCopy}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.div
            key="check"
            className="flex items-center gap-2"
            variants={copyVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Check className="h-6 w-6 text-green-500" strokeWidth={2.5} />
            <span className="text-green-500 font-medium">Copied!</span>
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            className="flex items-center gap-2"
            variants={copyVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Copy className="h-6 w-6" strokeWidth={2} />
            <span>Copy</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/0 via-primary/5 to-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </button>
  );
}; 