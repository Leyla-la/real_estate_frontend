import { Manager, Property, Tenant } from "@/types/prismaTypes";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { cleanParams, createNewUserInDatabase } from "../lib/utils";
import { getProperties } from "aws-amplify/storage";
import { FiltersState } from ".";

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
  tagTypes: ["Managers", "Tenants", "Properties"],
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

    updateTenantSettings: build.mutation < Tenant, { cognitoId: string } &Partial<Tenant>>({
      query: ({cognitoId, ...updatedTenant }) => ({
        url: `/tenants/${cognitoId}`,
        method: "PUT",
        body: updatedTenant,
      }),
      invalidatesTags: (result) => [
        { type: "Tenants", id: result?.id },
      ],
    }),

    updateManagerSettings: build.mutation < Manager, { cognitoId: string } &Partial<Manager>>({
      query: ({cognitoId, ...updatedManager }) => ({
        url: `/managers/${cognitoId}`,
        method: "PUT",
        body: updatedManager,
      }),
      invalidatesTags: (result) => [
        { type: "Managers", id: result?.id },
      ],
    }),

    //property related endpoints
    getProperties: build.query<Property[], Partial<FiltersState> & { favoriteIds?: number[] }>({
      query: (filters) => {
        const params = cleanParams({
          location: filters.location,
          priceMin: filters.priceRange?.[0],
          priceMax: filters.priceRange?.[1],
          beds: filters.beds,
          baths: filters.baths,
          propertyType: filters.propertyType,
          squareFeetMin: filters.squareFeet?.[0],
          squareFeetMax: filters.squareFeet?.[1],
          amenities: filters.amenities?.join(","),
          availableFrom: filters.availableFrom,
          favoriteIds: filters.favoriteIds?.join(","),
          latitude: filters.coordinates?.[1],
          longitude: filters.coordinates?.[0],
        });

        return { url: "properties", params };

      },
      providesTags: (result) =>
        result 
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as const, id })),
              { type: "Properties", id: "LIST" }
          ]
          : [
            { type: "Properties", id: "LIST" }
          ],
      
    }),

  }),
});

export const { useGetAuthUserQuery, useUpdateTenantSettingsMutation, useUpdateManagerSettingsMutation, useGetPropertiesQuery } = api;
