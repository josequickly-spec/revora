import {
  createCipheriv, createDecipheriv, createHmac, randomBytes, scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);
const encoder = new TextEncoder();

function base64url(value: Uint8Array | string) {
  return Buffer.from(value).toString("base64url");
}

function requiredSecret(name: "AUTH_JWT_SECRET" | "AUTH_ENCRYPTION_KEY") {
  const value = process.env[name];
  if (!value || value.length < 32) throw new Error(`${name} must contain at least 32 characters.`);
  return value;
}

export function sha256(value: string) {
  return createHmac("sha256", "revora-one-way-v1").update(value).digest("hex");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt-v1.${base64url(salt)}.${base64url(derived)}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [version,saltRaw,hashRaw] = encoded.split(".");
  if (version !== "scrypt-v1" || !saltRaw || !hashRaw) return false;
  const expected = Buffer.from(hashRaw, "base64url");
  const actual = await scrypt(password, Buffer.from(saltRaw, "base64url"), expected.length) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual,expected);
}

export type AccessClaims = {
  sub: string;
  org: string;
  sid: string;
  type: "access" | "oauth_state";
  exp: number;
  iat: number;
  nonce?: string;
  redirect?: string;
};

export function signJwt(input: Omit<AccessClaims,"iat"|"exp">, lifetimeSeconds = 900) {
  const now = Math.floor(Date.now()/1000);
  const header = base64url(JSON.stringify({alg:"HS256",typ:"JWT"}));
  const payload = base64url(JSON.stringify({...input,iat:now,exp:now+lifetimeSeconds}));
  const signature = createHmac("sha256",requiredSecret("AUTH_JWT_SECRET")).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export function verifyJwt(token: string, expectedType: AccessClaims["type"] = "access") {
  const [header,payload,signature] = token.split(".");
  if (!header || !payload || !signature) throw new Error("Invalid token.");
  const expected = createHmac("sha256",requiredSecret("AUTH_JWT_SECRET")).update(`${header}.${payload}`).digest();
  const supplied = Buffer.from(signature,"base64url");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied,expected)) throw new Error("Invalid token.");
  const claims = JSON.parse(Buffer.from(payload,"base64url").toString("utf8")) as AccessClaims;
  if (claims.type !== expectedType || claims.exp <= Math.floor(Date.now()/1000)) throw new Error("Expired or invalid token.");
  return claims;
}

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

function encryptionKey() {
  return createHmac("sha256",requiredSecret("AUTH_ENCRYPTION_KEY")).update("revora-mfa-v1").digest();
}

export function encryptSecret(plaintext: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm",encryptionKey(),iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext,"utf8"),cipher.final()]);
  return `${base64url(iv)}.${base64url(ciphertext)}.${base64url(cipher.getAuthTag())}`;
}

export function decryptSecret(encoded: string) {
  const [iv,ciphertext,tag] = encoded.split(".");
  const decipher = createDecipheriv("aes-256-gcm",encryptionKey(),Buffer.from(iv,"base64url"));
  decipher.setAuthTag(Buffer.from(tag,"base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext,"base64url")),decipher.final()]).toString("utf8");
}

export function createTotpSecret() {
  const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes=randomBytes(20);
  let bits="",output="";
  for(const byte of bytes)bits+=byte.toString(2).padStart(8,"0");
  for(let index=0;index<bits.length;index+=5)output+=alphabet[Number.parseInt(bits.slice(index,index+5).padEnd(5,"0"),2)];
  return output;
}

function decodeBase32(value:string) {
  const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits="";
  for(const character of value.replace(/=+$/,"").toUpperCase()){
    const index=alphabet.indexOf(character);
    if(index<0)throw new Error("Invalid base32 secret.");
    bits+=index.toString(2).padStart(5,"0");
  }
  const bytes:number[]=[];
  for(let index=0;index+8<=bits.length;index+=8)bytes.push(Number.parseInt(bits.slice(index,index+8),2));
  return Buffer.from(bytes);
}

export function totp(secret: string, at = Date.now()) {
  const counter = Math.floor(at/30_000);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1",decodeBase32(secret)).update(buffer).digest();
  const offset = digest[digest.length-1]&15;
  const code = (digest.readUInt32BE(offset)&0x7fffffff)%1_000_000;
  return code.toString().padStart(6,"0");
}

export function verifyTotp(secret: string, code: string, at = Date.now()) {
  return [-1,0,1].some(step => {
    const expected = Buffer.from(totp(secret,at+step*30_000));
    const actual = Buffer.from(code);
    return expected.length === actual.length && timingSafeEqual(expected,actual);
  });
}

export function requestFingerprint(request: Request) {
  const userAgent = request.headers.get("user-agent") || "";
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  return {userAgentHash:sha256(userAgent),ipHash:sha256(forwarded)};
}
