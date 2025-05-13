"use client";

import { useState, useEffect } from "react";
import type { Blink } from "@prisma/client";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { CONFIG } from "@/constant/config";
import { Loader2 } from "lucide-react";

export default function DashboardFeature() {
  const [blinks, setBlinks] = useState<Blink[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/blinks")
        .then((res) => res.json())
        .then((data) => setBlinks(data))
        .catch((error) => console.error("Error loading data:", error))
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 m-10">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">Your Blinks</p>
      </div>

      <div className="space-y-4 mx-10">
        {blinks.length > 0 ? (
          <Table className="w-full">
            <TableCaption>A list of your blinks.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blinks.map((blink: Blink) => (
                <TableRow key={blink.id}>
                  <TableCell className="font-medium">{blink.title}</TableCell>
                  <TableCell>{blink.description}</TableCell>
                  <TableCell>{blink.label}</TableCell>
                  <TableCell>
                    <a
                      href={`${CONFIG.baseUrl}/api/actions/transfer-sol/${blink.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      {CONFIG.baseUrl}/api/actions/transfer-sol/{blink.id}
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p>There is no blink.</p>
        )}
      </div>
    </div>
  );
}
