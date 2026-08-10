import { prisma } from "@/lib/db";

export type WindowType = "application" | "transfer" | "reapplication";

export const WINDOW_TYPES: WindowType[] = ["application", "transfer", "reapplication"];

export interface WindowStatus {
  type: WindowType;
  enabled: boolean;
  open: boolean;
  startAt: Date | null;
  endAt: Date | null;
  message: string;
}

const WINDOW_MESSAGES: Record<WindowType, string> = {
  application: "The Application Window is closed. Check with your IPT Coordinator.",
  transfer: "The Transfer Window is closed. Check with your IPT Coordinator.",
  reapplication: "The Reapplication Window is closed. Check with your IPT Coordinator.",
};

export function windowMessage(type: WindowType): string {
  return WINDOW_MESSAGES[type] || "This window is closed. Check with your IPT Coordinator.";
}

/**
 * A window is open only when it is enabled AND the current time is within
 * [startAt, endAt]. When disabled, the window is closed.
 */
export async function getWindowStatus(type: WindowType): Promise<WindowStatus> {
  const config = await prisma.windowConfig.findUnique({ where: { type } });
  if (!config || !config.enabled) {
    return {
      type,
      enabled: !!config?.enabled,
      open: false,
      startAt: config?.startAt ?? null,
      endAt: config?.endAt ?? null,
      message: windowMessage(type),
    };
  }

  const now = Date.now();
  const start = config.startAt ? new Date(config.startAt).getTime() : null;
  const end = config.endAt ? new Date(config.endAt).getTime() : null;
  const open = (start === null || now >= start) && (end === null || now <= end);

  return {
    type,
    enabled: true,
    open,
    startAt: config.startAt,
    endAt: config.endAt,
    message: windowMessage(type),
  };
}

export async function isWindowOpen(type: WindowType): Promise<boolean> {
  return (await getWindowStatus(type)).open;
}

/** Upsert the default window rows so they always exist. */
export async function ensureWindowConfigs() {
  for (const type of WINDOW_TYPES) {
    await prisma.windowConfig.upsert({
      where: { type },
      update: {},
      create: { type, enabled: false },
    });
  }
}
