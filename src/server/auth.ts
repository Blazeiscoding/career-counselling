import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/server/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;
        const normalizedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();

        const user = await db.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.password) {
          console.warn("Auth: user not found or no password set for", normalizedEmail);
          return null;
        }

        // If password in DB is not a bcrypt hash, migrate it by hashing now
        // Typical bcrypt hashes start with "$2" (e.g., $2a$, $2b$)
        let dbPasswordHash = user.password;
        const looksHashed = dbPasswordHash.startsWith("$2");
        if (!looksHashed) {
          try {
            const migratedHash = await bcrypt.hash(dbPasswordHash, 10);
            await db.user.update({
              where: { id: user.id },
              data: { password: migratedHash },
            });
            dbPasswordHash = migratedHash;
            console.warn("Auth: migrated plain-text password to bcrypt hash for", normalizedEmail);
          } catch (e) {
            console.error("Auth: failed migrating password for", normalizedEmail, e);
            return null;
          }
        }

        const passwordsMatch = await bcrypt.compare(
          trimmedPassword,
          dbPasswordHash
        );

        if (passwordsMatch) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        }

        console.warn(
          "Auth: password mismatch for",
          normalizedEmail,
          "hashPrefix:", dbPasswordHash.slice(0, 4),
          "hashLen:", dbPasswordHash.length
        );
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
};

export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
