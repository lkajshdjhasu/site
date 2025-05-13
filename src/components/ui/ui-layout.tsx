"use client";

import * as React from "react";
import { ReactNode, Suspense, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";

import { Header } from "./header";
import { Footer } from "./footer";

export function UiLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col min-h-screen">
        {/* Navbar */}
        <Header />

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <Footer />

        <Toaster position="bottom-right" />
      </div>
    </div>
  );
}

export function AppModal({
  children,
  hide,
  show,
  submit,
  submitDisabled,
  submitLabel,
  title,
}: {
  children: ReactNode;
  hide: () => void;
  show: boolean;
  submit?: () => void;
  submitDisabled?: boolean;
  submitLabel?: string;
  title: string;
}) {
  return (
    <dialog className={`modal ${show ? "modal-open" : ""}`}>
      <div className="modal-box bg-background">
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={hide}>
            Cancel
          </button>
          {submit && (
            <button
              className="btn btn-primary"
              disabled={submitDisabled}
              onClick={submit}
            >
              {submitLabel}
            </button>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={hide}>close</button>
      </form>
    </dialog>
  );
}

export function AppHero({
  children,
  title,
  subtitle,
}: {
  children?: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
}) {
  return (
    <div className="hero py-[64px]">
      <div className="hero-content text-center">
        <div className="max-w-2xl">
          {typeof title === "string" ? (
            <h1 className="text-5xl font-bold">{title}</h1>
          ) : (
            title
          )}
          {typeof subtitle === "string" ? (
            <p className="py-6">{subtitle}</p>
          ) : (
            subtitle
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function ellipsify(str = "", len = 4) {
  if (str.length > 30) {
    return (
      str.substring(0, len) + ".." + str.substring(str.length - len, str.length)
    );
  }
  return str;
}
