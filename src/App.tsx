import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelmetProvider } from 'react-helmet-async';
import { useEffect } from 'react';

// Pages
import Index from "./pages/Index";
import Movies from "./pages/Movies";
import Watch from "./pages/Watch";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Policy from "./pages/Policy";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

// Layout
import { Navbar } from "@/components/layout/Navbar";
import { MobileNavbar } from "@/components/layout/MobileNavbar";
import { Footer } from "@/components/layout/Footer";
import { ChatButton } from "@/components/layout/ChatButton";

const queryClient = new QueryClient();

// Scroll to top component
const ScrollToTop = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);
  
  return null;
};

// App layout component
const AppLayout = () => {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';
  
  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop />
      {!isChatPage && (
        <>
          <Navbar />
          <MobileNavbar />
        </>
      )}
      <main className={isChatPage ? '' : 'pt-16 md:pt-16 pb-20 md:pb-0'}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/watch/:slug" element={<Watch />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isChatPage && <Footer />}
      <ChatButton />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
