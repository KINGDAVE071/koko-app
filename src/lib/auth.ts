import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email;
      if (!email) return false;
      try {
        const res = await fetch(
          `https://koko-api-o2dy.onrender.com/api/auth-check/exists?email=${encodeURIComponent(email)}`
        );
        const data = await res.json();
        if (!data.exists) {
          // Rediriger vers /register avec l'email pré-rempli
          return `/register?email=${encodeURIComponent(email)}&fromGoogle=true`;
        }
        return true;
      } catch (e) {
        return false;
      }
    },
  },
  pages: {
    signIn: '/login',
  },
});

export { handler as GET, handler as POST };
