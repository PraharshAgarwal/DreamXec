import { AppProviders } from "./providers";
import { AppRoutes } from "./AppRoutes";

export default function App() {
  return (
    <AppProviders>
      <div className="text-dreamxec-navy font-sans min-h-screen">
        <AppRoutes />
      </div>
    </AppProviders>
  );
}
