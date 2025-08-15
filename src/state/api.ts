import { Manager, Tenant } from "@/types/prismaTypes";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { createNewUserInDatabase } from "../../lib/utils";

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: async (headers) => {
      const session = await fetchAuthSession();
      const { idToken } = session.tokens ?? {};
      if (idToken) {
        headers.set("Authorization", `Bearer ${idToken}`);
      }
      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: [],
  endpoints: (build) => ({
    getAuthUser: build.query<User, void>({
      queryFn: async (_, _queryApi, _extraoptions, fetchWithBQ) => {
        try {
          console.log("Starting getAuthUser queryFn");

          const session = await fetchAuthSession();
          console.log("Fetched session:", session);

          const { idToken } = session.tokens ?? {};
          console.log("Extracted idToken:", idToken);

          const user = await getCurrentUser();
          console.log("Fetched current user:", user);

          const userRole = idToken?.payload["custom:role"] as string;
          console.log("Extracted userRole:", userRole);

          const endpoint =
            userRole === "manager"
              ? `/managers/${user.userId}`
              : `/tenants/${user.userId}`;
          console.log("Determined endpoint:", endpoint);

          let userDetailsResponse = await fetchWithBQ(endpoint);
          console.log("Fetched userDetailsResponse:", userDetailsResponse);

          if (
            userDetailsResponse.error &&
            userDetailsResponse.error.status === 404
          ) {
            console.log("User not found (404), creating new user...");
            userDetailsResponse = await createNewUserInDatabase(
              user,
              idToken,
              userRole,
              fetchWithBQ
            );
            console.log("Created userDetailsResponse:", userDetailsResponse);
          }

          const resultData = {
            cognitoInfo: { ...user },
            userInfo: userDetailsResponse.data as Tenant | Manager,
            userRole,
          };
          console.log("Final result data:", resultData);

          return {
            data: resultData,
          };
        } catch (error: any) {
          console.error("Error in getAuthUser:", error);
          return { error: error.message || "Could not fetch user data" };
        }
      },
    }),
  }),
});

export const { useGetAuthUserQuery } = api;
