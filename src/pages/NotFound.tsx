import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Film } from "lucide-react"; // Importing a relevant icon (e.g., a film reel that's 'off' or 'broken')
import { motion } from "framer-motion"; // For animations
import { Button } from "@/components/ui/button"; // Assuming you have a Button component from your UI library

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log the 404 error for debugging/analytics purposes
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4 py-12">
      <motion.div
        // Framer Motion properties for fade-up animation
        initial={{ opacity: 0, y: 50 }} // Start invisible and slightly below final position
        animate={{ opacity: 1, y: 0 }}   // Animate to full opacity and final position
        transition={{ duration: 0.7, ease: "easeOut" }} // Smooth transition over 0.7 seconds
        
        className="text-center max-w-lg mx-auto p-8 md:p-12 bg-card rounded-xl shadow-2xl" // Styled card container
      >
        {/* Icon for visual appeal */}
        <Film className="w-24 h-24 text-primary mx-auto mb-8" /> 

        {/* Big 404 text */}
        <h1 className="text-6xl md:text-7xl font-extrabold text-gradient mb-4">
          404
        </h1>

        {/* Main message */}
        <p className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-4">
          Page Not Found
        </p>

        {/* Detailed message with website name */}
        <p className="text-lg md:text-xl text-foreground leading-relaxed mb-8">
          Oops! The content you're looking for seems to have wandered off.
          It doesn't exist on <span className="font-bold text-gradient">Zeestream</span>.
        </p>

        {/* Stylish button to return home */}
        <Button onClick={() => window.location.href = '/'} className="btn-stream text-lg px-8 py-3">
          Return to Home
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;