import { HttpClientPort } from './http-client.port';
import { defaultHttpClient } from './axios-http-client.adapter';

export class DonationApiAdapter {
  constructor(private client: HttpClientPort = defaultHttpClient) {}

  async createOrder(payload: {
    amount: number;
    projectId: string;
    message?: string;
    anonymous?: boolean;
    email?: string;
    name?: string;
  }) {
    return this.client.post('/payments/create-order', payload);
  }

  async verifyPayment(payload: {
    orderId: string;
    paymentId: string;
    signature: string;
  }) {
    return this.client.post('/payments/verify', payload);
  }

  async getMyDonations() {
    return this.client.get('/donations/my');
  }

  async getDonationSummary() {
    return this.client.get('/donations/summary');
  }
}

export const donationApiAdapter = new DonationApiAdapter();
