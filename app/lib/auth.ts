import { PrismaClient, PrismaClientExtends } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

const prisma = new PrismaClient();

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: prismaAdapter(prisma, {
    provider: "mongodb",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, //set to true for production
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    },
    user: {
      modelName: "user",
      additionalFields: {
        name: {
          type: "string",
          required: true,
        },
        // I will add any aditional fields you need
      },
    },
    hooks: {
      afterSignup: async (ctx:any) => {
        // create study profile for new user
        await prisma.studyProfile.create({
          data: {
            userId: ctx.user.id,
            studyFocus: [],
            streaks: 0,
            level: 1,
            exprience: 0,
          },
        });
        // Create welcome goal
        await prisma.goal.create({
          data: ctx.user.id,
          title: "Complete your first study session",
          description:
            "Start your learning journey by completing 30-minute study session",
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          progress: 0,
        });
        return ctx;
      },
    },
  },
});

export type Auth = typeof auth;