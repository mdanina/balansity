import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Welcome from "./pages/Welcome";
import RegionSelect from "./pages/RegionSelect";
import ComingSoon from "./pages/ComingSoon";
import Success from "./pages/Success";
import Profile from "./pages/Profile";
import FamilySetup from "./pages/FamilySetup";
import FamilyMembers from "./pages/FamilyMembers";
import AddFamilyMember from "./pages/AddFamilyMember";
import EditFamilyMember from "./pages/EditFamilyMember";
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
import ResultsReport from "./pages/ResultsReport";
import ResultsReportNew from "./pages/ResultsReportNew";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ProfileProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Публичные маршруты */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/coming-soon" element={<ComingSoon />} />
              
              {/* Защищенные маршруты (требуют авторизации) */}
              <Route path="/success" element={<ProtectedRoute><Success /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/region" element={<ProtectedRoute><RegionSelect /></ProtectedRoute>} />
              <Route path="/family-setup" element={<ProtectedRoute><FamilySetup /></ProtectedRoute>} />
              <Route path="/family-members" element={<ProtectedRoute><FamilyMembers /></ProtectedRoute>} />
              <Route path="/add-family-member" element={<ProtectedRoute><AddFamilyMember /></ProtectedRoute>} />
              <Route path="/edit-family-member/:id" element={<ProtectedRoute><EditFamilyMember /></ProtectedRoute>} />
              <Route path="/worries" element={<ProtectedRoute><Worries /></ProtectedRoute>} />
              <Route path="/checkup-intro/:profileId?" element={<ProtectedRoute><CheckupIntro /></ProtectedRoute>} />
              <Route path="/checkup" element={<ProtectedRoute><Checkup /></ProtectedRoute>} />
              <Route path="/checkup-questions/:profileId?" element={<ProtectedRoute><CheckupQuestions /></ProtectedRoute>} />
              <Route path="/checkup-interlude" element={<ProtectedRoute><CheckupInterlude /></ProtectedRoute>} />
              <Route path="/parent-intro" element={<ProtectedRoute><ParentIntro /></ProtectedRoute>} />
              <Route path="/parent-questions/:profileId?" element={<ProtectedRoute><ParentQuestions /></ProtectedRoute>} />
              <Route path="/family-intro" element={<ProtectedRoute><FamilyIntro /></ProtectedRoute>} />
              <Route path="/family-questions/:profileId?" element={<ProtectedRoute><FamilyQuestions /></ProtectedRoute>} />
              <Route path="/checkup-results" element={<ProtectedRoute><CheckupResults /></ProtectedRoute>} />
              <Route path="/results-report/:profileId?" element={<ProtectedRoute><ResultsReportNew /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ProfileProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
