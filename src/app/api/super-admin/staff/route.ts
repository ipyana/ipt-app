import { requireSuperAdmin } from "@/lib/auth";
import { createStaffRoute } from "@/lib/staffRoutes";

const { GET, POST, PUT, DELETE } = createStaffRoute(requireSuperAdmin, requireSuperAdmin);

export { GET, POST, PUT, DELETE };
