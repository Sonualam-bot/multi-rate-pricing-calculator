import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GuestOnlyRoute } from "./components/GuestOnlyRoute";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DocumentsListPage } from "./pages/DocumentsListPage";
import { DocumentEditorPage } from "./pages/DocumentEditorPage";
import { ReportPage } from "./pages/ReportPage";
import { PrintDocumentPage } from "./pages/PrintDocumentPage";
import { NotFoundPage } from "./pages/NotFoundPage";

/**
 * Route tree: /login + /signup sit behind GuestOnlyRoute, everything else
 * behind ProtectedRoute → Layout. See components/ProtectedRoute.tsx and
 * components/GuestOnlyRoute.tsx for the redirect logic.
 *
 * /documents/:id/print is deliberately a sibling of the Layout route
 * rather than nested inside it — still gated by ProtectedRoute since the
 * document data is private, but skipping Layout means no app nav bar ends
 * up in the printed/PDF output, only pages/PrintDocumentPage.tsx's own
 * minimal chrome.
 */
function App() {
  return (
    <Routes>
      <Route element={<GuestOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/documents" replace />} />
          <Route path="/documents" element={<DocumentsListPage />} />
          <Route path="/documents/:id" element={<DocumentEditorPage />} />
          <Route path="/reports" element={<ReportPage />} />
        </Route>
        <Route path="/documents/:id/print" element={<PrintDocumentPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
