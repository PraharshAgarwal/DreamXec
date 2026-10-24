import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MockOrderRecord } from "../data/mockResearcherServices";
import { researchServicesApi } from "../services/researchServicesService";
import { 
  Package, 
  Download, 
  ArrowLeft, 
  Search, 
  ShieldCheck, 
  FileText,
  Sparkles,
  Truck
} from "lucide-react";
import toast from "react-hot-toast";
import { ShipmentTrackingModal } from "../components/services/ShipmentTrackingModal";

interface ResearcherOrdersPageProps {
  currentUser?: any;
  onLogin?: () => void;
  embedded?: boolean;
}

const isSuccessfulOrder = (status?: string) => {
  if (!status) return false;
  const s = status.toUpperCase();
  return (
    s !== "PENDING_PAYMENT" &&
    s !== "PENDING" &&
    s !== "FAILED" &&
    s !== "PAYMENT_FAILED" &&
    s !== "CANCELLED"
  );
};

export const ResearcherOrdersPage: React.FC<ResearcherOrdersPageProps> = ({
  currentUser,
  onLogin,
  embedded = false,
}) => {
  const [orders, setOrders] = useState<MockOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_PROGRESS" | "COMPLETED">("ALL");
  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser) {
        setOrders([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await researchServicesApi.getMyOrders();
        const paidOrders = (res || []).filter((o: MockOrderRecord) => isSuccessfulOrder(o.status));
        setOrders(paidOrders);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser]);

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    if (!isSuccessfulOrder(order.status)) {
      return false;
    }

    if (statusFilter === "IN_PROGRESS" && (order.status === "COMPLETED" || order.status === "ESCROW_RELEASED")) {
      return false;
    }
    if (statusFilter === "COMPLETED" && !(order.status === "COMPLETED" || order.status === "ESCROW_RELEASED")) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = order.orderNumber.toLowerCase().includes(q);
      const matchTitle = order.serviceTitle.toLowerCase().includes(q);
      const matchVendor = order.vendorName.toLowerCase().includes(q);
      if (!matchNo && !matchTitle && !matchVendor) return false;
    }

    return true;
  });

  const getStatusBadge = (status: MockOrderRecord["status"]) => {
    switch (status) {
      case "COMPLETED":
      case "ESCROW_RELEASED":
        return {
          bg: "bg-[#9EFC5F]/40 text-[#0F534A] border-[#0F534A]",
          label: "Completed & Delivered",
          dot: "bg-[#0F534A]"
        };
      case "CONFIRMED":
        return {
          bg: "bg-[#FFDD33]/40 text-[#121316] border-[#121316]",
          label: "Confirmed & Dispatched",
          dot: "bg-[#0F534A]"
        };
      default:
        return {
          bg: "bg-blue-50 text-blue-900 border-blue-300",
          label: "In Progress (Processing at Facility)",
          dot: "bg-blue-500"
        };
    }
  };

  return (
    <div className={embedded ? "w-full space-y-6" : "min-h-screen bg-[#FCFBF7] text-[#121316]"}>
      {/* Top Breadcrumb & Header */}
      {embedded ? (
        <div className="bg-[#0F534A] text-white p-6 border-4 border-[#121316] shadow-[4px_4px_0_#FFDD33] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#FFDD33] border-2 border-[#121316] shadow-[2px_2px_0px_#121316] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FE4E1A]" />
              <span className="font-headline font-black text-[10px] uppercase tracking-wider text-[#121316]">
                External Labs Marketplace
              </span>
            </div>
            <h3 className="font-headline font-black text-2xl uppercase tracking-tight text-[#FFDD33]">
              My Lab & Service Orders
            </h3>
            <p className="text-xs text-gray-200 font-medium mt-1">
              Track analytical progress, courier sample dispatch, and release vendor escrow upon deliverable inspection
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/services"
              className="px-4 py-2 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#121316] transition-colors"
            >
              Browse Labs
            </Link>
            <div className="p-3 bg-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] text-right">
              <span className="text-[10px] font-headline uppercase font-bold text-gray-500 block">
                Total Orders
              </span>
              <span className="font-headline font-black text-xl text-[#0F534A]">
                {orders.length}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <section className="bg-[#FFF9F2] border-b-4 border-[#121316] py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Back Link */}
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-xs font-headline font-bold uppercase tracking-wider text-[#0F534A] hover:text-[#FE4E1A] transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Research Services Catalog
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#FFDD33] border-2 border-[#121316] shadow-[2px_2px_0px_#121316] mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#FE4E1A]" />
                  <span className="font-headline font-black text-[10px] uppercase tracking-wider text-[#121316]">
                    Researcher Workstation
                  </span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-headline font-black text-[#121316] uppercase tracking-tight">
                  My Research Orders
                </h1>
                <p className="font-body text-sm sm:text-base text-gray-700 mt-1 max-w-xl">
                  Track lab testing progress, view courier dispatch status, and download certified analytical reports directly from partner facilities.
                </p>
              </div>

              {/* Quick Stats Pill */}
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] text-right">
                  <span className="text-[10px] font-headline uppercase font-bold text-gray-500 block">
                    Total Orders Placed
                  </span>
                  <span className="font-headline font-black text-2xl text-[#0F534A]">
                    {orders.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Orders Section */}
      <main className={embedded ? "w-full" : "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1">
            {[
              { key: "ALL", label: `All (${orders.length})` },
              { key: "IN_PROGRESS", label: "In Progress" },
              { key: "COMPLETED", label: "Completed & Delivered" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key as any)}
                className={`px-3.5 py-2 font-headline font-bold text-xs uppercase tracking-wider border-2 border-[#121316] whitespace-nowrap transition-all ${
                  statusFilter === tab.key
                    ? "bg-[#0F534A] text-white shadow-[3px_3px_0px_#121316]"
                    : "bg-white text-gray-800 hover:bg-[#FFF9F2] shadow-[2px_2px_0px_#121316]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order # or service..."
              className="w-full pl-9 pr-3 py-2 bg-white border-2 border-[#121316] text-xs font-body focus:outline-none shadow-[2px_2px_0px_#121316]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Orders Listing */}
        {!currentUser ? (
          <div className="p-16 text-center bg-white border-3 border-[#121316] shadow-[6px_6px_0px_#121316] max-w-lg mx-auto">
            <ShieldCheck className="w-12 h-12 text-[#FE4E1A] mx-auto mb-3" />
            <h3 className="text-xl font-headline font-black text-[#121316] uppercase mb-1">
              Please Log In
            </h3>
            <p className="font-body text-xs text-gray-600 mb-6">
              You must be logged into your DreamXec account to view your research orders, track sample dispatch, and download deliverables.
            </p>
            <button
              onClick={() => onLogin?.()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#121316] cursor-pointer"
            >
              Log In to View Orders
            </button>
          </div>
        ) : loading ? (
          <div className="p-16 text-center bg-white border-3 border-[#121316] shadow-[4px_4px_0px_#121316]">
            <div className="w-8 h-8 border-4 border-[#0F534A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-headline font-bold text-sm text-gray-700 uppercase">
              Loading your research orders...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center bg-white border-3 border-[#121316] shadow-[6px_6px_0px_#121316] max-w-lg mx-auto">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-xl font-headline font-black text-[#121316] uppercase mb-1">
              No orders found
            </h3>
            <p className="font-body text-xs text-gray-600 mb-6">
              You haven't placed any orders matching this filter. Browse our catalog to request lab testing, GPU cloud, or prototyping.
            </p>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FE4E1A] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#121316]"
            >
              Browse Research Catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-white border-3 border-[#121316] shadow-[6px_6px_0px_#121316] p-6 transition-all hover:shadow-[8px_8px_0px_#121316]"
                >
                  {/* Top Bar: Order ID, Date & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-gray-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-[#121316]">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs font-body text-gray-500">• {order.date}</span>
                      </div>
                      <h3 className="text-lg font-headline font-black text-[#121316] uppercase tracking-tight mt-0.5">
                        {order.serviceTitle}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-headline font-black uppercase tracking-wider border border-[#121316] flex items-center gap-1.5 ${badge.bg}`}>
                        <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                      <button
                        onClick={() => setTrackingOrderNumber(order.orderNumber)}
                        className="px-3 py-1 bg-[#18D7E8] hover:bg-[#12b9c7] text-[#121316] border border-[#121316] font-headline font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_#121316] transition-transform active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" /> Track Live Shipment
                      </button>
                    </div>
                  </div>

                  {/* Middle Info Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-b-2 border-dashed border-gray-200 text-xs font-body">
                    <div>
                      <span className="text-[10px] font-headline uppercase font-bold text-gray-500 block">
                        Fulfillment Partner
                      </span>
                      <strong className="text-gray-900">{order.vendorName}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] font-headline uppercase font-bold text-gray-500 block">
                        Total Amount Paid
                      </span>
                      <strong className="font-headline font-black text-sm text-[#0F534A]">
                        ₹{order.amount.toLocaleString()}
                      </strong>
                      <span className="text-[10px] text-gray-500 block">
                        via {order.appliedFromBalance && order.appliedFromBalance > 0 ? "Account Balance" : "Razorpay"}
                      </span>
                    </div>

                    {order.sampleTrackingCode && (
                      <div>
                        <span className="text-[10px] font-headline uppercase font-bold text-gray-500 block">
                          Cold-Chain Tracking ID
                        </span>
                        <span className="font-mono font-bold text-gray-900 bg-[#FCFBF7] px-2 py-0.5 border border-gray-300 inline-block mt-0.5">
                          {order.sampleTrackingCode}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Milestones Tracker */}
                  <div className="py-4">
                    <span className="text-[10px] font-headline uppercase font-bold text-gray-500 block mb-2">
                      Fulfillment Stages
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-headline font-bold">
                      <div className="p-2 bg-[#9EFC5F]/40 border-2 border-[#0F534A] text-[#0F534A]">
                        1. Confirmed ✓
                      </div>
                      <div className={`p-2 border-2 ${
                        order.status === "SAMPLE_DISPATCHED" || order.status === "IN_PROGRESS" || order.status === "IN_EXECUTION" || order.status === "COMPLETED" || order.status === "DELIVERABLE_SUBMITTED" || order.status === "ESCROW_RELEASED"
                          ? "bg-[#9EFC5F]/40 border-[#0F534A] text-[#0F534A]"
                          : "bg-white border-gray-300 text-gray-400"
                      }`}>
                        2. Specimen In Transit ✓
                      </div>
                      <div className={`p-2 border-2 ${
                        order.status === "IN_PROGRESS" || order.status === "IN_EXECUTION" || order.status === "COMPLETED" || order.status === "DELIVERABLE_SUBMITTED" || order.status === "ESCROW_RELEASED"
                          ? "bg-[#9EFC5F]/40 border-[#0F534A] text-[#0F534A]"
                          : "bg-white border-gray-300 text-gray-400"
                      }`}>
                        3. Facility Analysis ✓
                      </div>
                      <div className={`p-2 border-2 ${
                        order.status === "COMPLETED" || order.status === "ESCROW_RELEASED" || order.status === "DELIVERABLE_SUBMITTED"
                          ? "bg-[#9EFC5F] border-[#0F534A] text-[#0F534A]"
                          : "bg-white border-gray-300 text-gray-400"
                      }`}>
                        4. Delivered & Completed ✓
                      </div>
                    </div>
                  </div>

                  {/* Deliverable File / Review Action */}
                  {order.deliverableFile && (
                    <div className="p-3 bg-[#FFF9F2] border-2 border-[#121316] flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#0F534A] shrink-0" />
                        <div>
                          <p className="text-xs font-headline font-bold text-[#121316]">
                            {order.deliverableFile}
                          </p>
                          <p className="text-[10px] font-body text-gray-500">
                            Certified Analytical Spectrum / Telemetry Report Available
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => toast.success(`Downloading ${order.deliverableFile}...`)}
                        className="px-3 py-1.5 bg-white hover:bg-[#FE4E1A] hover:text-white border-2 border-[#121316] font-headline font-bold text-xs uppercase flex items-center gap-1.5 transition-colors shadow-[2px_2px_0px_#121316] cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Report
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ShipmentTrackingModal
        orderNumberOrId={trackingOrderNumber}
        isOpen={!!trackingOrderNumber}
        onClose={() => setTrackingOrderNumber(null)}
      />
    </div>
  );
};
