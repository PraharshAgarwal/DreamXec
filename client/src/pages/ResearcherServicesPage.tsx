import React, { useState, useEffect, useMemo } from "react";
import { 
  ServiceItem, 
  LabOfferingItem,
  MockOrderRecord 
} from "../data/mockResearcherServices";
import { researchServicesApi } from "../services/researchServicesService";
import { ServiceDetailModal } from "../components/services/ServiceDetailModal";
import { ServiceCheckoutModal } from "../components/services/ServiceCheckoutModal";
import { MyOrdersDrawer } from "../components/services/MyOrdersDrawer";
import { AddLabModal } from "../components/services/AddLabModal";
import { ServiceWorkflowBuilderModal } from "../components/services/ServiceWorkflowBuilderModal";
import { ShipmentTrackingModal } from "../components/services/ShipmentTrackingModal";
import { LabOpportunityBuilderModal } from "../components/services/LabOpportunityBuilderModal";
import { AdminPendingOfferingsModal } from "../components/services/AdminPendingOfferingsModal";
import { getUserRoleProfile } from "../utils/roleUtils";
import { 
  Search, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Layers, 
  FlaskConical, 
  Cpu, 
  Wrench, 
  Scale, 
  Package, 
  X,
  Plus,
  MapPin,
  CreditCard,
  Workflow,
  Truck,
  Building2,
  ShoppingBag
} from "lucide-react";

interface ResearcherServicesPageProps {
  currentUser?: any;
  onLogin?: () => void;
}

