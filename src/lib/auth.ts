import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { verify } from "jsonwebtoken";
import { z } from "zod";

const csogoSsoPayloadSchema = z.object({
  email: z.string().email(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  username: z.string().optional(),
});

function getAdminDisplayName(payload: z.infer<typeof csogoSsoPayloadSchema>): string {
  const fullName = [payload.firstname, payload.lastname]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) return fullName;
  if (payload.username) return payload.username;
  return payload.email.split("@")[0];
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const admin = await prisma.admin.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!admin) {
          return null;
        }

        // Check if admin is invited but hasn't set up password yet
        if (!admin.password) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, admin.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        };
      },
    }),
    CredentialsProvider({
      id: "admin-sso",
      name: "Admin SSO",
      credentials: {
        ssoToken: { label: "SSO Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.ssoToken) {
          return null;
        }

        const wpSharedSecret = process.env.CSOGO_SSO_SHARED_SECRET;
        if (!wpSharedSecret) {
          return null;
        }

        try {
          const decoded = verify(credentials.ssoToken, wpSharedSecret, {
            algorithms: ["HS256"],
          }) as Record<string, unknown>;
          const payload = csogoSsoPayloadSchema.parse(decoded);

          const provider = "csogo-wordpress";
          const subject = payload.username || payload.email;
          const now = new Date();
          const fallbackName = getAdminDisplayName(payload);

          const existingByProvider = await prisma.admin.findFirst({
            where: {
              ssoProvider: provider,
              ssoSubject: subject,
            },
          });

          let admin = existingByProvider;

          if (!admin) {
            const existingByEmail = await prisma.admin.findUnique({
              where: { email: payload.email },
            });

            // Admin policy: do not auto-create admin users from SSO.
            if (!existingByEmail) {
              return null;
            }

            admin = await prisma.admin.update({
              where: { id: existingByEmail.id },
              data: {
                name: existingByEmail.name || fallbackName,
                ssoProvider: provider,
                ssoSubject: subject,
                ssoLinkedAt: existingByEmail.ssoLinkedAt ?? now,
                ssoLastLoginAt: now,
              },
            });
          } else {
            admin = await prisma.admin.update({
              where: { id: admin.id },
              data: {
                name: admin.name || fallbackName,
                ssoLastLoginAt: now,
              },
            });
          }

          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
        },
      };
    },
    jwt: ({ token, user }) => {
      if (user) {
        return {
          ...token,
          id: user.id,
        };
      }
      return token;
    },
  },
}; 