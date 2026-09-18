import { cookies } from 'next/headers';
import { db } from '@/lib/server';
import { clearCookie, safeReturnTo } from '@/lib/oauth';
import { chatGPTSignOutPath, getChatGPTUser } from '@/app/chatgpt-auth';
export async function GET(req: Request) {
  const jar = await cookies();
  const token = jar.get('noble_session')?.value;
  if (token) await db().prepare('DELETE FROM auth_sessions WHERE token=?').bind(token).run();
  const to = safeReturnTo(new URL(req.url).searchParams.get('return_to'));
  if (!token && await getChatGPTUser()) return Response.redirect(new URL(chatGPTSignOutPath(to), req.url), 302);
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL(to, req.url).toString(),
      'Set-Cookie': clearCookie('noble_session'),
    },
  });
}
