import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout.js";
import { DashboardLayout } from "../layouts/DashboardLayout.js";
import { ProtectedRoute } from "../layouts/ProtectedRoute.js";
import { OnboardingGuard } from "../layouts/OnboardingGuard.js";
import { OnboardingPage } from "../../features/onboarding/OnboardingPage.js";
import { LandingPage } from "../../features/landing/LandingPage.js";
import { LoginPage } from "../../features/auth/LoginPage.js";
import { SignupPage } from "../../features/auth/SignupPage.js";
import { DashboardPage } from "../../features/dashboard/DashboardPage.js";
import { ContactsPage } from "../../features/contacts/ContactsPage.js";
import { TemplatesPage } from "../../features/templates/TemplatesPage.js";
import { AiWriterPage } from "../../features/ai-writer/AiWriterPage.js";
import { ResumePage } from "../../features/resumes/ResumePage.js";
import { CareerFitPage } from "../../features/career-fit/CareerFitPage.js";
import { RoadmapPage } from "../../features/roadmaps/RoadmapPage.js";
import { InterviewPrepPage } from "../../features/interview-prep/InterviewPrepPage.js";
import { JobBoardPage } from "../../features/jobs/JobBoardPage.js";
import { CommunityPage } from "../../features/community/CommunityPage.js";
import { RoomListPage } from "../../features/interview-room/RoomListPage.js";
import { RoomCallPage } from "../../features/interview-room/RoomCallPage.js";
import { RoomSummaryPage } from "../../features/interview-room/RoomSummaryPage.js";
import { CampaignsPage } from "../../features/campaigns/CampaignsPage.js";
import { CreateCampaignPage } from "../../features/campaigns/CreateCampaignPage.js";
import { CampaignDetailPage } from "../../features/campaigns/CampaignDetailPage.js";
import { IntegrationsPage } from "../../features/integrations/IntegrationsPage.js";
import { SettingsLayout } from "../../features/settings/SettingsLayout.js";
import { ProfileSettingsPage } from "../../features/settings/ProfileSettingsPage.js";
import { PublicProfileSettingsPage } from "../../features/settings/PublicProfileSettingsPage.js";
import { EmailTrackingPage } from "../../features/email-tracking/EmailTrackingPage.js";
import { PricingPage } from "../../features/pricing/PricingPage.js";
import { HowToUsePage } from "../../features/how-to-use/HowToUsePage.js";
import { JobIntelPage } from "../../features/job-outreach/JobIntelPage.js";
import { NewsPage } from "../../features/news/NewsPage.js";
import { PublicIdentityPage } from "../../features/public-identity/PublicIdentityPage.js";
import { NotesPage } from "../../features/notes/NotesPage.js";
import { DesignStudioPage } from "../../features/design-studio/DesignStudioPage.js";
import { DesignProjectsPage } from "../../features/design-studio/DesignProjectsPage.js";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/u/:username" element={<PublicIdentityPage />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<OnboardingGuard expectCompleted={false} />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          <Route element={<OnboardingGuard expectCompleted />}>
            <Route path="/app" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="ai-writer" element={<AiWriterPage />} />
              <Route path="resume" element={<ResumePage />} />
              <Route path="career-fit" element={<CareerFitPage />} />
              <Route path="roadmaps" element={<RoadmapPage />} />
              <Route path="job-outreach" element={<JobIntelPage />} />
              <Route path="interview-prep" element={<InterviewPrepPage />} />
              <Route path="jobs" element={<JobBoardPage />} />
              <Route path="community" element={<CommunityPage />} />
              <Route path="news" element={<NewsPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="design-studio" element={<DesignProjectsPage />} />
              <Route path="design-studio/:projectId" element={<DesignStudioPage />} />
              <Route path="interview-room" element={<RoomListPage />} />
              <Route path="interview-room/:code" element={<RoomCallPage />} />
              <Route path="interview-room/:code/summary" element={<RoomSummaryPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="campaigns/new" element={<CreateCampaignPage />} />
              <Route path="campaigns/:id" element={<CampaignDetailPage />} />
              <Route path="analytics" element={<CampaignsPage />} />
              <Route path="email-tracking" element={<EmailTrackingPage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route path="settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<ProfileSettingsPage />} />
                <Route path="public-profile" element={<PublicProfileSettingsPage />} />
              </Route>
              <Route path="pricing" element={<PricingPage />} />
              <Route path="how-to-use" element={<HowToUsePage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
