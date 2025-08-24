"use client";

import Header from "@/components/header";
import Loading from "@/components/loading";
import Card from "@/components/card";
import {
  useGetAuthUserQuery,
  useGetPropertiesQuery,
  useGetTenantQuery,
} from "@/state/api";
import React from "react";
import { Property } from "@/types/prismaTypes";

const Favorites = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const { data: tenant } = useGetTenantQuery(
    authUser?.cognitoInfo?.userId || "",
    {
      skip: !authUser?.cognitoInfo?.userId,
    }
  );

  const {
    data: favoriteProperties,
    isLoading,
    error,
  } = useGetPropertiesQuery(
    {
      favoriteIds: tenant?.favorites?.map((fav: { id: number }) => fav.id),
    },
    {
      skip: !tenant?.favorites || tenant.favorites.length === 0,
    }
  );

  if (isLoading) return <Loading />;
  if (error) return <div>Error loading favorite properties.</div>;

  return (
    <div className="dashboard-container">
      <Header
        title="Favorite Properties"
        subtitle="List of properties you have marked as favorite."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favoriteProperties?.map((property) => (
          <Card
            key={property.id}
            property={property}
            isFavorite={true}
            onFavoriteToggle={() => {}}
            showFavoriteButton={false}
            propertyLink={`tenants/residences/${property.id}`}
          />
        ))}
      </div>

      {(!favoriteProperties || favoriteProperties.length === 0) && (
        <p>You don&lsquo;t have any favorite properties.</p>
      )}
    </div>
  );
};

export default Favorites;
