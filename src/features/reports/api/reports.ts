import { http } from "@/services/api/http";

export type CreateReportInput = {
  targetType: "user" | "post" | "comment" | "chat" | "inquiry";
  targetId: string;
  targetLabel?: string;
  reasonCode: string;
  detail: string;
};

export type CreateSupportInquiryInput = {
  email: string;
  title: string;
  reasonCode: string;
  detail: string;
};

export async function createReport(input: CreateReportInput) {
  const response = await http.post("/api/reports", input);
  return response.data;
}

export async function createSupportInquiry(input: CreateSupportInquiryInput) {
  const response = await http.post("/api/reports/inquiries", input);
  return response.data;
}
