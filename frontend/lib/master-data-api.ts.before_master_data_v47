// frontend/lib/master-data-api.ts

import {
    api,
    type ApiOk,
} from "@/lib/api";

export type MasterStatus =
    | 0
    | 1;

export interface QueryTypeItem {
    id: number;
    name: string;
    description: string;
    status: MasterStatus;
    created_at?: string | null;
    updated_at?: string | null;
}

export type DeviceCatalogLevel =
    | "category"
    | "brand"
    | "model";

export interface DeviceCatalogItem {
    id: number;
    name: string;
    type: DeviceCatalogLevel;
    status: MasterStatus;
    parent_id?: number | null;
    parent_name?: string | null;
    category_id?: number | null;
    category_name?: string | null;
    brand_id?: number | null;
    brand_name?: string | null;
    model_name?: string | null;
}

export type ComponentType =
    | "cpu"
    | "ram"
    | "ssd"
    | "monitor";

export interface ComponentItem {
    id: number;
    type: ComponentType;
    name: string;
    status: MasterStatus;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface MasterDataList<T> {
    data: T[];
}

export const masterDataApi = {
    queryTypes: {
        list: () =>
            api.get<
                ApiOk<QueryTypeItem[]>
            >(
                "/master-data/query-types"
            ),

        create: (
            body: {
                name: string;
                description: string;
                status: MasterStatus;
            }
        ) =>
            api.post<
                ApiOk<QueryTypeItem>
            >(
                "/master-data/query-types",
                body
            ),

        update: (
            id: number,
            body: {
                name: string;
                description: string;
                status: MasterStatus;
            }
        ) =>
            api.put<
                ApiOk<QueryTypeItem>
            >(
                `/master-data/query-types/${id}`,
                body
            ),
    },

    deviceCatalog: {
        list: () =>
            api.get<
                ApiOk<DeviceCatalogItem[]>
            >(
                "/master-data/device-catalog"
            ),

        categories: () =>
            api.get<
                ApiOk<DeviceCatalogItem[]>
            >(
                "/master-data/categories"
            ),

        brands: (
            categoryId: number
        ) =>
            api.get<
                ApiOk<DeviceCatalogItem[]>
            >(
                `/master-data/categories/${categoryId}/brands`
            ),

        create: (
            body: {
                name: string;
                type: DeviceCatalogLevel;
                status: MasterStatus;
                parent_id?: number | null;
            }
        ) =>
            api.post<
                ApiOk<DeviceCatalogItem>
            >(
                "/master-data/device-catalog",
                body
            ),

        update: (
            id: number,
            body: {
                name: string;
                type: DeviceCatalogLevel;
                status: MasterStatus;
                parent_id?: number | null;
            }
        ) =>
            api.put<
                ApiOk<DeviceCatalogItem>
            >(
                `/master-data/device-catalog/${id}`,
                body
            ),
    },

    components: {
        list: () =>
            api.get<
                ApiOk<ComponentItem[]>
            >(
                "/master-data/components"
            ),

        create: (
            body: {
                type: ComponentType;
                name: string;
                status: MasterStatus;
            }
        ) =>
            api.post<
                ApiOk<ComponentItem>
            >(
                "/master-data/components",
                body
            ),

        update: (
            id: number,
            body: {
                type: ComponentType;
                name: string;
                status: MasterStatus;
            }
        ) =>
            api.put<
                ApiOk<ComponentItem>
            >(
                `/master-data/components/${id}`,
                body
            ),
    },
};
