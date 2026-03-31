import { UAParser } from "ua-parser-js";

/** True when User-Agent is a mobile phone (not tablet). */
export function isMobilePhoneUserAgent(
  userAgent: string | null | undefined
): boolean {
  if (!userAgent) return false;
  const { device } = new UAParser(userAgent).getResult();
  return device.type === "mobile";
}