export const ResearcherServicesPage: React.FC<ResearcherServicesPageProps> = ({
  currentUser,
  onLogin,
}) => {
  // Role & Identity Resolution for Lab Partner Administration
  const roleProfile = getUserRoleProfile(currentUser);
  const activeRole = (currentUser?.activeProfile?.role || currentUser?.role || "").toString().toUpperCase();
  const isExternalAdmin =
    !!currentUser &&
    (roleProfile.orgType === "EXTERNAL_ORG" ||
      roleProfile.identityType === "ORG_ADMIN" ||
      ["EXTERNAL_ORG_MEMBER", "EXTERNAL_ORG", "ORG_ADMIN", "ADMIN", "DX_ADMIN", "SUPER_ADMIN"].includes(activeRole) ||
      currentUser?.role === "admin");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"POPULAR" | "PRICE_ASC" | "PRICE_DESC" | "FASTEST">("POPULAR");

  // Account Balance & Orders State
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [orders, setOrders] = useState<MockOrderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Active Drawers
  const [detailService, setDetailService] = useState<ServiceItem | null>(null);
  const [checkoutService, setCheckoutService] = useState<ServiceItem | null>(null);
  const [selectedOffering, setSelectedOffering] = useState<LabOfferingItem | null>(null);
  const [trackingOrderRef, setTrackingOrderRef] = useState<string | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isLabOpportunityModalOpen, setIsLabOpportunityModalOpen] = useState(false);
  const [selectedOpportunityMasterService, setSelectedOpportunityMasterService] = useState<any | null>(null);
  const [isAdminPendingModalOpen, setIsAdminPendingModalOpen] = useState(false);
  const [pendingOfferingsCount, setPendingOfferingsCount] = useState<number>(0);
  const [isOrdersDrawerOpen, setIsOrdersDrawerOpen] = useState(false);
  const [isAddLabModalOpen, setIsAddLabModalOpen] = useState(false);
  const [isWorkflowBuilderOpen, setIsWorkflowBuilderOpen] = useState(false);

  const refreshCatalog = () => {
    researchServicesApi.getServices().then((srvs) => {
      setServices(srvs || []);
    });
    if (isExternalAdmin) {
      researchServicesApi.getPendingOfferings().then((pending) => {
        setPendingOfferingsCount(pending?.length || 0);
      }).catch(() => {});
    }
  };

  // Initial Fetch for Live Balance & Services directly from PostgreSQL DB
  useEffect(() => {
    setLoading(true);
    researchServicesApi.getServices().then((srvs) => {
      setServices(srvs || []);
      setLoading(false);
    }).catch(() => setLoading(false));

    if (currentUser) {
      researchServicesApi.getAvailableBalance().then((bal) => {
        if (bal !== undefined) setAvailableBalance(bal);
      });
      researchServicesApi.getMyOrders().then((ords) => {
        if (ords && ords.length > 0) setOrders(ords);
      });
      if (isExternalAdmin) {
        researchServicesApi.getPendingOfferings().then((pending) => {
          setPendingOfferingsCount(pending?.length || 0);
        }).catch(() => {});
      }
    } else {
      setAvailableBalance(0);
      setOrders([]);
    }
  }, [currentUser, isExternalAdmin]);

  // Clean Categories
  const categories = [
    { key: "ALL", label: "All Services", icon: Layers },
    { key: "TESTING", label: "Lab Testing & Assays", icon: FlaskConical, color: "#FE4E1A" },
    { key: "CLOUD", label: "Cloud & GPUs", icon: Cpu, color: "#4717AE" },
    { key: "FABRICATION", label: "Hardware & PCB Fab", icon: Wrench, color: "#0F534A" },
    { key: "CHEMICALS", label: "Chemicals & Reagents", icon: Package, color: "#FE4E1A" },
    { key: "LEGAL", label: "Patents & Legal", icon: Scale, color: "#18D7E8" },
  ];

  // Quick Search suggestions
  const quickSearches = ["NMR test", "H100 GPU", "PCB board", "Solvents", "Electron Microscope", "Patent"];

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      // Category filter
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSummary = item.summary.toLowerCase().includes(q);
        const matchesVendor = item.vendor.name.toLowerCase().includes(q);
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSummary && !matchesVendor && !matchesTags) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "PRICE_ASC") return a.price - b.price;
      if (sortBy === "PRICE_DESC") return b.price - a.price;
      if (sortBy === "FASTEST") return a.turnaround.localeCompare(b.turnaround);
      return 0; // POPULAR
    });
  }, [services, selectedCategory, searchQuery, sortBy]);

  // Order lifecycle handlers
  const handleOrderSuccess = (newOrder: MockOrderRecord) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleAcceptDeliverable = (orderId: string) => {
    researchServicesApi.acceptDeliverable(orderId).then(() => {
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                status: "ESCROW_RELEASED",
                statusLabel: "Completed & Settled",
              }
            : ord
        )
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#FCFBF7] text-[#121316]">
      {/* Visual Hero Section */}
      <section className="relative bg-[#FFF9F2] border-b-4 border-[#121316] pt-10 pb-14 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#12131612_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Top Bar with Brand Badge */}
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FFDD33] border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
              <Sparkles className="w-4 h-4 text-[#FE4E1A]" />
              <span className="font-headline font-black text-xs uppercase tracking-wider text-[#121316]">
                DreamXec Research Services Hub
              </span>
            </div>
          </div>

          {/* Main Title */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-headline font-black text-[#121316] uppercase tracking-tight mb-2">
              What Does Your <span className="text-[#0F534A]">Research</span> Need?
            </h1>

            <p className="font-brush text-2xl sm:text-3xl text-[#FE4E1A] mb-6">
              "Access verified scientific facilities, testing cores & fabrication labs."
            </p>

            {/* Large Clean Search Bar */}
            <div className="max-w-2xl mx-auto mb-4">
              <div className="relative flex items-center bg-white border-3 border-[#121316] shadow-[6px_6px_0px_#121316] transition-all focus-within:shadow-[8px_8px_0px_#FE4E1A]">
                <Search className="w-6 h-6 text-gray-400 ml-4 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search equipment, chemical testing, H100 GPUs, PCB fab..."
                  className="w-full py-4 px-3 text-base sm:text-lg font-body text-[#121316] placeholder-gray-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mr-3 p-1 text-gray-400 hover:text-[#FE4E1A]"
                    title="Clear search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <button
                  className="mr-2 px-5 py-2.5 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#121316] active:translate-x-[1px] active:translate-y-[1px] shrink-0"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Quick Trending Searches */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-body text-gray-600 mb-8">
              <span className="font-headline font-bold text-gray-500 uppercase text-[11px]">Popular:</span>
              {quickSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => setSearchQuery(term)}
                  className="px-2.5 py-1 bg-white hover:bg-[#FFDD33] border border-[#121316] font-medium text-xs text-[#121316] transition-colors shadow-[1px_1px_0px_#121316]"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Value Props Row */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t-2 border-gray-200 text-xs font-headline font-bold text-gray-700">
              <span className="flex items-center gap-1.5 text-[#0F534A]">
                <ShieldCheck className="w-4 h-4 text-[#0F534A]" /> Institutional Quality Assurance
              </span>
              <span className="flex items-center gap-1.5 text-[#FE4E1A]">
                <CreditCard className="w-4 h-4 text-[#FE4E1A]" /> Official Razorpay (dreamxec.com)
              </span>
              <span className="flex items-center gap-1.5 text-[#4717AE]">
                <Clock className="w-4 h-4 text-[#4717AE]" /> Fast Courier & Cold-Chain Logistics
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Role-Restricted External Lab Admin Toolbar */}
        {isExternalAdmin && (
          <div className="mb-8 p-4 sm:p-5 bg-[#FFF9F2] border-3 border-[#121316] shadow-[4px_4px_0px_#121316] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[#0F534A] text-[#9EFC5F] flex items-center justify-center font-bold border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-headline font-black uppercase tracking-wider text-[#121316]">
                    External Lab Partner Portal
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#FFDD33] text-[#121316] border border-[#121316]">
                    PARTNER ADMIN
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-body">
                  Authorized service publishing & onboarding for{" "}
                  <strong className="text-[#0F534A]">
                    {roleProfile.orgName && roleProfile.orgName !== "DreamXec Dual-Custody Network"
                      ? roleProfile.orgName
                      : "External Facility Provider"}
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedOpportunityMasterService(services[0] || null);
                  setIsLabOpportunityModalOpen(true);
                }}
                className="px-3.5 py-2.5 bg-[#4717AE] hover:bg-[#38108c] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#121316] flex items-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <Building2 className="w-4 h-4 text-[#FEB3FC]" />
                <span>Outsource Intake Builder</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAdminPendingModalOpen(true)}
                className="relative px-3.5 py-2.5 bg-[#FFDD33] hover:bg-[#ebd028] text-[#121316] border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#121316] flex items-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <ShieldCheck className="w-4 h-4 text-[#FE4E1A]" />
                <span>Review Applications</span>
                {pendingOfferingsCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-[#FE4E1A] text-white text-[10px] font-mono font-bold border border-[#121316]">
                    {pendingOfferingsCount} PENDING
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsAddLabModalOpen(true)}
                className="px-3.5 py-2.5 bg-[#0F534A] hover:bg-[#18776b] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#121316] flex items-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 text-[#9EFC5F]" />
                <span>Quick Add Lab</span>
              </button>

              <button
                type="button"
                onClick={() => setIsWorkflowBuilderOpen(true)}
                className="px-4 py-2.5 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#121316] flex items-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <Workflow className="w-4 h-4 text-[#FFDD33]" />
                <span>Build New Service</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Action Navigation Bar for Researchers & Labs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {currentUser && (
              <button
                type="button"
                onClick={() => setIsOrdersDrawerOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-[#FFDD33] text-[#121316] border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#121316] flex items-center gap-1.5 transition-transform active:translate-x-[1px] cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#FE4E1A]" />
                <span>My Orders ({orders.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (orders.length > 0) {
                  setTrackingOrderRef(orders[0].orderNumber);
                } else {
                  setTrackingOrderRef("ORD-DEMO-3D");
                }
                setIsTrackingModalOpen(true);
              }}
              className="px-3.5 py-2 bg-white hover:bg-[#18D7E8] text-[#121316] border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#121316] flex items-center gap-1.5 transition-transform active:translate-x-[1px] cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-[#0F534A]" />
              <span>Track Shipment</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedOpportunityMasterService(services[0] || null);
                setIsLabOpportunityModalOpen(true);
              }}
              className="px-3.5 py-2 bg-white hover:bg-[#9EFC5F] text-[#121316] border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#121316] flex items-center gap-1.5 transition-transform active:translate-x-[1px] cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-[#4717AE]" />
              <span>Lab Opportunities Catalog</span>
            </button>
          </div>

          {availableBalance > 0 && (
            <div className="px-3 py-1.5 bg-[#FFF9F2] border-2 border-[#0F534A] text-xs font-headline font-bold text-[#0F534A] flex items-center gap-1.5 shadow-[2px_2px_0px_#121316]">
              <span>Grant Balance:</span>
              <span className="font-black">₹{availableBalance.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Category Carousel / Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-6 mb-6 border-b-2 border-gray-200 py-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            const Icon = cat.icon;

            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2.5 font-headline font-bold text-xs uppercase tracking-wider border-2 border-[#121316] whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? "bg-[#0F534A] text-white shadow-[3px_3px_0px_#121316] translate-y-[-1px]"
                    : "bg-white text-gray-800 hover:bg-[#FFF9F2] shadow-[2px_2px_0px_#121316]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results Counter & Sort */}
        <div className="flex items-center justify-between mb-8">
          <p className="font-headline font-bold text-sm text-gray-700">
            Available Services ({filteredServices.length})
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs font-headline font-bold text-gray-500 uppercase">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="p-1.5 bg-white border border-[#121316] font-body text-xs focus:outline-none shadow-[2px_2px_0px_#121316]"
            >
              <option value="POPULAR">Most Popular</option>
              <option value="PRICE_ASC">Price: Low to High</option>
              <option value="PRICE_DESC">Price: High to Low</option>
              <option value="FASTEST">Fastest Turnaround</option>
            </select>
          </div>
        </div>

        {/* Clean Visual Cards Grid (3 Columns) */}
        {loading ? (
          <div className="p-16 text-center bg-white border-3 border-[#121316] shadow-[6px_6px_0px_#121316] max-w-lg mx-auto">
            <div className="w-8 h-8 border-4 border-[#0F534A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-headline font-bold text-sm text-gray-700 uppercase">
              Loading Research Services Catalog...
            </p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-16 text-center bg-white border-3 border-[#121316] shadow-[6px_6px_0px_#121316] max-w-lg mx-auto">
            <FlaskConical className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-xl font-headline font-black text-[#121316] uppercase mb-1">
              No matching services found
            </h3>
            <p className="font-body text-xs text-gray-600 mb-6">
              We couldn't find anything matching "{searchQuery}". Try searching for terms like "NMR", "GPU", or "Testing".
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
              }}
              className="px-5 py-2.5 bg-[#FE4E1A] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#121316]"
            >
              Clear Search & Show All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white border-3 border-[#121316] shadow-[6px_6px_0px_#121316] hover:shadow-[9px_9px_0px_#FE4E1A] transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Visual Image Header */}
                <div className="relative h-48 w-full border-b-3 border-[#121316] overflow-hidden bg-gray-900">
                  <img
                    src={service.imageUrl}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-95"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* Category Pill Tag */}
                  <span 
                    className="absolute top-3 left-3 px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider text-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316]"
                    style={{ backgroundColor: service.categoryColor }}
                  >
                    {service.categoryLabel}
                  </span>

                  {/* Academic Subsidy Badge */}
                  {service.discountPct > 0 && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider bg-[#FFDD33] text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                      {service.discountPct}% Grant Subsidy
                    </span>
                  )}

                  {/* Turnaround Pill at bottom of image */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-0.5 bg-white/95 border border-[#121316] text-[10px] font-headline font-bold text-[#121316]">
                    <Clock className="w-3 h-3 text-[#FE4E1A]" />
                    <span>{service.turnaround}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Title */}
                    <h3 className="font-headline font-black text-lg text-[#121316] uppercase tracking-tight leading-snug mb-2 group-hover:text-[#FE4E1A] transition-colors">
                      {service.title}
                    </h3>

                    {/* Human friendly summary */}
                    <p className="font-body text-xs text-gray-700 leading-relaxed mb-4">
                      {service.summary}
                    </p>

                    {/* Competing Labs Indicator or Single Provider */}
                    {service.offerings && service.offerings.length > 0 ? (
                      <div className="mb-4 p-2 bg-[#FFF9F2] border border-[#121316] flex items-center justify-between text-xs">
                        <span className="font-headline font-bold text-[#0F534A] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#FE4E1A]" />
                          <span>{service.offerings.length} {service.offerings.length === 1 ? "Lab Available" : "Labs Competing"}</span>
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">
                          {service.offerings[0].vendorLocation}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] font-body text-gray-600 mb-4 pb-4 border-b border-gray-200">
                        <MapPin className="w-3.5 h-3.5 text-[#FE4E1A] shrink-0" />
                        <span className="font-headline font-bold text-gray-900 truncate">{service.vendor.name}</span>
                        <span>•</span>
                        <span className="text-[10px] font-mono text-[#0F534A]">{service.vendor.accreditation.split("&")[0]}</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing & Actions */}
                  <div>
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-headline font-black text-2xl text-[#0F534A]">
                            ₹{service.price.toLocaleString()}
                          </span>
                          {service.discountPct > 0 && (
                            <span className="text-xs text-gray-400 line-through">
                              ₹{service.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-body text-gray-500 block">
                          {service.offerings && service.offerings.length > 1 ? `Starting ${service.unit}` : service.unit}
                        </span>
                      </div>

                      <span className="text-[10px] font-headline font-bold px-2 py-0.5 bg-[#9EFC5F]/30 border border-[#0F534A] text-[#0F534A]">
                        ✓ Balance or Online
                      </span>
                    </div>

                    {/* Dual Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setDetailService(service)}
                        className="py-2.5 px-3 bg-white hover:bg-gray-100 border-2 border-[#121316] font-headline font-bold text-xs uppercase tracking-wider text-[#121316] shadow-[2px_2px_0px_#121316] active:translate-x-[1px] active:translate-y-[1px] text-center cursor-pointer"
                      >
                        {service.offerings && service.offerings.length > 1 ? "Compare Labs" : "Specs & Info"}
                      </button>
                      <button
                        onClick={() => {
                          if (!currentUser) {
                            onLogin?.();
                            return;
                          }
                          if (service.offerings && service.offerings.length > 1) {
                            setDetailService(service);
                          } else {
                            setSelectedOffering(service.offerings?.[0] || null);
                            setCheckoutService(service);
                          }
                        }}
                        className="py-2.5 px-3 bg-[#FE4E1A] hover:bg-[#e03d0d] border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider text-white shadow-[2px_2px_0px_#121316] active:translate-x-[1px] active:translate-y-[1px] text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Order Service
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <ServiceDetailModal
        service={detailService}
        isOpen={!!detailService}
        onClose={() => setDetailService(null)}
        onBookWithEscrow={(srv, offering) => {
          setDetailService(null);
          if (!currentUser) {
            onLogin?.();
            return;
          }
          setSelectedOffering(offering || null);
          setCheckoutService(srv);
        }}
        onOfferThisService={(srv) => {
          setDetailService(null);
          setSelectedOpportunityMasterService(srv);
          setIsLabOpportunityModalOpen(true);
        }}
      />

      <ServiceCheckoutModal
        service={checkoutService}
        selectedOffering={selectedOffering}
        isOpen={!!checkoutService}
        onClose={() => {
          setCheckoutService(null);
          setSelectedOffering(null);
        }}
        availableBalance={availableBalance}
        onBalanceUpdated={(newBal) => setAvailableBalance(newBal)}
        onOrderSuccess={handleOrderSuccess}
        onOpenTracking={(orderNumber) => {
          setTrackingOrderRef(orderNumber);
          setIsTrackingModalOpen(true);
        }}
        currentUser={currentUser}
        onLogin={onLogin}
      />

      <MyOrdersDrawer
        isOpen={isOrdersDrawerOpen}
        onClose={() => setIsOrdersDrawerOpen(false)}
        orders={orders}
        onAcceptDeliverable={handleAcceptDeliverable}
        onOpenTracking={(orderNumber) => {
          setTrackingOrderRef(orderNumber);
          setIsTrackingModalOpen(true);
        }}
      />

      <ShipmentTrackingModal
        orderNumberOrId={trackingOrderRef}
        isOpen={isTrackingModalOpen}
        onClose={() => {
          setIsTrackingModalOpen(false);
          setTrackingOrderRef(null);
        }}
      />

      <LabOpportunityBuilderModal
        masterService={selectedOpportunityMasterService || services[0] || null}
        isOpen={isLabOpportunityModalOpen}
        onClose={() => setIsLabOpportunityModalOpen(false)}
        onSuccess={refreshCatalog}
        currentUser={currentUser}
      />

      <AdminPendingOfferingsModal
        isOpen={isAdminPendingModalOpen}
        onClose={() => setIsAdminPendingModalOpen(false)}
        onRefreshServices={refreshCatalog}
      />

      <AddLabModal
        isOpen={isAddLabModalOpen}
        onClose={() => setIsAddLabModalOpen(false)}
        onSuccess={(newLab) => {
          setServices((prev) => [newLab, ...prev]);
        }}
      />

      <ServiceWorkflowBuilderModal
        isOpen={isWorkflowBuilderOpen}
        onClose={() => setIsWorkflowBuilderOpen(false)}
        onSuccess={(newService) => {
          setServices((prev) => [newService, ...prev]);
        }}
        defaultVendorName={
          roleProfile.orgName && roleProfile.orgName !== "DreamXec Dual-Custody Network"
            ? roleProfile.orgName
            : currentUser?.activeProfile?.orgName
        }
      />
    </div>
  );
};
