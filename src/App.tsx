import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ModeRouter from "./pages/ModeRouter";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import CommunityHome from "./pages/CommunityHome";
import StudentHome from "./pages/StudentHome";
import ProfessionalHome from "./pages/ProfessionalHome";
import ProfessionalTools from "./pages/ProfessionalTools";
import ProfessionalDashboard from "./pages/ProfessionalDashboard";
import InstructorHome from "./pages/InstructorHome";
import InstructorGuide from "./pages/InstructorGuide";
import ResourceBundles from "./pages/ResourceBundles";
import AdminInstructorCodes from "./pages/AdminInstructorCodes";
import AdminProfessionalRequests from "./pages/AdminProfessionalRequests";
import AdminOrgVerifications from "./pages/AdminOrgVerifications";
import OrgVerificationGuide from "./pages/OrgVerificationGuide";
import OrgVerificationStatus from "./pages/OrgVerificationStatus";
import Settings from "./pages/Settings";
import VerifyEdu from "./pages/VerifyEdu";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import StepByStepHelp from "./pages/StepByStepHelp";
import PhoneCompanion from "./pages/PhoneCompanion";
import FormHelper from "./pages/FormHelper";
import DocumentSafeBox from "./pages/DocumentSafeBox";
import ImOverwhelmed from "./pages/ImOverwhelmed";
import LifeTasksLibrary from "./pages/LifeTasksLibrary";
import LifeTaskDetail from "./pages/LifeTaskDetail";
import QuickTasks from "./pages/QuickTasks";
import MiniLessons from "./pages/MiniLessons";
import MyHub from "./pages/MyHub";
import CostOfLivingExplorer from "./pages/CostOfLivingExplorer";
import HealthcareHelp from "./pages/HealthcareHelp";
import StudyRooms from "./pages/StudyRooms";
import StudyRoomDetail from "./pages/StudyRoomDetail";
import SystemNavigator from "./pages/SystemNavigator";
import OrganizationHub from "./pages/OrganizationHub";
import SupportThreads from "./pages/SupportThreads";
import ClaimBundle from './pages/ClaimBundle';
import AcceptInvite from './pages/AcceptInvite';
import OrganizationManagement from './pages/OrganizationManagement';
import OrganizationMemberProfile from './pages/OrganizationMemberProfile';
import OrganizationDirectory from './pages/OrganizationDirectory';
import BrowseOrganizations from './pages/BrowseOrganizations';
import AssignmentCreator from './pages/AssignmentCreator';
import CaseDocumentation from './pages/CaseDocumentation';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ClientJourneyTracking from './pages/ClientJourneyTracking';
import BulkOperations from './pages/BulkOperations';
import ExportTools from './pages/ExportTools';
import WorkflowGenerator from './pages/WorkflowGenerator';
import ResourcePassport from './pages/ResourcePassport';

// Force rebuild to regenerate Supabase types
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ModeRouter />} />
          <Route path="/resources" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/verify-edu" element={<VerifyEdu />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/community-home" element={<CommunityHome />} />
          <Route path="/student-home" element={<StudentHome />} />
          <Route path="/instructor-home" element={<InstructorHome />} />
          <Route path="/professional-home" element={<ProfessionalHome />} />
          <Route path="/step-by-step-help" element={<StepByStepHelp />} />
          <Route path="/phone-companion" element={<PhoneCompanion />} />
          <Route path="/form-helper" element={<FormHelper />} />
          <Route path="/document-safe-box" element={<DocumentSafeBox />} />
          <Route path="/im-overwhelmed" element={<ImOverwhelmed />} />
          <Route path="/life-tasks-library" element={<LifeTasksLibrary />} />
          <Route path="/life-task/:taskId" element={<LifeTaskDetail />} />
          <Route path="/quick-tasks" element={<QuickTasks />} />
          <Route path="/mini-lessons" element={<MiniLessons />} />
          <Route path="/my-hub" element={<MyHub />} />
          <Route path="/cost-of-living" element={<CostOfLivingExplorer />} />
          <Route path="/healthcare-help" element={<HealthcareHelp />} />
          <Route path="/study-rooms" element={<StudyRooms />} />
          <Route path="/study-room/:roomId" element={<StudyRoomDetail />} />
          <Route path="/professional-dashboard" element={<ProfessionalDashboard />} />
          <Route path="/professional-tools" element={<ProfessionalTools />} />
          <Route path="/instructor-guide" element={<InstructorGuide />} />
          <Route path="/resource-bundles" element={<ResourceBundles />} />
          <Route path="/system-navigator" element={<SystemNavigator />} />
          <Route path="/admin/instructor-codes" element={<AdminInstructorCodes />} />
          <Route path="/admin/professional-requests" element={<AdminProfessionalRequests />} />
          <Route path="/admin/org-verifications" element={<AdminOrgVerifications />} />
          <Route path="/org-verification-guide" element={<OrgVerificationGuide />} />
          <Route path="/org-verification-status" element={<OrgVerificationStatus />} />
          <Route path="/hub/:slug" element={<OrganizationHub />} />
          <Route path="/support-threads" element={<SupportThreads />} />
          <Route path="/claim-bundle" element={<ClaimBundle />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/organization-management" element={<OrganizationManagement />} />
          <Route path="/organization-member-profile" element={<OrganizationMemberProfile />} />
          <Route path="/organization-directory" element={<OrganizationDirectory />} />
          <Route path="/browse-organizations" element={<BrowseOrganizations />} />
          <Route path="/assignment-creator" element={<AssignmentCreator />} />
          <Route path="/case-documentation" element={<CaseDocumentation />} />
          <Route path="/analytics-dashboard" element={<AnalyticsDashboard />} />
          <Route path="/client-journey-tracking" element={<ClientJourneyTracking />} />
          <Route path="/bulk-operations" element={<BulkOperations />} />
          <Route path="/export-tools" element={<ExportTools />} />
          <Route path="/workflow-generator" element={<WorkflowGenerator />} />
          <Route path="/resource-passport" element={<ResourcePassport />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
