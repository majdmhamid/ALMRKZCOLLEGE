import type { Metadata } from "next";
import GraduatesEditor from "./GraduatesEditor";

export const metadata: Metadata = { title: "الخريجون" };

export default function Page() {
  return <GraduatesEditor />;
}
