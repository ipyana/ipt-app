export interface NavItem {
  label: string;
  href?: string;
  icon?: string;
  children?: NavItem[];
}

export const navMap: Record<string, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/student/dashboard", icon: "dashboard" },
    {
      label: "Application",
      icon: "clipboard",
      children: [
        { label: "Apply", href: "/student/apply" },
        { label: "Re-apply", href: "/student/reapply" },
        { label: "Transfer", href: "/student/transfer" },
        { label: "Status", href: "/student/status" },
      ],
    },
    { label: "Upload Report", href: "/student/report", icon: "upload" },
  ],
  admin: [
    { label: "Overview", href: "/admin/dashboard", icon: "dashboard" },
    {
      label: "Application",
      icon: "clipboard",
      children: [
        { label: "Allocations", href: "/admin/allocations" },
        { label: "Transfers", href: "/admin/transfers" },
        { label: "Re-applications", href: "/admin/reapplications" },
        { label: "Students", href: "/admin/students" },
      ],
    },
    {
      label: "Management",
      icon: "layers",
      children: [
        { label: "Clusters", href: "/admin/clusters" },
        { label: "Locations", href: "/admin/locations" },
        { label: "Departments", href: "/admin/departments" },
        { label: "Programs", href: "/admin/programs" },
        { label: "Groups & Venues", href: "/admin/groups" },
      ],
    },
    { label: "Facilitators", href: "/admin/staff", icon: "users" },
    { label: "Staff Transfers", href: "/admin/staff-transfers", icon: "move" },
    { label: "Export Data", href: "/admin/export", icon: "export" },
    {
      label: "System Config",
      icon: "settings",
      children: [
        { label: "Email Provider", href: "/admin/system-config/email-provider" },
        { label: "Email Templates", href: "/admin/system-config/email-templates" },
        { label: "Email Logs", href: "/admin/system-config/email-logs" },
        { label: "Announcements", href: "/admin/system-config/announcements" },
      ],
    },
  ],
  super_admin: [
    { label: "Overview", href: "/super-admin", icon: "dashboard" },
    { label: "Admins", href: "/super-admin/admins", icon: "shield" },
    {
      label: "Application",
      icon: "clipboard",
      children: [
        { label: "Allocations", href: "/admin/allocations" },
        { label: "Transfers", href: "/admin/transfers" },
        { label: "Re-applications", href: "/admin/reapplications" },
        { label: "Waitlist", href: "/super-admin/waitlist" },
        { label: "Students", href: "/admin/students" },
      ],
    },
    {
      label: "Management",
      icon: "layers",
      children: [
        { label: "Clusters", href: "/admin/clusters" },
        { label: "Locations", href: "/admin/locations" },
        { label: "Groups & Venues", href: "/admin/groups" },
      ],
    },
    { label: "Staff", href: "/super-admin/staff", icon: "users" },
    { label: "Staff Transfers", href: "/super-admin/staff-transfers", icon: "move" },
    {
      label: "System Config",
      icon: "settings",
      children: [
        { label: "IPT Session", href: "/super-admin/system-config/session" },
        { label: "Email Provider", href: "/super-admin/system-config/email-provider" },
        { label: "Email Templates", href: "/super-admin/system-config/email-templates" },
        { label: "Email Logs", href: "/super-admin/system-config/email-logs" },
        { label: "Announcements", href: "/super-admin/system-config/announcements" },
      ],
    },
  ],
  staff: [
    { label: "Dashboard", href: "/staff", icon: "dashboard" },
    { label: "Groups & Venues", href: "/staff/groups", icon: "layers" },
    { label: "Announcements", href: "/staff/announcements", icon: "megaphone" },
  ],
};
