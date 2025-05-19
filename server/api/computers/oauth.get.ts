import {OAuth2Client} from 'google-auth-library';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const url = getRequestURL(event);
    const newUrl = new URL("netaddress://oauth/google/");
    newUrl.searchParams.set("state", query.state as string);
    const OauthClient = new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: url.origin + url.pathname,
    } as any);
    try{
        const {tokens} = await OauthClient.getToken(query.code as string);
        newUrl.searchParams.set("access_token", tokens.access_token!);
        newUrl.searchParams.set("refresh_token", tokens.refresh_token!);
        newUrl.searchParams.set("id_token", tokens.id_token!);
        newUrl.searchParams.set("expires_in", tokens.expiry_date!.toString());
        newUrl.searchParams.set("scope", tokens.scope!);
        newUrl.searchParams.set("token_type", tokens.token_type!);
    }catch (e) {
        newUrl.searchParams.set("error", "Error when get tokens." );
    }
    await sendRedirect(event, newUrl.href);
});