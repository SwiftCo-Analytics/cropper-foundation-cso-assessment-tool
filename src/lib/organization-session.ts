import { sign } from "jsonwebtoken";

export function signOrganizationToken(orgId: string): string {
  return sign({ orgId }, process.env.NEXTAUTH_SECRET!, { expiresIn: "7d" });
}
