import { jwtVerify, SignJWT } from "jose";

/** Sesión del admin firmada con JWT. Este archivo no usa APIs de Node: corre también en el proxy. */
export const SESSION_COOKIE = "oc_admin";

export type AdminSession = { sub: string; email: string; name: string };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) throw new Error("AUTH_SECRET falta o es muy corta (mínimo 16 caracteres)");
  return new TextEncoder().encode(value);
}

export async function signSession(payload: AdminSession, days: number) {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secret());
}

export async function verifySession(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return { sub: payload.sub!, email: String(payload.email), name: String(payload.name) };
  } catch {
    return null;
  }
}
