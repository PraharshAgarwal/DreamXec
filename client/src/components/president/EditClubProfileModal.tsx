import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Wrench, Sparkles, Building2, UserCheck, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateClubProfile, type PublicSingleClub, type UpdateClubProfilePayload } from '../../services/clubService';

interface EditClubProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: PublicSingleClub;
  onProfileUpdated: (updatedClub: PublicSingleClub) => void;
}

export default function EditClubProfileModal({
  isOpen,
  onClose,
  club,
  onProfileUpdated,
}: EditClubProfileModalProps) {
  const [activeSection, setActiveSection] = useState<'general' | 'advisor' | 'stacks' | 'facilities'>('general');
  const [isSaving, setIsSaving] = useState(false);

  // Form State initialized with current club values
  const [motto, setMotto] = useState(club?.motto || '');
  const [tagline, setTagline] = useState(club?.tagline || '');
  const [category, setCategory] = useState(club?.category || '');
  const [labLocation, setLabLocation] = useState(club?.labLocation || '');
  const [meetingSchedule, setMeetingSchedule] = useState(club?.meetingSchedule || '');

  const [advisorName, setAdvisorName] = useState(club?.facultyAdvisor?.name || '');
  const [advisorDesignation, setAdvisorDesignation] = useState(club?.facultyAdvisor?.designation || '');
  const [advisorDepartment, setAdvisorDepartment] = useState(club?.facultyAdvisor?.department || '');

  const [technicalStacks, setTechnicalStacks] = useState<Array<{ name: string; description: string; tag: string }>>(
    club?.technicalStacks && club.technicalStacks.length > 0
      ? [...club.technicalStacks]
      : [
          { name: 'Rapid Prototyping & CAD', description: 'Functional fabrication and mechanical drafting.', tag: 'Hardware' },
          { name: 'Embedded Systems & Telemetry', description: 'Firmware development and wireless telemetry.', tag: 'Systems' },
        ]
  );

  const [facilities, setFacilities] = useState<string[]>(
    club?.facilities && club.facilities.length > 0
      ? [...club.facilities]
      : ['Main Innovation Lab & Prototyping Benches', 'Precision Oscilloscopes & Diagnostic Workstation']
  );

  if (!isOpen) return null;

  // Stacks management
  const handleAddStack = () => {
    setTechnicalStacks([
      ...technicalStacks,
      { name: 'New Technology / Tool', description: 'Describe how your club uses this technology.', tag: 'Tool' },
    ]);
  };

  const handleUpdateStack = (index: number, field: 'name' | 'description' | 'tag', value: string) => {
    const updated = [...technicalStacks];
    updated[index] = { ...updated[index], [field]: value };
    setTechnicalStacks(updated);
  };

  const handleRemoveStack = (index: number) => {
    setTechnicalStacks(technicalStacks.filter((_, i) => i !== index));
  };

  // Facilities management
  const handleAddFacility = () => {
    setFacilities([...facilities, 'New Equipment / Workstation']);
  };

  const handleUpdateFacility = (index: number, value: string) => {
    const updated = [...facilities];
    updated[index] = value;
    setFacilities(updated);
  };

  const handleRemoveFacility = (index: number) => {
    setFacilities(facilities.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload: UpdateClubProfilePayload = {
        motto: motto.trim() || undefined,
        tagline: tagline.trim() || undefined,
        category: category.trim() || undefined,
        labLocation: labLocation.trim() || undefined,
        meetingSchedule: meetingSchedule.trim() || undefined,
        facultyAdvisor: {
          name: advisorName.trim() || 'Faculty Mentor',
          designation: advisorDesignation.trim() || 'Research Advisor',
          department: advisorDepartment.trim() || club.college || 'Engineering',
        },
        technicalStacks: technicalStacks.filter((s) => s.name.trim().length > 0),
        facilities: facilities.filter((f) => f.trim().length > 0),
      };

      const res = await updateClubProfile(club.id, payload);
      if (res.success && res.data) {
        toast.success('🎉 Club profile updated successfully!');
        onProfileUpdated(res.data);
        onClose();
      } else {
        toast.error(res.message || 'Failed to update club profile.');
      }
    } catch (err: any) {
      console.error('Club profile update error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Error updating profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border-4 border-[#121316] shadow-[8px_8px_0px_#121316] max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#0F534A] to-[#121316] text-white p-4 sm:p-5 flex items-center justify-between border-b-4 border-[#121316] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFDD33] border-2 border-[#121316] shadow-[2px_2px_0px_#121316] flex items-center justify-center text-[#121316]">
              <Wrench className="w-5 h-5 text-[#FE4E1A]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-headline font-black uppercase tracking-tight leading-none text-white">
                Edit Club Profile & Laboratory
              </h2>
              <p className="text-gray-300 font-sans text-xs mt-1">
                Customize your club's presentation, tech stacks, and lab equipment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-gray-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b-2 border-[#121316] bg-[#FFF9F2] px-3 sm:px-5 gap-1.5 overflow-x-auto flex-shrink-0 text-xs">
          {[
            { id: 'general', label: 'General & Mission', icon: Sparkles },
            { id: 'advisor', label: 'Faculty Advisor', icon: UserCheck },
            { id: 'stacks', label: 'Technical Stacks', icon: Layers },
            { id: 'facilities', label: 'Facilities & Labs', icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id as any)}
                className={`py-3 px-3.5 font-headline font-black uppercase tracking-wider flex items-center gap-1.5 border-b-3 transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#FE4E1A] text-[#FE4E1A] bg-white'
                    : 'border-transparent text-gray-600 hover:text-[#0F534A]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SECTION 1: GENERAL */}
          {activeSection === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1">
                  Motto / Signature Quote
                </label>
                <input
                  type="text"
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  placeholder='"Engineering next-gen autonomous systems for India 🌾"'
                  className="w-full px-3.5 py-2.5 bg-[#FFF9F2] border-2 border-[#121316] font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                />
                <span className="text-[11px] font-annotation text-[#FE4E1A] mt-1 block">
                  Displayed as a stylized handwritten highlight in the hero banner.
                </span>
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1">
                  Tagline & Primary Focus
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Autonomous Field Robotics, ROS2 Navigation & Edge-AI Perception Chapter"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1">
                    Club Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Field Robotics & Autonomy"
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1">
                    Meeting Schedule
                  </label>
                  <input
                    type="text"
                    value={meetingSchedule}
                    onChange={(e) => setMeetingSchedule(e.target.value)}
                    placeholder="Wednesdays & Saturdays, 5:30 PM IST"
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1">
                  Lab Location / Facility Address
                </label>
                <input
                  type="text"
                  value={labLocation}
                  onChange={(e) => setLabLocation(e.target.value)}
                  placeholder="Robotics & Mechatronics Innovation Lab, Block B, NITKKR"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                />
              </div>
            </div>
          )}

          {/* SECTION 2: ADVISOR */}
          {activeSection === 'advisor' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FFF9F2] border-2 border-[#121316] text-xs font-sans text-gray-700">
                <span className="font-bold text-[#0F534A]">Institutional Mentor: </span>
                Provide the credentials of the faculty advisor or research guide endorsing this club's lab activities.
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1">
                  Advisor Full Name
                </label>
                <input
                  type="text"
                  value={advisorName}
                  onChange={(e) => setAdvisorName(e.target.value)}
                  placeholder="Dr. P. K. Sharma"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                />
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1">
                  Designation / Academic Title
                </label>
                <input
                  type="text"
                  value={advisorDesignation}
                  onChange={(e) => setAdvisorDesignation(e.target.value)}
                  placeholder="Professor & Head of Mechatronics"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                />
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1">
                  Department / Institution
                </label>
                <input
                  type="text"
                  value={advisorDepartment}
                  onChange={(e) => setAdvisorDepartment(e.target.value)}
                  placeholder="Dept. of Mechanical & Robotics, NITKKR"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                />
              </div>
            </div>
          )}

          {/* SECTION 3: TECHNICAL STACKS */}
          {activeSection === 'stacks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline font-black uppercase text-xs sm:text-sm text-[#0F534A]">
                    Club Technical Stack & Tooling
                  </h3>
                  <p className="text-gray-500 text-xs">Frameworks, hardware tools, edge compute, and SDKs.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddStack}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9EFC5F] text-[#0F534A] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#8cee4e] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Stack</span>
                </button>
              </div>

              <div className="space-y-3">
                {technicalStacks.map((stack, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white border-2 border-[#121316] shadow-[3px_3px_0px_#0F534A] space-y-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={stack.tag}
                        onChange={(e) => handleUpdateStack(idx, 'tag', e.target.value)}
                        placeholder="Tag (e.g. Edge AI)"
                        className="w-28 px-2.5 py-1 bg-[#FFF9F2] border border-[#121316] text-xs font-bold text-[#FE4E1A]"
                      />
                      <input
                        type="text"
                        value={stack.name}
                        onChange={(e) => handleUpdateStack(idx, 'name', e.target.value)}
                        placeholder="Technology Name (e.g. ROS2 Humble)"
                        className="flex-1 px-2.5 py-1 bg-white border border-[#121316] text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStack(idx)}
                        className="p-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-600 transition-all cursor-pointer"
                        title="Delete Technology Tag"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={stack.description}
                      onChange={(e) => handleUpdateStack(idx, 'description', e.target.value)}
                      placeholder="Short description of what the club builds with this technology..."
                      rows={2}
                      className="w-full px-2.5 py-1.5 bg-[#FAF9F5] border border-[#121316]/40 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FE4E1A]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: FACILITIES */}
          {activeSection === 'facilities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline font-black uppercase text-xs sm:text-sm text-[#0F534A]">
                    Available Facilities & Equipment
                  </h3>
                  <p className="text-gray-500 text-xs">Equipment available for members to reserve in the lab workspace.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFacility}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFDD33] text-[#121316] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#ffe359] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Facility</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {facilities.map((fac, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={fac}
                      onChange={(e) => handleUpdateFacility(idx, e.target.value)}
                      placeholder="e.g. Formlabs SLA 3D Prototyping Workstation"
                      className="flex-1 px-3 py-2 bg-white border-2 border-[#121316] font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F534A]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFacility(idx)}
                      className="p-2 text-red-600 hover:bg-red-50 border-2 border-transparent hover:border-red-600 transition-all cursor-pointer"
                      title="Remove Equipment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t-2 border-[#121316] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white text-[#121316] border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider hover:bg-gray-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0F534A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[3px_3px_0px_#121316] hover:bg-[#0c423b] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-[#FFDD33]" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
