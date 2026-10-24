import { Menu } from 'lucide-react';

interface MobileMenuButtonProps {
  onClick?: () => void;
}

export const MobileMenuButton = ({ onClick }: MobileMenuButtonProps) => {
  return (
    <button
      onClick={onClick}
      aria-label="Toggle navigation menu"
      className="md:hidden p-2 rounded-lg bg-[#FE4E1A] text-white hover:bg-[#0F534A] border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex items-center justify-center"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
};
