import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createStaffRoute } from "@/lib/staffRoutes";

const { GET, POST, PUT, DELETE } = createStaffRoute(requireAdmin, requireAdmin);

export { GET, POST, PUT, DELETE };
