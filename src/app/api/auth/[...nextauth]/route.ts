import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

declare module 'next-auth' {
  interface Session {
    user: { id?: string; name?: string | null; email?: string | null; image?: string | null };
    backendToken?: string;
  }
  interface User { id: string; email: string; name: string; image?: string; backendToken?: string; }
}
declare module 'next-auth/jwt' {
  interface JWT { userId?: string; backendToken?: string; accessToken?: string; }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        userId: { label: 'User ID', type: 'text' },
        userName: { label: 'User Name', type: 'text' },
        backendToken: { label: 'Backend Token', type: 'text' },
      },
      async authorize(credentials) {
        if (credentials?.email && credentials?.password) {
          return {
            id: credentials.userId || credentials.email,
            email: credentials.email,
            name: credentials.userName || credentials.email.split('@')[0],
            backendToken: credentials.backendToken,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider === 'google' && user) {
        try {
          const res = await fetch(`${process.env.BACKEND_URL}/api/google-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email, name: user.name, googleId: user.id,
              image: user.image, googleIdToken: account?.id_token,
              googleAccessToken: account?.access_token,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            token.userId = data.id;
            token.backendToken = data.token;
          }
        } catch (err) { console.error('Google auth error:', err); }
      }
      if (account?.provider === 'credentials' && user) {
        token.userId = user.id;
        token.email = user.email ?? undefined;
        token.name = user.name;
        token.backendToken = user.backendToken;
      }
      if (account) token.accessToken = account.access_token;
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.userId || token.sub || '';
        session.user.email = token.email;
        session.user.name = token.name;
        session.backendToken = token.backendToken;
      }
      return session;
    },
  },
  pages: { signIn: '/login', signOut: '/', error: '/login' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
});

export { handler as GET, handler as POST };
