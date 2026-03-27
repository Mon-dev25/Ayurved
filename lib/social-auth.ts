import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";

import { supabase } from "@/lib/supabase.web";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

export async function signInWithProvider(
  provider: "google" | "facebook" | "twitter",
) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    throw error ?? new Error("No OAuth URL returned");
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success" || !result.url) {
    return null;
  }

  const { params, errorCode } = QueryParams.getQueryParams(result.url);

  if (errorCode) {
    throw new Error(errorCode);
  }

  const { access_token, refresh_token } = params;

  if (!access_token || !refresh_token) {
    return null;
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

  if (sessionError) {
    throw sessionError;
  }

  return sessionData.session;
}
