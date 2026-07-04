import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin?: boolean;
    };
    backendToken?: string;
    isAdmin?: boolean;
  }
  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    backendToken?: string;
    isAdmin?: boolean;
  }
}
declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    backendToken?: string;
    accessToken?: string;
    picture?: string;
    isAdmin?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: { prompt: 'select_account' },
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:        { label: 'Email',    type: 'email' },
        password:     { label: 'Password', type: 'password' },
        userId:       { label: 'User ID',  type: 'text' },
        userName:     { label: 'User Name',type: 'text' },
        backendToken: { label: 'Backend Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await fetch(`${process.env.BACKEND_URL}/api/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email:    credentials.email,
              password: credentials.password,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            console.error('LOGIN FAILED:', data);
            return null;
          }
          return {
            id:           data.user.id,
            email:        data.user.email,
            name:         data.user.name,
            backendToken: data.token,
            isAdmin:      data.user.role === 1,
          };
        } catch (err) {
          console.error('Login error:', err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // ── Google sign-in ──────────────────────────────────────────────────
      if (account?.provider === 'google' && user) {
        const googleEmail = user.email;
        const googleName  = user.name;
        const googleImage = user.image;

        try {
          const res = await fetch(`${process.env.BACKEND_URL}/api/user/google-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email:               user.email,
              name:                user.name,
              google_id:           account.providerAccountId,
              image:               user.image ?? null,
              google_id_token:     account.id_token ?? null,
              google_access_token: account.access_token ?? null,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            token.userId      = data.user.id;
            token.email       = data.user.email       ?? googleEmail;
            token.name        = data.user.name        ?? googleName;
            token.picture     = data.user.profile_image ?? googleImage ?? null;
            token.backendToken = data.token;
            token.isAdmin     = data.user.role === 1;
          } else {
            console.error('Google login backend error:', res.status);
            token.userId      = account.providerAccountId;
            token.email       = googleEmail ?? undefined;
            token.name        = googleName  ?? undefined;
            token.picture     = googleImage ?? undefined;
            token.backendToken = '';
            token.isAdmin     = false;
          }
        } catch (err) {
          console.error('Google auth fetch error:', err);
          token.userId      = account.providerAccountId;
          token.email       = googleEmail ?? undefined;
          token.name        = googleName  ?? undefined;
          token.picture     = googleImage ?? undefined;
          token.backendToken = '';
          token.isAdmin     = false;
        }
      }

      // ── Credentials sign-in ─────────────────────────────────────────────
      if (account?.provider === 'credentials' && user) {
        token.userId      = user.id;
        token.email       = user.email    ?? undefined;
        token.name        = user.name     ?? undefined;
        token.backendToken = user.backendToken || '';
        token.isAdmin     = user.isAdmin  ?? false;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id      = token.userId || token.sub || '';
        session.user.email   = (token.email  as string) ?? session.user.email  ?? '';
        session.user.name    = (token.name   as string) ?? session.user.name   ?? '';
        session.user.image   = (token.picture as string) ?? session.user.image ?? null;
        session.user.isAdmin = token.isAdmin ?? false;
      }
      session.backendToken = token.backendToken;
      session.isAdmin      = token.isAdmin ?? false;
      return session;
    },
  },

  events: {
    async signOut({ token }) {
      try {
        await fetch(`${process.env.BACKEND_URL}/api/user/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token.backendToken}` },
        });
      } catch (err) {
        console.error('Backend logout error:', err);
      }
    },
  },

  pages: { signIn: '/login', signOut: '/', error: '/login' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
};
