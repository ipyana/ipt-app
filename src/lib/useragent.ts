export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
}

const BROWSERS: [RegExp, string][] = [
  [/Edg\/([\d.]+)/, "Microsoft Edge"],
  [/OPR\/([\d.]+)/, "Opera"],
  [/Chrome\/([\d.]+)/, "Google Chrome"],
  [/Safari\/([\d.]+)/, "Safari"],
  [/Firefox\/([\d.]+)/, "Firefox"],
  [/MSIE ([\d.]+)/, "Internet Explorer"],
  [/Trident.*rv:([\d.]+)/, "Internet Explorer"],
];

const OSES: [RegExp, string][] = [
  [/Windows NT 10\.0/, "Windows 10"],
  [/Windows NT 11\.0/, "Windows 11"],
  [/Windows NT 6\.3/, "Windows 8.1"],
  [/Windows NT 6\.1/, "Windows 7"],
  [/Android/, "Android"],
  [/iPhone/, "iOS (iPhone)"],
  [/iPad/, "iPadOS"],
  [/Mac OS X ([\d_]+)/, "macOS"],
  [/Linux/, "Linux"],
];

export function parseUserAgent(ua: string): DeviceInfo {
  const browserEntry = BROWSERS.find(([re]) => re.test(ua));
  const osEntry = OSES.find(([re]) => re.test(ua));

  let device = "Computer";
  if (/iPhone/.test(ua)) device = "iPhone";
  else if (/iPad/.test(ua)) device = "iPad";
  else if (/Android.*Mobile/.test(ua)) device = "Android Phone";
  else if (/Android/.test(ua)) device = "Android Tablet";
  else if (/Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua)) device = "Mac";
  else if (/Windows/.test(ua)) device = "Windows PC";
  else if (/Linux/.test(ua)) device = "Linux Device";

  return {
    browser: browserEntry ? browserEntry[1] : "Unknown Browser",
    os: osEntry ? osEntry[1].replace("$1", "") : "Unknown OS",
    device,
  };
}

export async function getGeo(ip: string): Promise<string> {
  const cleanIp = (ip || "").trim();
  if (!cleanIp || cleanIp === "::1" || cleanIp.startsWith("127.") || cleanIp.startsWith("192.168.") || cleanIp.startsWith("10.")) {
    return "Unknown location";
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,country,city,regionName`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json();
    if (data.status === "success") {
      const parts = [data.city, data.regionName, data.country].filter(Boolean);
      return parts.join(", ") || "Unknown location";
    }
    return "Unknown location";
  } catch {
    return "Unknown location";
  }
}
