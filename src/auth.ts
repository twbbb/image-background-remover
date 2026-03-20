import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  // 使用 JWT 策略，不需要数据库
  session: {
    strategy: "jwt",
  },
  pages: {
    // 可选：自定义登录页面，暂时使用默认
    // signIn: "/login",
  },
})