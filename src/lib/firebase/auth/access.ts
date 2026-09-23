import type { AccountStatus } from "@/types/firestore";

export function isServiceAccountActive(accountStatus: AccountStatus) {
  return accountStatus === "active";
}
