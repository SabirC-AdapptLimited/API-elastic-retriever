import { accessSync } from "fs";

export default function checkFileExists(filePath: string): boolean {
  try {
    accessSync(filePath);
    return true; // File exists
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      return false; // File does not exist
    }
    throw err; // Other error occurred
  }
}
