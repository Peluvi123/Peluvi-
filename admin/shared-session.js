import config from './app-config.js';

let clientPromise;
function getClient() {
  clientPromise ??= import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) =>
    createClient(config.url, config.key, { auth: { storageKey: 'peluvi-web-client' } }));
  return clientPromise;
}

export async function getAppSession() {
  const client = await getClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signOutApp() {
  const client = await getClient();
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw error;
}
