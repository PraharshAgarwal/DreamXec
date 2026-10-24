import api from "./api";

export interface SubscriptionResponse {
  subscriptionId: string;
}

export async function createSubscription(): Promise<SubscriptionResponse> {
  const res = await api("/subscription/create", { method: "POST" });
  return res.data as SubscriptionResponse;
}
