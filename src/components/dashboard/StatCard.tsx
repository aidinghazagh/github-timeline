import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  delay?: number;
  className?: string;
}

export function StatCard({ label, value, icon, delay = 0, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors group',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted-foreground text-sm">{label}</span>
        <div className="text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground">
        <AnimatedCounter value={value} />
      </p>
    </motion.div>
  );
}
