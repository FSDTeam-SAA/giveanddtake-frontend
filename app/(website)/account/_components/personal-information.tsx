"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2 } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

/* ----------------------------- API helpers ----------------------------- */

async function fetchUserData(token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/user/single`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  if (!response.ok) throw new Error("Failed to fetch user data");
  return response.json();
}

async function updateUserData({ token, data }: { token: string; data: any }) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/user/update`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) throw new Error("Failed to update user data");
  return response.json();
}

async function deleteAccount(token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/user/deactivate`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) throw new Error("Failed to delete account");

  return response.json();
}

/** Verify password before deletion */
async function verifyPassword(email: string, password: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/user/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }
  );
  if (!response.ok) throw new Error("Please Check Your Password.");
  const json = await response.json();
  return json; // expects shape with { success: boolean, ... }
}

/* ----------------------------- Utilities ------------------------------ */

function splitName(full?: string): { firstName: string; surname: string } {
  const safe = (full || "").trim().replace(/\s+/g, " ");
  if (!safe) return { firstName: "", surname: "" };
  const parts = safe.split(" ");
  if (parts.length === 1) return { firstName: parts[0], surname: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    surname: parts.slice(-1)[0],
  };
}

function mergeName(firstName: string, surname: string): string {
  return [firstName?.trim(), surname?.trim()].filter(Boolean).join(" ");
}

/* ------------------------- Component starts here ------------------------ */

export function PersonalInformation() {
  const [isEditing, setIsEditing] = useState(false);

  // delete modal asks for password
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const { data: session } = useSession();
  const token = session?.accessToken || "";
  const email = session?.user?.email || "";

  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch user data
  const { data, isLoading, error } = useQuery({
    queryKey: ["userData", token],
    queryFn: () => fetchUserData(token),
    enabled: !!token,
  });

  // Controlled form state (split name into first/surname)
  const initialNames = useMemo(
    () => splitName(data?.data?.name),
    [data?.data?.name]
  );

  const [formData, setFormData] = useState({
    firstName: initialNames.firstName || "",
    surname: initialNames.surname || "",
    email: data?.data?.email || "",
    phone: data?.data?.phoneNum || "",
    country: data?.data?.address || "",
    cityState: "",
    town: "",
    zipCode: "",
  });

  useEffect(() => {
    if (data?.data) {
      const split = splitName(data.data.name);
      setFormData({
        firstName: split.firstName,
        surname: split.surname,
        email: data.data.email || "",
        phone: data.data.phoneNum || "",
        country: data.data.address || "",
        cityState: "",
        town: "",
        zipCode: "",
      });
    }
  }, [data]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateUserData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userData", token] });
      toast.success("Personal information updated successfully!");
      setIsEditing(false);
    },
    onError: (error: any) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteFlowMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const verify = await verifyPassword(email, password);
      if (!verify?.success) {
        throw new Error("Password verification failed");
      }
      return await deleteAccount(token);
    },
    onSuccess: async () => {
      toast.success(
        "Your account is now marked for deletion. You can still log in within 30 days to restore it."
      );
      setIsDeleteModalOpen(false);
      setDeletePassword("");
      try {
        await signOut({ redirect: false });
        router.push("/login");
      } catch (error) {
        toast.error("Failed to log out: " + (error as Error).message);
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Account deletion failed");
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const mergedName = mergeName(formData.firstName, formData.surname);
    updateMutation.mutate({
      token,
      data: {
        name: mergedName,
        // Email cannot be changed; do not send email if back-end treats it as immutable
        phoneNum: formData.phone,
        address: formData.country,
      },
    });
  };

  const handleDelete = () => setIsDeleteModalOpen(true);

  const confirmDelete = () => {
    if (!email) {
      toast.error("No email found on session. Please re-login and try again.");
      return;
    }
    if (!deletePassword) {
      toast.error("Please enter your password to continue.");
      return;
    }
    deleteFlowMutation.mutate({ email, password: deletePassword });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-10 w-24 bg-gray-200 rounded" />
        </div>
        {/* Form Fields Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(7)].map((_, index) => (
            <div key={index}>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-10 w-full bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        {/* Buttons Skeleton */}
        <div className="flex gap-4 mt-12 pt-8 border-t border-gray-200">
          <div className="h-10 w-32 bg-gray-200 rounded" />
          <div className="flex-1">
            <div className="h-10 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-64 bg-gray-200 rounded mt-2" />
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Personal Information
        </h1>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-primary hover:bg-blue-700 text-white px-4 py-2 text-sm"
        >
          <Edit2 className="h-4 w-4 mr-2" />
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label
            htmlFor="firstName"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            First name
          </Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            disabled={!isEditing}
            className="bg-gray-50 border-gray-200"
          />
        </div>

        <div>
          <Label
            htmlFor="surname"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Surname
          </Label>
          <Input
            id="surname"
            value={formData.surname}
            onChange={(e) => handleInputChange("surname", e.target.value)}
            disabled={!isEditing}
            className="bg-gray-50 border-gray-200"
          />
        </div>

        <div>
          <Label
            htmlFor="email"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            disabled /* Email is not editable */
            className="bg-gray-50 border-gray-200"
          />
        </div>

        <div>
          <Label
            htmlFor="phone"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Phone
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            disabled={!isEditing}
            className="bg-gray-50 border-gray-200"
          />
        </div>

        <div>
          <Label
            htmlFor="country"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Country
          </Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => handleInputChange("country", e.target.value)}
            disabled={!isEditing}
            className="bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      {isEditing && (
        <div className="mt-8">
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-blue-700 text-white px-8 py-2"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Updating..." : "Update"}
          </Button>
        </div>
      )}

      <div className="t-12 mt-8 border-t border-gray-200">
        <div className="grid grid-cols-1 mt-8 gap-4 w-[80%] lg:w-[55%] mx-auto">
          <div>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 w-full text-white px-8 py-2 h-[51px]"
              disabled={deleteFlowMutation.isPending}
            >
              {deleteFlowMutation.isPending ? "Deleting..." : "Delete Account"}
            </Button>
            <p className="text-xs text-red-600 mt-2 text-center">
              Deleting your account starts a 30-day grace period. If you change
              your mind, you can log in again within 30 days to restore your
              account. After 30 days, your account and its data will be
              permanently deleted.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal (with password prompt) */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
            <DialogDescription>
              Please confirm your identity to permanently delete your account.
              You can still log back in within 30 days to restore it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label
                htmlFor="delete-email"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Email
              </Label>
              <Input
                id="delete-email"
                type="email"
                value={email}
                disabled
                className="bg-gray-50 border-gray-200"
              />
            </div>
            <div>
              <Label
                htmlFor="delete-password"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Password
              </Label>
              <Input
                id="delete-password"
                type="password"
                placeholder="Enter your password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="bg-gray-50 border-gray-200"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleteFlowMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteFlowMutation.isPending}
            >
              {deleteFlowMutation.isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
