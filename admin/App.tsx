import React from "react";
import { Refine, Authenticated } from "@refinedev/core";
import { dataProvider } from "@refinedev/supabase";
import routerBindings, {
  NavigateToResource,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";
import { Route, Routes, Outlet } from "react-router-dom";
import { supabase } from "../services/supabase";
import { AdminLayout } from "./components/AdminLayout";
import { Dashboard } from "./pages/Dashboard";
import { ProductList } from "./pages/products/list";
import { ProductCreate } from "./pages/products/create";
import { ProductEdit } from "./pages/products/edit";
import { ExpertList } from "./pages/experts/list";
import { ExpertCreate } from "./pages/experts/create";
import { ExpertEdit } from "./pages/experts/edit";
import { OrderList } from "./pages/orders/list";
import { OrderShow } from "./pages/orders/show";
import { ConsultationList } from "./pages/consultations/list";
import { ConsultationCreate } from "./pages/consultations/create";
import { ConsultationEdit } from "./pages/consultations/edit";
import { ProfileList } from "./pages/profiles/list";
import { SystemSettingsList } from "./pages/settings/list";
import { ArchiveList } from "./pages/archives/list";
import { ArchiveCreate } from "./pages/archives/create";
import { ArchiveEdit } from "./pages/archives/edit";
import { TagList } from "./pages/tags/list";
import { TagCreate } from "./pages/tags/create";
import { TagEdit } from "./pages/tags/edit";
import { ShippingList } from "./pages/shipping/list";
import { ShippingCreate } from "./pages/shipping/create";
import { ShippingEdit } from "./pages/shipping/edit";
import { AppointmentList } from "./pages/appointments/list";
import { AppointmentCreate } from "./pages/appointments/create";
import { AppointmentEdit } from "./pages/appointments/edit";

// Custom Auth Provider to use existing Supabase session
// Custom Auth Provider to use existing Supabase session
const authProvider = {
  login: async () => {
    return {
      success: false,
      error: {
        name: "Login Error",
        message: "Please login in the main application",
      },
    };
  },
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return {
        success: false,
        error,
      };
    }
    return {
      success: true,
      redirectTo: "/",
    };
  },
  onError: async (error: any) => {
    console.error(error);
    return { error };
  },
  check: async () => {
    const { data } = await supabase.auth.getSession();
    const { session } = data;

    if (!session) {
      return {
        authenticated: false,
        redirectTo: "/",
        logout: true,
      };
    }

    // Strict Admin Check
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single();

    if (error || !profile?.is_admin) {
      return {
        authenticated: false,
        redirectTo: "/",
        error: {
          message: "Access Denied: Administrator privileges required.",
          name: "Unauthorized",
        },
      };
    }

    return {
      authenticated: true,
    };
  },
  getPermissions: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return null;

    // Always fetch latest role from DB
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", data.user.id)
      .single();

    return profile?.is_admin ? "admin" : "user";
  },
  getIdentity: async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      return {
        ...data.user,
        name: data.user.email,
        avatar: data.user.user_metadata?.avatar_url,
      };
    }
    return null;
  },
};

export const AdminApp: React.FC = () => {
  return (
    <Refine
      dataProvider={dataProvider(supabase)}
      authProvider={authProvider}
      routerProvider={routerBindings}
      resources={[
        {
          name: "dashboard",
          list: "/admin",
          meta: {
            label: "Dashboard",
            icon: "dashboard",
          },
        },
        {
          name: "products",
          list: "/admin/products",
          create: "/admin/products/create",
          edit: "/admin/products/edit/:id",
          meta: {
            label: "Products",
            icon: "inventory_2",
          },
        },
        {
          name: "experts",
          list: "/admin/experts",
          create: "/admin/experts/create",
          edit: "/admin/experts/edit/:id",
          meta: {
            label: "Experts",
            icon: "psychology",
          },
        },
        {
          name: "consultations",
          list: "/admin/consultations",
          create: "/admin/consultations/create",
          edit: "/admin/consultations/edit/:id",
          meta: {
            label: "Consultations",
            icon: "event",
          },
        },
        {
          name: "orders",
          list: "/admin/orders",
          show: "/admin/orders/show/:id",
          meta: {
            label: "Orders",
            icon: "receipt_long",
          },
        },
        {
          name: "archives",
          list: "/admin/archives",
          create: "/admin/archives/create",
          edit: "/admin/archives/edit/:id",
          meta: {
            label: "Archives (CMS)",
            icon: "history_edu",
          },
        },
        {
          name: "tags",
          list: "/admin/tags",
          create: "/admin/tags/create",
          edit: "/admin/tags/edit/:id",
          meta: {
            label: "Tags & Categories",
            icon: "label",
          },
        },
        {
          name: "shipping_zones",
          list: "/admin/shipping",
          create: "/admin/shipping/create",
          edit: "/admin/shipping/edit/:id",
          meta: {
            label: "Shipping",
            icon: "local_shipping",
          },
        },
        {
          name: "shipping_rates",
          meta: {
            hide: true,
          },
        },
        {
          name: "appointments",
          list: "/admin/appointments",
          create: "/admin/appointments/create",
          edit: "/admin/appointments/edit/:id",
          meta: {
            label: "Appointments",
            icon: "calendar_month",
          },
        },
        {
          name: "profiles",
          list: "/admin/profiles",
          meta: {
            label: "Users",
            icon: "group",
          },
        },
        {
          name: "system_settings",
          list: "/admin/settings",
          meta: {
            label: "Settings",
            icon: "settings",
          },
        },
      ]}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
      }}
    >
      <Routes>
        <Route
          element={
            <Authenticated key="admin-auth" redirectOnFail="/">
              <AdminLayout />
            </Authenticated>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products">
            <Route index element={<ProductList />} />
            <Route path="create" element={<ProductCreate />} />
            <Route path="edit/:id" element={<ProductEdit />} />
          </Route>
          <Route path="experts">
            <Route index element={<ExpertList />} />
            <Route path="create" element={<ExpertCreate />} />
            <Route path="edit/:id" element={<ExpertEdit />} />
          </Route>
          <Route path="consultations">
            <Route index element={<ConsultationList />} />
            <Route path="create" element={<ConsultationCreate />} />
            <Route path="edit/:id" element={<ConsultationEdit />} />
          </Route>
          <Route path="orders">
            <Route index element={<OrderList />} />
            <Route path="show/:id" element={<OrderShow />} />
          </Route>
          <Route path="archives">
            <Route index element={<ArchiveList />} />
            <Route path="create" element={<ArchiveCreate />} />
            <Route path="edit/:id" element={<ArchiveEdit />} />
          </Route>
          <Route path="tags">
            <Route index element={<TagList />} />
            <Route path="create" element={<TagCreate />} />
            <Route path="edit/:id" element={<TagEdit />} />
          </Route>
          <Route path="shipping">
            <Route index element={<ShippingList />} />
            <Route path="create" element={<ShippingCreate />} />
            <Route path="edit/:id" element={<ShippingEdit />} />
          </Route>
          <Route path="appointments">
            <Route index element={<AppointmentList />} />
            <Route path="create" element={<AppointmentCreate />} />
            <Route path="edit/:id" element={<AppointmentEdit />} />
          </Route>
          <Route path="profiles" element={<ProfileList />} />
          <Route path="settings" element={<SystemSettingsList />} />
          <Route path="*" element={<div>Page Not Found</div>} />
        </Route>
      </Routes>
      <UnsavedChangesNotifier />
      <DocumentTitleHandler />
    </Refine>
  );
};
