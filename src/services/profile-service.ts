import type { ShippingAddress, UserProfile } from "@/types/domain";
import { readLocal, writeLocal } from "./local-storage";

const profileKey = "shopsphere-profiles";
const addressKey = "shopsphere-addresses";
export function readProfile(userId: string, fallback: UserProfile): UserProfile { return readLocal<Record<string, UserProfile>>(profileKey, {})[userId] ?? fallback; }
export function saveProfile(userId: string, profile: UserProfile): void { const profiles = readLocal<Record<string, UserProfile>>(profileKey, {}); writeLocal(profileKey, { ...profiles, [userId]: profile }); }
export function readAddresses(userId: string): ShippingAddress[] { return readLocal<Record<string, ShippingAddress[]>>(addressKey, {})[userId] ?? []; }
export function saveAddresses(userId: string, addresses: ShippingAddress[]): void { const all = readLocal<Record<string, ShippingAddress[]>>(addressKey, {}); writeLocal(addressKey, { ...all, [userId]: addresses }); }
export function validateProfile(profile: UserProfile): string | null { return profile.name.trim() && profile.email.includes("@") ? null : "Enter a name and valid email."; }
export function validateAddress(address: ShippingAddress): string | null { return address.fullName.trim() && address.line1.trim() && address.city.trim() && address.state.trim() && address.postalCode.trim() && address.country.trim() ? null : "Complete all required address fields."; }
