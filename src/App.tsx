import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
// Легкие страницы загружаем сразу
import Landing from "./pages/Landing";
import ServiceIntro from "./pages/ServiceIntro";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Welcome from "./pages/Welcome";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

// Тяжелые страницы - lazy loading для оптимизации bundle size
const RegionSelect = lazy(() => import("./pages/RegionSelect"));
const Success = lazy(() => import("./pages/Success"));
const Profile = lazy(() => import("./pages/Profile"));
const FamilySetup = lazy(() => import("./pages/FamilySetup"));
const FamilyMembers = lazy(() => import("./pages/FamilyMembers"));
const AddFamilyMember = lazy(() => import("./pages/AddFamilyMember"));
const EditFamilyMember = lazy(() => import("./pages/EditFamilyMember"));
const Worries = lazy(() => import("./pages/Worries"));
const CheckupIntro = lazy(() => import("./pages/CheckupIntro"));
const Checkup = lazy(() => import("./pages/Checkup"));
const CheckupQuestions = lazy(() => import("./pages/CheckupQuestions"));
const CheckupInterlude = lazy(() => import("./pages/CheckupInterlude"));
const ParentIntro = lazy(() => import("./pages/ParentIntro"));
const ParentQuestions = lazy(() => import("./pages/ParentQuestions"));
const FamilyIntro = lazy(() => import("./pages/FamilyIntro"));
const FamilyQuestions = lazy(() => import("./pages/FamilyQuestions"));
const CheckupResults = lazy(() => import("./pages/CheckupResults"));
const ResultsReport = lazy(() => import("./pages/ResultsReport"));
const ResultsReportNew = lazy(() => import("./pages/ResultsReportNew"));
const CheckupHistory = lazy(() => import("./pages/CheckupHistory"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Appointments = lazy(() => import("./pages/Appointments"));
const AppointmentBooking = lazy(() => import("./pages/AppointmentBooking"));
const Packages = lazy(() => import("./pages/Packages"));
const Payment = lazy(() => import("./pages/Payment"));
const AppointmentConfirmation = lazy(() => import("./pages/AppointmentConfirmation"));

// Компонент загрузки
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground">Загрузка...</p>
    </div>
  </div>
);

// Настройка React Query с оптимизированными настройками кеширования
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут по умолчанию
      cacheTime: 10 * 60 * 1000, // 10 минут кеш
      retry: 2,
      refetchOnWindowFocus: false, // Не обновлять при фокусе
      refetchOnMount: false, // Использовать кеш при монтировании
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
              {/* Публичные маршруты */}
              <Route path="/" element={<Landing />} />
              <Route path="/service" element={<ServiceIntro />} />
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
                  <Route path="/worries/:profileId?" element={<ProtectedRoute><Worries /></ProtectedRoute>} />
                  <Route path="/checkup-intro/:profileId?" element={<ProtectedRoute><CheckupIntro /></ProtectedRoute>} />
                  <Route path="/checkup" element={<ProtectedRoute><Checkup /></ProtectedRoute>} />
                  <Route path="/checkup-questions/:profileId?" element={<ProtectedRoute><CheckupQuestions /></ProtectedRoute>} />
                  <Route path="/checkup-interlude/:profileId?" element={<ProtectedRoute><CheckupInterlude /></ProtectedRoute>} />
                  <Route path="/parent-intro" element={<ProtectedRoute><ParentIntro /></ProtectedRoute>} />
                  <Route path="/parent-questions/:profileId?" element={<ProtectedRoute><ParentQuestions /></ProtectedRoute>} />
                  <Route path="/family-intro" element={<ProtectedRoute><FamilyIntro /></ProtectedRoute>} />
                  <Route path="/family-questions/:profileId?" element={<ProtectedRoute><FamilyQuestions /></ProtectedRoute>} />
                  <Route path="/checkup-results" element={<ProtectedRoute><CheckupResults /></ProtectedRoute>} />
                  <Route path="/results-report/:profileId?" element={<ProtectedRoute><ResultsReportNew /></ProtectedRoute>} />
                  <Route path="/checkup-history" element={<ProtectedRoute><CheckupHistory /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  
                  {/* Консультации и оплата */}
                  <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
                  <Route path="/appointments/booking" element={<ProtectedRoute><AppointmentBooking /></ProtectedRoute>} />
                  <Route path="/appointments/confirmation" element={<ProtectedRoute><AppointmentConfirmation /></ProtectedRoute>} />
                  <Route path="/packages" element={<ProtectedRoute><Packages /></ProtectedRoute>} />
                  <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
