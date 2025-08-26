import Card from '@/components/card';
import CardCompact from '@/components/card-compact';
import { useAddFavoritePropertyMutation, useGetAuthUserQuery, useGetPropertiesQuery, useGetTenantQuery, useRemoveFavoritePropertyMutation } from '@/state/api';
import { useAppSelector } from '@/state/redux';
import { Property } from '@/types/prismaTypes';
import React from 'react'

const Listings = () => {

    const { data: authUser } = useGetAuthUserQuery();
    const { data: tenant } = useGetTenantQuery(
      authUser?.cognitoInfo?.userId || "",
      {
        skip: !authUser?.cognitoInfo?.userId,
      }
    );
    const [addFavorite] = useAddFavoritePropertyMutation();
    const [removeFavorite] = useRemoveFavoritePropertyMutation();
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const filters = useAppSelector((state) => state.global.filters);

    const {
      data: properties,
      isLoading,
      isError,
    } = useGetPropertiesQuery(filters);

    const handleFavoriteToggle = async (propertyId: number) => {
      // 1. Kiểm tra xem hàm có được gọi không
      console.log("--- handleFavoriteToggle được gọi ---");
      console.log("propertyId nhận được:", propertyId);
      console.log("Giá trị của authUser:", authUser);

      if (!authUser) {
        console.log("authUser không tồn tại, thoát khỏi handleFavoriteToggle.");
        return;
      }

      // Log thông tin authUser chi tiết
      console.log("authUser.cognitoInfo.userId:", authUser.cognitoInfo.userId);
      console.log("Giá trị của tenant:", tenant);
      console.log("Giá trị của tenant?.favorites:", tenant?.favorites);

      const isFavorite = tenant?.favorites?.some(
        (fav: Property) => fav.id === propertyId
      );

      // 2. Log trạng thái yêu thích hiện tại
      console.log("isFavorite (trạng thái hiện tại):", isFavorite);

      try {
        if (isFavorite) {
          // 3. Log thông tin trước khi gọi removeFavorite
          console.log("Đang cố gắng XÓA khỏi yêu thích.");
          console.log("Tham số cho removeFavorite:", {
            cognitoId: authUser.cognitoInfo.userId,
            propertyId,
          });

          await removeFavorite({
            cognitoId: authUser.cognitoInfo.userId,
            propertyId,
          }).unwrap(); // Dùng .unwrap() để bắt lỗi ở đây

          console.log("Xóa khỏi yêu thích thành công!");
        } else {
          // 4. Log thông tin trước khi gọi addFavorite
          console.log("Đang cố gắng THÊM vào yêu thích.");
          console.log("Tham số cho addFavorite:", {
            cognitoId: authUser.cognitoInfo.userId,
            propertyId,
          });

          await addFavorite({
            cognitoId: authUser.cognitoInfo.userId,
            propertyId,
          }).unwrap(); // Dùng .unwrap() để bắt lỗi ở đây

          console.log("Thêm vào yêu thích thành công!");
        }
      } catch (error) {
        // 5. Bắt và log lỗi chi tiết từ mutation
        console.error("Lỗi xảy ra trong handleFavoriteToggle:", error);
        // Nếu bạn đang dùng toast, lỗi này sẽ được truyền vào hàm withToast của bạn.
        // Kiểm tra cấu trúc của 'error' trong console.
        // Ví dụ: console.error("Lỗi data:", error.data);
        // console.error("Lỗi status:", error.status);
        // console.error("Lỗi message:", error.message);
      }
    };

    if (isLoading) return <>Loading...</>;
    if (isError || !properties) return <div>Failed to fetch properties</div>;

    return (
      <div className="w-full">
        <h3 className="text-sm px-4 font-bold">
          {properties.length}{" "}
          <span className="text-gray-700 font-normal">
            Places in {filters.location}
          </span>
        </h3>
        <div className="flex">
          <div className="p-4 w-full">
            {properties?.map((property) =>
              viewMode === "grid" ? (
                <Card
                  key={property.id}
                  property={property}
                  isFavorite={
                    tenant?.favorites?.some(
                      (fav: Property) => fav.id === property.id
                    ) || false
                  }
                  onFavoriteToggle={() => handleFavoriteToggle(property.id)}
                  showFavoriteButton={!!authUser}
                  propertyLink={`/search/${property.id}`}
                />
              ) : (
                <CardCompact
                  key={property.id}
                  property={property}
                  isFavorite={
                    tenant?.favorites?.some(
                      (fav: Property) => fav.id === property.id
                    ) || false
                  }
                  onFavoriteToggle={() => handleFavoriteToggle(property.id)}
                  showFavoriteButton={!!authUser}
                  propertyLink={`/search/${property.id}`}
                />
              )
            )}
          </div>
        </div>
      </div>
    );
}

export default Listings;