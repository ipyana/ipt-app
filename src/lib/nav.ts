export interface NavItem {
  label: string;
  href?: string;
  children?: NavItem[];
}

export const navMap: Record<string, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/student/dashboard" },
    {
      label: "My Application",
      children: [
        { label: "Apply", href: "/student/apply" },
        { label: "Re-apply", href: "/student/reapply" },
        { label: "Transfer", href: "/student/transfer" },
      ],
    },
    { label: "Upload Report", href: "/student/report" },
  ],
  admin: [
    { label: "Overview", href: "/admin/dashboard" },
    { label: "Departments", href: "/admin/departments" },
    { label: "Programs", href: "/admin/programs" },
    { label: "Clusters", href: "/admin/clusters" },
    { label: "Allocations", href: "/admin/allocations" },
    { label: "Students", href: "/admin/students" },
    { label: "Facilitators", href: "/admin/staff" },
    { label: "Export Data", href: "/admin/export" },
    {
      label: "System Config",
      children: [
        { label: "Email Provider", href: "/admin/system-config/email-provider" },
        { label: "Email Templates", href: "/admin/system-config/email-templates" },
        { label: "Email Logs", href: "/admin/system-config/email-logs" },
        { label: "Announcements", href: "/admin/system-config/announcements" },
      ],
    },
  ],
  super_admin: [
    { label: "Overview", href: "/super-admin" },
    { label: "Admins", href: "/super-admin/admins" },
    { label: "Staff", href: "/super-admin/staff" },
    { label: "Waitlist", href: "/super-admin/waitlist" },
    { label: "Transfers", href: "/super-admin/transfers" },
    { label: "Allocations", href: "/admin/allocations" },
    { label: "Clusters", href: "/admin/clusters" },
    { label: "Students", href: "/admin/students" },
    {
      label: "System Config",
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
    { label: "Dashboard", href: "/staff" },
    { label: "Announcements", href: "/staff/announcements" },
  ],
};
