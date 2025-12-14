interface ApiResponse<T = Record<string, any>> {
  status: "success" | "failed";
  message?: string;
  data?: T;
}
