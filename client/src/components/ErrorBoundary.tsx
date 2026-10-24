import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Trash2 } from "lucide-react";
import { clearApiCache } from "../services/api";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime error caught by DreamXec ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleClearAndReload = () => {
    try {
      clearApiCache();
      localStorage.removeItem("token");
    } catch (_) {}
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 font-sans selection:bg-[#FFDD33] selection:text-[#0F534A]">
          <div className="max-w-xl w-full bg-white border-4 border-[#0F534A] shadow-[8px_8px_0px_0px_#0F534A] p-6 sm:p-10 rounded-2xl relative overflow-hidden">
            {/* Header Badge */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#FE4E1A] border-2 border-[#0F534A] flex items-center justify-center text-white shadow-[3px_3px_0px_0px_#0F534A]">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <span className="font-brush text-[#FE4E1A] text-lg block -rotate-2">
                  Oops! Something went sideways
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-[#0F534A] uppercase tracking-tight leading-tight">
                  Application Error
                </h1>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-700 font-normal text-base leading-relaxed mb-6">
              DreamXec encountered an unexpected runtime issue. Don't worry, your progress and session data are secure. You can reload the page or return to the main dashboard.
            </p>

            {/* Collapsible Technical Details for Diagnostics */}
            {this.state.error && (
              <div className="mb-6 p-4 bg-[#F8F9FA] border-2 border-gray-200 rounded-xl overflow-x-auto text-xs font-mono text-gray-800">
                <p className="font-bold text-[#F4002C] mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <p className="text-gray-500 whitespace-pre-wrap max-h-32 overflow-y-auto mt-2">
                    {this.state.error.stack.split("\n").slice(0, 5).join("\n")}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#0F534A] hover:bg-[#13665b] text-white font-bold text-sm uppercase rounded-xl border-2 border-[#0F534A] shadow-[4px_4px_0px_0px_#FE4E1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#FFDD33] hover:bg-[#ffe359] text-[#0F534A] font-bold text-sm uppercase rounded-xl border-2 border-[#0F534A] shadow-[4px_4px_0px_0px_#0F534A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>

              <button
                onClick={this.handleClearAndReload}
                title="Reset local cache & restart"
                className="w-full sm:w-auto p-3 bg-white hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl border-2 border-[#0F534A] shadow-[4px_4px_0px_0px_#0F534A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 text-[#F4002C]" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
