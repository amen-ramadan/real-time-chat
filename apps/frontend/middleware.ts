// ✅ بمجرد تسميته middleware.ts، Next.js رح يشتغل عليه تلقائيًا
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // const isLoggedIn = request.cookies.get('token')?.value;
  // if (!isLoggedIn) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  // return NextResponse.next();
}

// 👇 نحدد أي مسارات بده يشتغل عليها الحارس
export const config = {
  // matcher: ['/'],
};
