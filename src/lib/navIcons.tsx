import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Upload,
  Users,
  BarChart3,
  Layers,
  Shield,
  Move,
  Settings,
  Mail,
  Megaphone,
  BookOpen,
} from "lucide-react";

export const NAV_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  clipboard: ClipboardList,
  file: FileText,
  upload: Upload,
  users: Users,
  chart: BarChart3,
  layers: Layers,
  shield: Shield,
  move: Move,
  settings: Settings,
  mail: Mail,
  megaphone: Megaphone,
  book: BookOpen,
  export: FileText,
};

export function navIcon(name?: string): React.ElementType {
  return NAV_ICONS[name || ""] || FileText;
}
