import crypto from "crypto";
import { prisma } from "@/lib/db";

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export async function generateOtp(email: string, purpose: string): Promise<string> {
  const code = crypto.randomInt(100000, 999999).toString();

  await prisma.otp.create({
    data: {
      email,
      code,
      purpose,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    },
  });

  return code;
}

export async function generateToken(email: string, purpose: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");

  await prisma.otp.create({
    data: {
      email,
      code: token,
      purpose,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
    },
  });

  return token;
}

export async function verifyToken(email: string, token: string, purpose: string): Promise<boolean> {
  const otp = await prisma.otp.findFirst({
    where: { email, purpose, code: token, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return false;

  await prisma.otp.update({
    where: { id: otp.id },
    data: { used: true },
  });

  return true;
}

export async function verifyOtp(email: string, code: string, purpose: string): Promise<boolean> {
  const otp = await prisma.otp.findFirst({
    where: { email, purpose, code, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return false;

  await prisma.otp.update({
    where: { id: otp.id },
    data: { used: true },
  });

  return true;
}
