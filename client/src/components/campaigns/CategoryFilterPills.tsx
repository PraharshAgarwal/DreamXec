import React from 'react';
import { Sparkles, GraduationCap, Lightbulb, HeartHandshake, ShieldAlert, Users, Compass } from 'lucide-react';

export interface CategoryOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
}

export interface CategoryFilterPillsProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
}

export const CategoryFilterPills: React.FC<CategoryFilterPillsProps> = ({
  selectedCategory,
  onSelectCategory,
  className = '',
}) => {
  const categories: CategoryOption[] = [
    {
      id: 'ALL',
      label: 'All Initiatives',
      icon: <Compass className="w-4 h-4" />,
      activeColor: 'bg-[#FE4E1A] text-white border-[#0F534A] shadow-[3px_3px_0px_#0F534A]',
    },
    {
      id: 'STARTUP_INNOVATION',
      label: 'Startup Innovation',
      icon: <Lightbulb className="w-4 h-4" />,
      activeColor: 'bg-[#FFDD33] text-[#121316] border-[#0F534A] shadow-[3px_3px_0px_#0F534A]',
    },
    {
      id: 'RESEARCH_GRANT',
      label: 'Research Grants',
      icon: <Sparkles className="w-4 h-4" />,
      activeColor: 'bg-[#18D7E8] text-[#041A16] border-[#0F534A] shadow-[3px_3px_0px_#0F534A]',
    },
    {
      id: 'TUITION_FEE',
      label: 'Tuition & Education',
      icon: <GraduationCap className="w-4 h-4" />,
      activeColor: 'bg-[#FEB3FC] text-[#350f87] border-[#0F534A] shadow-[3px_3px_0px_#0F534A]',
    },
    {
      id: 'COMMUNITY_PROJECT',
      label: 'Community Action',
      icon: <HeartHandshake className="w-4 h-4" />,
      activeColor: 'bg-[#9EFC5F] text-[#0F534A] border-[#0F534A] shadow-[3px_3px_0px_#0F534A]',
    },
    {
      id: 'EMERGENCY_AID',
      label: 'Emergency Aid',
      icon: <ShieldAlert className="w-4 h-4" />,
      activeColor: 'bg-[#F4002C] text-white border-[#0F534A] shadow-[3px_3px_0px_#0F534A]',
    },
    {
      id: 'CLUB_PROJECT',
      label: 'Student Clubs',
      icon: <Users className="w-4 h-4" />,
      activeColor: 'bg-[#4717AE] text-white border-[#0F534A] shadow-[3px_3px_0px_#FE4E1A]',
    },
  ];

  return (
    <div className={`w-full overflow-x-auto pb-2 scrollbar-none ${className}`}>
      <div className="flex items-center gap-2.5 min-w-max">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 font-headline font-black text-xs uppercase tracking-wider transition-all select-none cursor-pointer border-2 ${
                isSelected
                  ? `${cat.activeColor} -translate-y-0.5`
                  : 'bg-[#FCFBF7] text-[#121316] border-[#0F534A] shadow-[2px_2px_0px_#0F534A] hover:bg-[#FFF9F2] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#0F534A]'
              }`}
            >
              <span className="flex items-center">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
