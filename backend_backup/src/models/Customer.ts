import { prisma } from '../db';

const Customer = {
  async findOne({ phoneNumber }: { phoneNumber: string }) {
    return prisma.customer.findUnique({
      where: { phoneNumber },
      include: { wallets: true }
    });
  },

  async create(data: { 
    phoneNumber: string;
    verificationCode?: string;
    verified?: boolean;
  }) {
    return prisma.customer.create({
      data: {
        phoneNumber: data.phoneNumber,
        verificationCode: data.verificationCode,
        verified: data.verified || false
      }
    });
  },

  async save(customer: { 
    id: string;
    verificationCode?: string;
    verified: boolean;
  }) {
    return prisma.customer.update({
      where: { id: customer.id },
      data: {
        verificationCode: customer.verificationCode,
        verified: customer.verified
      }
    });
  }
};

export default Customer; 