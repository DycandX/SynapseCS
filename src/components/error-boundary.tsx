"use client";

import React, { Component } from "react";

export class ErrorBoundary extends Component<
  { fallback?: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-[200px] w-full p-6">
            <div className="text-center p-8 border border-destructive/20 bg-destructive/5 rounded-2xl max-w-md">
              <p className="text-destructive font-semibold text-lg">Something went wrong</p>
              <p className="text-muted-foreground mt-2 text-sm">Please try again or contact support.</p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground font-medium rounded-lg hover:bg-destructive/95 transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
