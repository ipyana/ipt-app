import { Client } from "minio";
import { prisma } from "@/lib/db";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";

const DEFAULT_BUCKET = "ipt-uploads";

export interface StorageConfig {
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

async function loadStorageConfig(): Promise<StorageConfig | null> {
  const keys = ["minio_endpoint", "minio_port", "minio_secure", "minio_access_key", "minio_secret_key", "minio_bucket"];
  const settings = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const endpoint = map["minio_endpoint"] || process.env.MINIO_ENDPOINT || "";
  const accessKey = map["minio_access_key"] || process.env.MINIO_ACCESS_KEY || "";
  const secretKey = map["minio_secret_key"] || process.env.MINIO_SECRET_KEY || "";
  if (!endpoint || !accessKey || !secretKey) return null;

  const rawPort = map["minio_port"] || process.env.MINIO_PORT || "9000";
  const port = parseInt(rawPort, 10) || 9000;
  const useSSL = (map["minio_secure"] || process.env.MINIO_USE_SSL || "false") === "true";

  return {
    endpoint,
    port,
    useSSL,
    accessKey,
    secretKey,
    bucket: map["minio_bucket"] || process.env.MINIO_BUCKET || DEFAULT_BUCKET,
  };
}

async function getClient(): Promise<{ client: Client; bucket: string; config: StorageConfig } | null> {
  const config = await loadStorageConfig();
  if (!config) return null;
  const client = new Client({
    endPoint: config.endpoint,
    port: config.port,
    useSSL: config.useSSL,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
  });
  return { client, bucket: config.bucket, config };
}

export async function uploadAnnouncementFile(
  file: File,
  folder = "announcements"
): Promise<{ url: string; name: string }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;

  const conn = await getClient();
  if (conn) {
    const { client, bucket } = conn;
    const bucketExists = await client.bucketExists(bucket);
    if (!bucketExists) await client.makeBucket(bucket);
    await client.putObject(bucket, filename, bytes, bytes.length, {
      "Content-Type": file.type || "application/octet-stream",
    });
    return { url: `/api/files?key=${encodeURIComponent(filename)}`, name: safeName };
  }

  const uploadDir = path.join(process.cwd(), "uploads", folder);
  await mkdir(uploadDir, { recursive: true });
  const filepath = path.join(uploadDir, path.basename(filename));
  await writeFile(filepath, bytes);
  return { url: `/uploads/${filename}`, name: safeName };
}

export async function readStoredFile(key: string): Promise<{ data: Buffer; contentType: string } | null> {
  const conn = await getClient();
  if (conn) {
    const { client, bucket } = conn;
    try {
      const stream = await client.getObject(bucket, key);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk as Buffer);
      const stat = await client.statObject(bucket, key);
      return { data: Buffer.concat(chunks), contentType: stat.metaData?.["content-type"] || "application/octet-stream" };
    } catch {
      return null;
    }
  }

  try {
    const filepath = path.join(process.cwd(), "uploads", key.replace(/^\/?/, ""));
    const data = await readFile(filepath);
    return { data, contentType: "application/octet-stream" };
  } catch {
    return null;
  }
}

export async function deleteStoredFile(key: string): Promise<void> {
  const conn = await getClient();
  if (conn) {
    try {
      await conn.client.removeObject(conn.bucket, key);
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    const filepath = path.join(process.cwd(), "uploads", key.replace(/^\/?/, ""));
    const { rm } = await import("fs/promises");
    await rm(filepath, { force: true });
  } catch {
    /* ignore */
  }
}

export async function testStorageConnection(): Promise<{ success: boolean; message: string }> {
  const config = await loadStorageConfig();
  if (!config) {
    return { success: false, message: "MinIO storage not configured" };
  }
  try {
    const client = new Client({
      endPoint: config.endpoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
    const exists = await client.bucketExists(config.bucket);
    if (!exists) {
      await client.makeBucket(config.bucket);
      return { success: true, message: `Connected. Bucket "${config.bucket}" created.` };
    }
    return { success: true, message: `Connected to MinIO (${config.endpoint}:${config.port}). Bucket "${config.bucket}" exists.` };
  } catch (e: any) {
    return { success: false, message: e.message || "Connection failed" };
  }
}
