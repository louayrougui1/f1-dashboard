import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppErrorBoundaryProps {
  children: ReactNode;
  resetKey: string;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message ?? "Unexpected dashboard rendering failure.",
    };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // React already logs caught errors in dev. Keep fallback minimal and stable.
  }

  componentDidUpdate(prevProps: AppErrorBoundaryProps): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, message: "" });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="mx-auto max-w-[1560px]">
        <div className="rounded-lg border border-line bg-surface">
          <div
            role="alert"
            className="flex min-h-[14rem] flex-col items-center justify-center gap-3 px-4 py-6 text-center"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-error/30 bg-error/10">
              <AlertTriangle
                className="h-5 w-5 text-error"
                aria-hidden="true"
              />
            </span>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-error uppercase">
                Dashboard Render Error
              </p>
              <p className="mt-1 text-sm text-text/80">
                A section failed while switching data. The app did not crash.
              </p>
              {this.state.message ? (
                <p className="mt-0.5 text-xs text-muted">
                  {this.state.message}
                </p>
              ) : null}
            </div>
            <Button
              variant="outline"
              onClick={() => this.setState({ hasError: false, message: "" })}
              className="h-8 gap-2 border-line bg-surface-hover px-3.5 text-text hover:border-accent hover:bg-surface-hover hover:text-text"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
