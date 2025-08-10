// src/hooks/useUserInfo.ts
import { useEffect, useState } from 'react';
import { authFetch as clientAuthFetch } from '../api/client'; // при необходимости поправь путь/экспорт

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface UserInfo {
    id: number | null;
    email: string | null;
    role: string | null;
}

function extractUserInfo(data: unknown): UserInfo {
    const d = (data ?? {}) as Record<string, unknown>;

    const rawId =
        d['id'] ??
        d['userId'] ??
        d['userID'] ??
        d['userIdClaim'] ??
        (d['claims'] as any)?.userID ??
        null;

    const rawEmail =
        d['email'] ??
        d['emailClaim'] ??
        d['Email'] ??
        (d['claims'] as any)?.email ??
        null;

    const rawRole =
        d['role'] ??
        d['roleClaim'] ??
        d['Role'] ??
        (d['claims'] as any)?.role ??
        (d['claims'] as any)?.Role ??
        null;

    const idNumber =
        typeof rawId === 'number'
            ? rawId
            : typeof rawId === 'string' && rawId.trim() !== '' && !Number.isNaN(Number(rawId))
                ? Number(rawId)
                : null;

    const email = typeof rawEmail === 'string' ? rawEmail : null;
    const role =
        rawRole !== null && rawRole !== undefined ? String(rawRole).trim() : null;

    return { id: idNumber, email, role };
}

export default function useUserInfo(): UserInfo | null {
    const [user, setUser] = useState<UserInfo | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const doFetch: FetchLike =
                    (clientAuthFetch as unknown as FetchLike) ?? (fetch as FetchLike);

                const useWindowFetch = !clientAuthFetch;

                const res = await doFetch('https://localhost:5132/api/auth/user_info', {
                    method: 'GET',
                    ...(useWindowFetch ? { credentials: 'include' as const } : {}),
                });

                if (!res.ok) throw new Error('Not authorized');

                const data = (await res.json()) as unknown;
                const info = extractUserInfo(data);

                if (!cancelled) setUser(info);
            } catch {
                if (!cancelled) setUser(null);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);
    return user;
}

