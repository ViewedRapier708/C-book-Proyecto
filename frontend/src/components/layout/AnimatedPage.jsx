export default function AnimatedPage({ children }) {
  return (
    <div className="page-enter">
      {children}
    </div>
  );
}
