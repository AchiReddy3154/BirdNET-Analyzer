import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function Cursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    // Only show on desktop
    const checkDesktop = () => setIsDesktop(window.matchMedia("(pointer: fine)").matches);
    checkDesktop();
    
    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", checkDesktop);
    
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", checkDesktop);
    };
  }, []);

  if (!isDesktop) return null;

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 border-primary/50 pointer-events-none z-[100] mix-blend-difference"
        animate={{ x: position.x - 16, y: position.y - 16 }}
        transition={{ type: "spring", stiffness: 400, damping: 28, mass: 20 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-primary pointer-events-none z-[100]"
        animate={{ x: position.x - 4, y: position.y - 4 }}
        transition={{ type: "spring", stiffness: 1000, damping: 40, mass: 10 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-32 h-32 rounded-full bg-primary/10 blur-xl pointer-events-none z-[90]"
        animate={{ x: position.x - 64, y: position.y - 64 }}
        transition={{ type: "spring", stiffness: 100, damping: 40, mass: 20 }}
      />
    </>
  );
}
