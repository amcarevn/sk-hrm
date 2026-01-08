import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ChatbotList from './pages/ChatbotList';
import ChatbotCreate from './pages/ChatbotCreate';
import ChatbotEdit from './pages/ChatbotEdit';
import ChatbotShow from './pages/ChatbotShow';
import ConversationList from './pages/ConversationList';
import ConversationCreate from './pages/ConversationCreate';
import ConversationShow from './pages/ConversationShow';
import DocumentList from './pages/DocumentList';
import DocumentShow from './pages/DocumentShow';
import DocumentUpload from './pages/DocumentUpload';
import ApiKeyList from './pages/ApiKeyList';
import ApiKeyCreate from './pages/ApiKeyCreate';
import FacebookPages from './pages/FacebookPages';
import FacebookCallback from './pages/FacebookCallback';
import Login from './pages/Login';
import Publish from './pages/Publish';
import Settings from './pages/Settings';
import UserList from './pages/UserList';
import UserCreate from './pages/UserCreate';
import UserShow from './pages/UserShow';
import UserEdit from './pages/UserEdit';
import UserRoles from './pages/UserRoles';
import UserActivity from './pages/UserActivity';
import RoleList from './pages/RoleList';
import RoleShow from './pages/RoleShow';
import RoleCreate from './pages/RoleCreate';
import LandingLayout from './components/LandingLayout/Layout';
import TermsOfService from './pages/TermOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DomainManagement from './pages/DomainManagement';
import BotPermissions from './pages/BotPermissions';
import BotPermissionCreate from './pages/BotPermissionCreate';
import BotPermissionEdit from './pages/BotPermissionEdit';
import RoleEdit from './pages/RoleEdit';
import EmployeeList from './pages/EmployeeList';
import EmployeeCreate from './pages/EmployeeCreate';
import EmployeeShow from './pages/EmployeeShow';
import EmployeeEdit from './pages/EmployeeEdit';
import AttendanceManagement from './pages/AttendanceManagement';
import AttendanceUpload from './pages/AttendanceUpload';
import Approvals from './pages/Approvals';
import Onboarding from './pages/Onboarding';
import Offboarding from './pages/Offboarding';
import AssetList from './pages/asset/AssetList';
import OrganizationChart from './pages/OrganizationChart';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <LandingLayout>
                <LandingPage />
              </LandingLayout>
            }
          />
          <Route
            path="/terms-of-service"
            element={
              <LandingLayout>
                <TermsOfService />
              </LandingLayout>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <LandingLayout>
                <PrivacyPolicy />
              </LandingLayout>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/facebook-callback" element={<FacebookCallback />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/chatbots"
            element={
              <ProtectedRoute>
                <Layout>
                  <ChatbotList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/chatbots/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <ChatbotCreate />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/chatbots/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <ChatbotEdit />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/chatbots/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ChatbotShow />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/conversations"
            element={
              <ProtectedRoute>
                <Layout>
                  <ConversationList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/conversations/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <ConversationCreate />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/conversations/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ConversationShow />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/documents"
            element={
              <ProtectedRoute>
                <Layout>
                  <DocumentList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/documents/upload"
            element={
              <ProtectedRoute>
                <Layout>
                  <DocumentUpload />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/documents/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <DocumentShow />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/api-keys"
            element={
              <ProtectedRoute>
                <Layout>
                  <ApiKeyList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/api-keys/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <ApiKeyCreate />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/facebook-pages"
            element={
              <ProtectedRoute>
                <Layout>
                  <FacebookPages />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/users/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserCreate />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/users/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserShow />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/users/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserEdit />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/users/:id/roles"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserRoles />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/users/:id/activity"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserActivity />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/roles"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/roles/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleCreate />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/roles/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleEdit />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/roles/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleShow />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/chatbots/:id/domains"
            element={
              <ProtectedRoute>
                <Layout>
                  <DomainManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/bot-permissions"
            element={
              <ProtectedRoute>
                <Layout>
                  <BotPermissions />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/bot-permissions/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <BotPermissionCreate />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/bot-permissions/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <BotPermissionEdit />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* HRM Routes */}
          <Route
            path="/dashboard/employees"
            element={
              <ProtectedRoute>
                <Layout>
                  <EmployeeList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/employees/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <EmployeeCreate />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/employees/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <EmployeeShow />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/employees/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <EmployeeEdit />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/attendance"
            element={
              <ProtectedRoute>
                <Layout>
                  <AttendanceManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/attendance/upload"
            element={
              <ProtectedRoute>
                <Layout>
                  <AttendanceUpload />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/approvals"
            element={
              <ProtectedRoute>
                <Layout>
                  <Approvals />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/onboarding"
            element={
              <ProtectedRoute>
                <Layout>
                  <Onboarding />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/offboarding"
            element={
              <ProtectedRoute>
                <Layout>
                  <Offboarding />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Asset Management Routes */}
          <Route
            path="/dashboard/assets"
            element={
              <ProtectedRoute>
                <Layout>
                  <AssetList />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Organization Chart Route */}
          <Route
            path="/dashboard/organization-chart"
            element={
              <ProtectedRoute>
                <Layout>
                  <OrganizationChart />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Profile Route */}
          <Route
            path="/dashboard/me"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
