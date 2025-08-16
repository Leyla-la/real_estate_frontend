"use client";

import SettingsForm from '@/components/settings-form';
import { useGetAuthUserQuery, useUpdateManagerSettingsMutation } from '@/state/api';
import React from 'react'

const ManagerSettings = () => {

    const { data: authUser, isLoading } = useGetAuthUserQuery();
    const [updateManager] = useUpdateManagerSettingsMutation();
    console.log("Auth User Data:", authUser);
    if (isLoading) return <>Loading...</>;
    if (!authUser || !authUser.userInfo) {
      return <>Error: User data not found.</>;
    }
    const initialData = {
      name: authUser?.userInfo.name,
      email: authUser?.userInfo.email,
      phoneNumber: authUser?.userInfo.phoneNumber,
    };

    const handleSubmit = async (data: typeof initialData) => {
        await updateManager({
            cognitoId: authUser?.cognitoInfo?.userId,
            ...data,
        });
        
    };

        return (
            <SettingsForm
                initialData={initialData}
                onSubmit={handleSubmit}
                userType="manager"
            />
        );
    };

    export default ManagerSettings;