import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HandoverProvider } from "./context/HandoverContext";
import {
  StartPage,
  DashboardPage,
  ReviewPage,
  TimelinePage,
  GapsPage,
  HandoverPage,
  PreviewPage,
} from "./pages";

export default function App() {
  return (
    <HandoverProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/gaps" element={<GapsPage />} />
          <Route path="/handover" element={<HandoverPage />} />
          <Route path="/preview" element={<PreviewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </HandoverProvider>
  );
}
