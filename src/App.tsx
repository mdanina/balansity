import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import RegionSelect from "./pages/RegionSelect";
import ComingSoon from "./pages/ComingSoon";
import Success from "./pages/Success";
import Profile from "./pages/Profile";
import FamilySetup from "./pages/FamilySetup";
import FamilyMembers from "./pages/FamilyMembers";
import AddFamilyMember from "./pages/AddFamilyMember";
import Worries from "./pages/Worries";
import CheckupIntro from "./pages/CheckupIntro";
import Checkup from "./pages/Checkup";
import CheckupQuestions from "./pages/CheckupQuestions";
import CheckupInterlude from "./pages/CheckupInterlude";
import ParentIntro from "./pages/ParentIntro";
import ParentQuestions from "./pages/ParentQuestions";
import FamilyIntro from "./pages/FamilyIntro";
import FamilyQuestions from "./pages/FamilyQuestions";
import CheckupResults from "./pages/CheckupResults";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/region" element={<RegionSelect />} />
          <Route path="/coming-soon" element={<ComingSoon />} />
          <Route path="/success" element={<Success />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/family-setup" element={<FamilySetup />} />
          <Route path="/family-members" element={<FamilyMembers />} />
          <Route path="/add-family-member" element={<AddFamilyMember />} />
          <Route path="/worries" element={<Worries />} />
          <Route path="/checkup-intro" element={<CheckupIntro />} />
          <Route path="/checkup" element={<Checkup />} />
          <Route path="/checkup-questions" element={<CheckupQuestions />} />
          <Route path="/checkup-interlude" element={<CheckupInterlude />} />
          <Route path="/parent-intro" element={<ParentIntro />} />
          <Route path="/parent-questions" element={<ParentQuestions />} />
          <Route path="/family-intro" element={<FamilyIntro />} />
          <Route path="/family-questions" element={<FamilyQuestions />} />
          <Route path="/checkup-results" element={<CheckupResults />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
