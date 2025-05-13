import BlinkForm from "@/sections/blink-form/blink-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your donation Blink a few seconds",
  description: "Create your donation Blink",
};

export default function Page() {
  return <BlinkForm />;
}
