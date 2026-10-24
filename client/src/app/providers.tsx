import React, { useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { LoaderProvider } from "../context/LoaderContext";
import { AuthProvider } from "../context/AuthContext";
import { RazorpayCheckoutModal, type RazorpayCheckoutOptions } from "../components/common/RazorpayCheckoutModal";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // Global Razorpay Checkout Modal Host
  const [razorpayOptions, setRazorpayOptions] = useState<RazorpayCheckoutOptions | null>(null);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleOpenRazorpay = (e: Event) => {
      const customEvent = e as CustomEvent<RazorpayCheckoutOptions>;
      if (customEvent.detail) {
        setRazorpayOptions(customEvent.detail);
        setIsRazorpayModalOpen(true);
      }
    };

    window.addEventListener("OPEN_RAZORPAY_CHECKOUT", handleOpenRazorpay);
    return () => {
      window.removeEventListener("OPEN_RAZORPAY_CHECKOUT", handleOpenRazorpay);
    };
  }, []);

  const handleCloseRazorpay = () => {
    setIsRazorpayModalOpen(false);
    setRazorpayOptions(null);
  };

  return (
    <Router>
      <LoaderProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: "#ffffff",
                color: "#121316",
                border: "3px solid #121316",
                boxShadow: "4px 4px 0px #121316",
                borderRadius: "0px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: "12px",
                padding: "12px 16px",
              },
              success: {
                iconTheme: {
                  primary: "#0F534A",
                  secondary: "#ffffff",
                },
                style: {
                  borderLeft: "6px solid #0F534A",
                },
              },
              error: {
                iconTheme: {
                  primary: "#FE4E1A",
                  secondary: "#ffffff",
                },
                style: {
                  borderLeft: "6px solid #FE4E1A",
                },
              },
            }}
            containerStyle={{
              top: 40,
              right: 20,
            }}
          />
          {children}

          {/* Global Interactive Razorpay Checkout Interface */}
          <RazorpayCheckoutModal
            isOpen={isRazorpayModalOpen}
            options={razorpayOptions}
            onClose={handleCloseRazorpay}
          />
        </AuthProvider>
      </LoaderProvider>
    </Router>
  );
}
