import { NextRequest } from "next/server";
import { requireAdmin, requireAdminOnly } from "@/lib/auth";
import { createStaffRoute } from "@/lib/staffRoutes";

const { GET, POST, PUT, DELETE } = createStaffRoute(requireAdmin, requireAdminOnly);

export { GET, POST, PUT, DELETE };
