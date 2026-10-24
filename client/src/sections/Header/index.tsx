import { useNavigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import type { User } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  currentUser?: User | any | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const Header = ({ currentUser, onLogin, onLogout }: HeaderProps) => {
  const navigate = useNavigate();

  const authContext = useAuth();
  const user = currentUser !== undefined ? currentUser : authContext?.user || null;
  const handleLogin = onLogin || (() => navigate("/auth"));
  const handleLogout = onLogout || authContext?.handleLogout || (() => {});

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b-2 border-[#121316] shadow-[0_2px_0_rgba(15,83,74,0.12)] sticky top-0 z-50 transition-all">
      <div className="w-full px-4 lg:px-8 py-1.5">
        <Navbar currentUser={user} onLogin={handleLogin} onLogout={handleLogout} />
      </div>
    </header>
  );
};