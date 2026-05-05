import { prisma } from "./prisma";

/** Fetch a single setting value, with a fallback default. */
export async function getSetting(key: string, defaultValue = ""): Promise<string> {
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    return row?.value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/** Upsert a setting value. */
export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
