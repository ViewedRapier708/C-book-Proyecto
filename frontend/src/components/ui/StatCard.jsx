import CountUp from 'react-countup';
import { motion } from 'framer-motion';

export default function StatCard({ label, value, icon: Icon, color, subtitle, delay = 0 }) {
  const bg = color + '15';
  return (
    <motion.div
      className="stat-card"
      style={{ '--stat-accent': color }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
    >
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className="stat-card-icon" style={{ background: bg }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      <div className="stat-card-value">
        <CountUp end={value} duration={1.5} separator="," />
      </div>
      {subtitle && <div className="stat-card-change">{subtitle}</div>}
    </motion.div>
  );
}
