// Supabase Database Webhook: mm_push_events INSERT -> this function.
// Required secrets: MAOMAO_PUSH_WEBHOOK_SECRET, APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY.
const projectURL = Deno.env.get('SUPABASE_URL') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const webhookSecret = Deno.env.get('MAOMAO_PUSH_WEBHOOK_SECRET') ?? '';
const keyID = Deno.env.get('APNS_KEY_ID') ?? '';
const teamID = Deno.env.get('APNS_TEAM_ID') ?? '';
const privateKey = Deno.env.get('APNS_PRIVATE_KEY') ?? '';

type PushEvent = {
  id: number;
  recipient_id: string;
  group_id: string;
  entry_id: string | null;
  kind: 'entry' | 'comment' | 'rsvp';
  title: string;
  body: string;
  sent_at: string | null;
};
type Device = { user_id: string; token: string; environment: 'production' | 'sandbox' };

function encode(value: Uint8Array | string): string {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function apnsJWT(): Promise<string> {
  const der = Uint8Array.from(atob(privateKey.replace(/-----[^-]+-----|\s/g, '')), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = encode(JSON.stringify({ alg: 'ES256', kid: keyID }));
  const body = encode(JSON.stringify({ iss: teamID, iat: Math.floor(Date.now() / 1000) }));
  const input = `${head}.${body}`;
  const signature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(input)));
  return `${input}.${encode(signature)}`;
}

async function database(path: string, method = 'GET', body?: unknown): Promise<Response> {
  return await fetch(`${projectURL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      'content-type': 'application/json',
      prefer: 'return=minimal',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

Deno.serve(async request => {
  if (request.method !== 'POST' || !webhookSecret || request.headers.get('x-maomao-webhook') !== webhookSecret) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (![projectURL, serviceKey, keyID, teamID, privateKey].every(Boolean)) {
    return new Response('Push service is not configured', { status: 503 });
  }
  let id: number;
  try {
    const payload = await request.json();
    id = Number(payload?.record?.id);
    if (!Number.isSafeInteger(id) || id < 1) throw Error('Invalid event');
  } catch {
    return new Response('Invalid event', { status: 400 });
  }

  const eventResponse = await database(`mm_push_events?select=*&id=eq.${id}&limit=1`);
  if (!eventResponse.ok) return new Response('Could not load event', { status: 500 });
  const [event] = await eventResponse.json() as PushEvent[];
  if (!event || event.sent_at) return new Response('Already handled');

  const devicesResponse = await database(`mm_device_tokens?select=user_id,token,environment&user_id=eq.${event.recipient_id}`);
  if (!devicesResponse.ok) return new Response('Could not load devices', { status: 500 });
  const devices = await devicesResponse.json() as Device[];
  if (!devices.length) return new Response('No registered device');

  const jwt = await apnsJWT();
  let delivered = 0;
  for (const device of devices) {
    const host = device.environment === 'sandbox' ? 'api.sandbox.push.apple.com' : 'api.push.apple.com';
    const result = await fetch(`https://${host}/3/device/${device.token}`, {
      method: 'POST',
      headers: {
        authorization: `bearer ${jwt}`,
        'apns-topic': 'com.duan020915.maomao',
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        aps: { alert: { title: event.title, body: event.body }, sound: 'default' },
        group_id: event.group_id,
        entry_id: event.entry_id,
        kind: event.kind,
      }),
    });
    if (result.ok) delivered++;
    else if (result.status === 410) {
      await database(`mm_device_tokens?user_id=eq.${device.user_id}&token=eq.${device.token}`, 'DELETE');
    } else {
      console.error('APNs delivery failed', result.status, (await result.text()).slice(0, 180));
    }
  }
  if (delivered) {
    await database(`mm_push_events?id=eq.${event.id}`, 'PATCH', { sent_at: new Date().toISOString() });
  }
  return Response.json({ delivered });
});
