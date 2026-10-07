import { z } from "zod";

const serverConfigSchema = z.object({
  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(3000),
  HOST: z.string().default("127.0.0.1"),
  LOG_DIR: z.string().default("./server/logs"),
});

export type ServerConfig =
  z.infer<typeof serverConfigSchema>;

const config =
  serverConfigSchema.parse({
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    LOG_DIR: process.env.LOG_DIR,
  });

const {
  PORT,
  HOST,
  LOG_DIR,
} = config;

export {
  PORT,
  HOST,
  LOG_DIR,
};