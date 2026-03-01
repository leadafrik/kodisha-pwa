import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Shield, UserCheck, UserX } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useProperties } from "../contexts/PropertyContext";
import ProfilePictureUpload from "../components/ProfilePictureUpload";
import { scheduleAccountDeletion } from "../services/userService";
import { API_ENDPOINTS, ensureValidAccessToken } from "../config/api";

type ListingsTab = "land" | "services" | "agrovets" | "products";

const ADMIN_ROLES = new Set(["admin", "super_admin", "moderator"]);

const normalizeText = (value?: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const formatPrice = (value: unknown) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Contact for price";
  return `KSh ${amount.toLocaleString()}`;
};

const normalizeId = (value: unknown): string => {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "object") {
    const raw = value as any;
    const nested = raw?._id || raw?.id || raw?.$oid;
    if (nested) {
      const nestedId = normalizeId(nested);
      if (nestedId) return nestedId;
    }

    const asString = raw?.toString?.();
    if (
      typeof asString === "string" &&
      asString !== "[object Object]" &&
      asString.trim()
    ) {
      return asString.trim();
    }
  }

  return "";
};

const getListingPath = (item: any, fallbackId?: unknown): string | null => {
  const listingId =
    normalizeId(item?._id) ||
    normalizeId(item?.id) ||
    normalizeId(item?.listingId) ||
    normalizeId(item?.listing?._id) ||
    normalizeId(item?.listing?.id) ||
    normalizeId(item?.listing?.listingId) ||
    normalizeId(item?.productId) ||
    normalizeId(item?.serviceId) ||
    normalizeId(item?.landId) ||
    normalizeId(fallbackId);

  if (!listingId) return null;
  return `/listings/${encodeURIComponent(listingId)}`;
};

type ProductEditForm = {
  title: string;
  description: string;
  price: string;
  quantity: string;
  unit: string;
  contact: string;
  county: string;
  constituency: string;
  ward: string;
  approximateLocation: string;
};

const EMPTY_PRODUCT_EDIT_FORM: ProductEditForm = {
  title: "",
  description: "",
  price: "",
  quantity: "",
  unit: "",
  contact: "",
  county: "",
  constituency: "",
  ward: "",
  approximateLocation: "",
};

const Profile: React.FC = () => {
  const { user, logout, updateProfile, refreshUser } = useAuth();
  const { properties, serviceListings, productListings, loading, refreshProducts } = useProperties();
  const navigate = useNavigate();

  const [userProfilePicture, setUserProfilePicture] = useState<string | undefined>(user?.profilePicture);
  const [activeTab, setActiveTab] = useState<ListingsTab>("products");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productEditForm, setProductEditForm] =
    useState<ProductEditForm>(EMPTY_PRODUCT_EDIT_FORM);
  const [savingProductEdit, setSavingProductEdit] = useState(false);
  const [productEditError, setProductEditError] = useState<string | null>(null);
  const [relistingProductId, setRelistingProductId] = useState<string | null>(null);

  useEffect(() => {
    setUserProfilePicture(user?.profilePicture);
  }, [user?.profilePicture]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const safeProperties = useMemo(
    () => (Array.isArray(properties) ? properties : []),
    [properties]
  );
  const safeServiceListings = useMemo(
    () => (Array.isArray(serviceListings) ? serviceListings : []),
    [serviceListings]
  );
  const safeProductListings = useMemo(
    () => (Array.isArray(productListings) ? productListings : []),
    [productListings]
  );

  const ownerIds = useMemo(
    () => new Set([user?.id, user?._id].filter(Boolean).map((value) => String(value))),
    [user?.id, user?._id]
  );
  const ownerNames = useMemo(
    () =>
      new Set(
        [user?.name, user?.fullName]
          .filter(Boolean)
          .map((value) => normalizeText(value))
          .filter(Boolean)
      ),
    [user?.name, user?.fullName]
  );
  const ownerEmail = normalizeText(user?.email);
  const ownerPhone = normalizeText(user?.phone);

  const matchesCurrentUser = useCallback(
    (
      ownerId?: unknown,
      ownerEmailCandidate?: unknown,
      ownerPhoneCandidate?: unknown,
      listedByCandidate?: unknown
    ) => {
      if (ownerId && ownerIds.has(String(ownerId))) return true;

      const email = normalizeText(ownerEmailCandidate);
      if (ownerEmail && email && ownerEmail === email) return true;

      const phone = normalizeText(ownerPhoneCandidate);
      if (ownerPhone && phone && ownerPhone === phone) return true;

      const listedBy = normalizeText(listedByCandidate);
      if (listedBy && ownerNames.has(listedBy)) return true;

      return false;
    },
    [ownerIds, ownerEmail, ownerPhone, ownerNames]
  );

  const userProperties = useMemo(() => {
    return safeProperties.filter((property: any) =>
      matchesCurrentUser(
        property?.owner?._id || property?.ownerId || property?.userId,
        property?.owner?.email || property?.email,
        property?.owner?.phone || property?.contact,
        property?.listedBy
      )
    );
  }, [safeProperties, matchesCurrentUser]);

  const ownedServiceListings = useMemo(() => {
    return safeServiceListings.filter((service: any) =>
      matchesCurrentUser(
        service?.ownerId || service?.owner?._id || service?.owner,
        service?.owner?.email || service?.email,
        service?.contact || service?.owner?.phone || service?.owner?.email,
        service?.ownerName
      )
    );
  }, [safeServiceListings, matchesCurrentUser]);

  const userServices = useMemo(
    () => ownedServiceListings.filter((service: any) => service?.type !== "agrovet"),
    [ownedServiceListings]
  );

  const userAgrovets = useMemo(
    () => ownedServiceListings.filter((service: any) => service?.type === "agrovet"),
    [ownedServiceListings]
  );

  const userProducts = useMemo(() => {
    return safeProductListings.filter((product: any) =>
      matchesCurrentUser(
        product?.seller?._id || product?.owner?._id || product?.ownerId || product?.userId,
        product?.seller?.email || product?.owner?.email || product?.email,
        product?.contact || product?.seller?.phone || product?.owner?.phone,
        product?.seller?.fullName || product?.seller?.name
      )
    );
  }, [safeProductListings, matchesCurrentUser]);

  const openProductEditor = useCallback((product: any) => {
    setEditingProduct(product);
    setProductEditError(null);
    setProductEditForm({
      title: product?.title || "",
      description: product?.description || "",
      price: product?.price !== undefined && product?.price !== null ? String(product.price) : "",
      quantity:
        product?.quantity !== undefined && product?.quantity !== null
          ? String(product.quantity)
          : "",
      unit: product?.unit || "",
      contact: product?.contact || "",
      county: product?.location?.county || "",
      constituency: product?.location?.constituency || "",
      ward: product?.location?.ward || "",
      approximateLocation: product?.location?.approximateLocation || "",
    });
  }, []);

  const closeProductEditor = useCallback(() => {
    if (savingProductEdit) return;
    setEditingProduct(null);
    setProductEditError(null);
    setProductEditForm(EMPTY_PRODUCT_EDIT_FORM);
  }, [savingProductEdit]);

  const saveProductEdit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!editingProduct) return;

      const productId = normalizeId(editingProduct?._id) || normalizeId(editingProduct?.id);
      if (!productId) {
        setProductEditError("Missing listing ID. Refresh and try again.");
        return;
      }

      const title = productEditForm.title.trim();
      const description = productEditForm.description.trim();
      const contact = productEditForm.contact.trim();
      const county = productEditForm.county.trim();
      const constituency = productEditForm.constituency.trim();
      const ward = productEditForm.ward.trim();
      const price = Number(productEditForm.price);
      const quantityRaw = productEditForm.quantity.trim();
      const quantity = quantityRaw ? Number(quantityRaw) : undefined;

      if (!title || !description || !contact || !county || !constituency || !ward) {
        setProductEditError("Title, description, contact, county, constituency, and ward are required.");
        return;
      }

      if (!Number.isFinite(price) || price < 0) {
        setProductEditError("Price must be a valid number greater than or equal to 0.");
        return;
      }

      if (quantityRaw && (!Number.isFinite(quantity) || (quantity ?? 0) < 0)) {
        setProductEditError("Quantity must be a valid number greater than or equal to 0.");
        return;
      }

      const token = await ensureValidAccessToken();
      if (!token) {
        setProductEditError("Please log in again to edit this listing.");
        return;
      }

      setSavingProductEdit(true);
      setProductEditError(null);

      try {
        const response = await fetch(API_ENDPOINTS.services.products.edit(productId), {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            description,
            price,
            quantity: quantityRaw ? quantity : "",
            unit: productEditForm.unit.trim(),
            contact,
            county,
            constituency,
            ward,
            approximateLocation: productEditForm.approximateLocation.trim(),
          }),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Failed to update listing.");
        }

        await refreshProducts();
        setEditingProduct(null);
        setProductEditForm(EMPTY_PRODUCT_EDIT_FORM);
      } catch (error: any) {
        setProductEditError(error?.message || "Failed to update listing.");
      } finally {
        setSavingProductEdit(false);
      }
    },
    [editingProduct, productEditForm, refreshProducts]
  );

  const listProductAgain = useCallback(
    async (product: any) => {
      const productId = normalizeId(product?._id) || normalizeId(product?.id);
      if (!productId) {
        window.alert("Missing listing ID. Refresh and try again.");
        return;
      }

      const shouldProceed = window.confirm(
        "Create a new listing from this product details?"
      );
      if (!shouldProceed) return;

      const token = await ensureValidAccessToken();
      if (!token) {
        window.alert("Please log in again to relist.");
        return;
      }

      setRelistingProductId(productId);
      try {
        const response = await fetch(API_ENDPOINTS.services.products.listAgain(productId), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Failed to relist product.");
        }

        await refreshProducts();
        const relistedPath = getListingPath(result?.data);
        if (relistedPath) {
          navigate(relistedPath);
          return;
        }
        navigate("/profile");
      } catch (error: any) {
        window.alert(error?.message || "Failed to relist product.");
      } finally {
        setRelistingProductId(null);
      }
    },
    [navigate, refreshProducts]
  );

  const isAdmin =
    ADMIN_ROLES.has((user?.role || "").toLowerCase()) ||
    normalizeText(user?.type) === "admin" ||
    normalizeText((user as any)?.userType) === "admin";

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getVerificationBadge = () => {
    switch (user.verificationStatus) {
      case "verified":
        return (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
            Verified
          </span>
        );
      case "pending":
        return (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
            Pending
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">
            Not Verified
          </span>
        );
    }
  };

  const getUserTypeLabel = () => {
    switch (user.type) {
      case "buyer":
        return "Buyer";
      case "seller":
        return "Seller";
      case "service_provider":
        return "Service Provider";
      case "admin":
        return "Admin";
      default:
        return isAdmin ? "Admin" : "User";
    }
  };

  const verificationDetails: {
    emailVerified?: boolean;
    phoneVerified?: boolean;
    idVerified?: boolean;
    selfieVerified?: boolean;
    ownershipVerified?: boolean;
    businessVerified?: boolean;
    verificationLevel?: string;
    trustScore?: number;
  } = user?.verification || {};

  const verificationItems: Array<{ label: string; value: boolean }> = [
    { label: "Email verified", value: verificationDetails.emailVerified ?? !!user?.email },
    { label: "Phone verified", value: verificationDetails.phoneVerified ?? false },
    { label: "ID verified", value: verificationDetails.idVerified ?? false },
    { label: "Selfie verified", value: verificationDetails.selfieVerified ?? false },
  ];

  const listingGroups: Record<
    ListingsTab,
    { label: string; items: any[]; emptyMessage: string; emptyCta: string; emptyLink: string }
  > = {
    land: {
      label: "Land",
      items: userProperties,
      emptyMessage: "No land listings yet.",
      emptyCta: "List land",
      emptyLink: "/create-listing",
    },
    services: {
      label: "Services",
      items: userServices,
      emptyMessage: "No service listings yet.",
      emptyCta: "List a service",
      emptyLink: "/create-listing",
    },
    agrovets: {
      label: "Agrovets",
      items: userAgrovets,
      emptyMessage: "No agrovet listings yet.",
      emptyCta: "Add agrovet listing",
      emptyLink: "/create-listing",
    },
    products: {
      label: "Products",
      items: userProducts,
      emptyMessage: "No product listings yet.",
      emptyCta: "List a product",
      emptyLink: "/create-listing",
    },
  };

  const activeListingGroup = listingGroups[activeTab];
  const visibleItems = activeListingGroup.items.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {getVerificationBadge()}
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  {getUserTypeLabel()}
                </span>
                {isAdmin && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    Admin access
                  </span>
                )}
              </div>
              <div className="mt-4 space-y-1 text-sm text-slate-600">
                {user.phone && user.phone !== user.email && <p>{user.phone}</p>}
                {user.email && <p>{user.email}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <ProfilePictureUpload
                currentPicture={userProfilePicture}
                onUploadSuccess={(picture) => {
                  setUserProfilePicture(picture);
                  updateProfile({ profilePicture: picture });
                }}
                onDeleteSuccess={() => {
                  setUserProfilePicture(undefined);
                  updateProfile({ profilePicture: undefined });
                }}
              />
              <button
                onClick={logout}
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{userProperties.length}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Land listings</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{userServices.length}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Services</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{userAgrovets.length}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agrovets</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{userProducts.length}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Products</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <Link
                    to="/create-listing"
                    className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    List for sale
                  </Link>
                  <Link
                    to="/request/new"
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Post buy request
                  </Link>
                  <Link
                    to="/favorites"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Saved listings
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                      Open admin panel
                    </Link>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 text-emerald-600" size={22} />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Identity Verification</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {verificationDetails.idVerified
                        ? "Your identity verification is complete."
                        : "Complete verification to increase trust and listing visibility."}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {verificationItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      {item.value ? (
                        <UserCheck size={14} className="text-emerald-600" />
                      ) : (
                        <UserX size={14} className="text-slate-400" />
                      )}
                      <span className="text-slate-700">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Verification level</p>
                    <p className="text-sm font-semibold text-emerald-800">
                      {verificationDetails.verificationLevel || "Not set"}
                    </p>
                  </div>
                  <Link
                    to="/verify-id"
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                      verificationDetails.idVerified
                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                    onClick={(event) => {
                      if (verificationDetails.idVerified) event.preventDefault();
                    }}
                  >
                    {verificationDetails.idVerified ? "Verified" : "Get verified"}
                  </Link>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Trust score: {verificationDetails.trustScore ?? "N/A"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">Your Listings</h2>
                {loading && (
                  <span className="text-xs font-medium text-slate-500">Refreshing...</span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(listingGroups) as ListingsTab[]).map((tab) => {
                  const group = listingGroups[tab];
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-xl border px-3 py-2 text-left transition ${
                        isActive
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide">{group.label}</p>
                      <p className="text-lg font-bold">{group.items.length}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 space-y-3">
                {loading ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Loading listings...
                  </div>
                ) : visibleItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                    <p className="text-sm font-medium text-slate-600">{activeListingGroup.emptyMessage}</p>
                    <Link
                      to={activeListingGroup.emptyLink}
                      className="mt-2 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      {activeListingGroup.emptyCta}
                    </Link>
                  </div>
                ) : (
                  visibleItems.map((item: any, index: number) => {
                    const stableListingId = normalizeId(item?._id) || normalizeId(item?.id);
                    const itemKey = stableListingId || `${activeTab}-${index}`;
                    const isProductCard = activeTab === "products";
                    const title = item?.title || item?.name || "Untitled listing";
                    const location =
                      item?.county ||
                      item?.location?.county ||
                      item?.approximateLocation ||
                      "Location not set";
                    const category = item?.category || item?.type || item?.listingType || "Listing";
                    const price = formatPrice(item?.price);
                    const listingPath = getListingPath(item, stableListingId);

                    return (
                      <div
                        key={itemKey}
                        className="rounded-xl border border-slate-200 px-4 py-3 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-semibold text-slate-900">{title}</p>
                          <p className="text-sm font-semibold text-emerald-700">{price}</p>
                        </div>
                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{category}</p>
                        <p className="mt-1 text-sm text-slate-600">{location}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {listingPath ? (
                            <Link
                              to={listingPath}
                              className="text-sm font-semibold text-emerald-700 underline decoration-dotted"
                            >
                              Open listing
                            </Link>
                          ) : (
                            <p className="text-sm font-semibold text-slate-500">Listing link unavailable</p>
                          )}

                          {isProductCard && stableListingId && (
                            <>
                              <button
                                type="button"
                                onClick={() => openProductEditor(item)}
                                className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => listProductAgain(item)}
                                disabled={relistingProductId === stableListingId}
                                className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {relistingProductId === stableListingId ? "Listing again..." : "List again"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  to="/create-listing"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Add listing
                </Link>
                <Link
                  to="/request"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  View buy requests
                </Link>
              </div>
            </div>
          </div>

          {editingProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <button
                type="button"
                onClick={closeProductEditor}
                className="absolute inset-0 bg-slate-900/50"
                aria-label="Close edit listing dialog"
              />
              <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Edit Product Listing</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Update key details without creating a new listing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeProductEditor}
                    disabled={savingProductEdit}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Close
                  </button>
                </div>

                {productEditError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    {productEditError}
                  </div>
                )}

                <form onSubmit={saveProductEdit} className="grid gap-3 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Title
                    </span>
                    <input
                      value={productEditForm.title}
                      onChange={(event) =>
                        setProductEditForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      maxLength={120}
                    />
                  </label>

                  <label className="sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Description
                    </span>
                    <textarea
                      value={productEditForm.description}
                      onChange={(event) =>
                        setProductEditForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                      className="min-h-[110px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      maxLength={2000}
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Price (KSh)
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productEditForm.price}
                      onChange={(event) =>
                        setProductEditForm((prev) => ({ ...prev, price: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Quantity
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productEditForm.quantity}
                      onChange={(event) =>
                        setProductEditForm((prev) => ({ ...prev, quantity: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Unit
                    </span>
                    <input
                      value={productEditForm.unit}
                      onChange={(event) =>
                        setProductEditForm((prev) => ({ ...prev, unit: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      maxLength={40}
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Contact
                    </span>
                    <input
                      value={productEditForm.contact}
                      onChange={(event) =>
                        setProductEditForm((prev) => ({ ...prev, contact: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      County
                    </span>
                    <input
                      value={productEditForm.county}
                      onChange={(event) =>
                        setProductEditForm((prev) => ({ ...prev, county: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Constituency
                    </span>
                    <input
                      value={productEditForm.constituency}
                      onChange={(event) =>
                        setProductEditForm((prev) => ({ ...prev, constituency: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Ward
                    </span>
                    <input
                      value={productEditForm.ward}
                      onChange={(event) =>
                        setProductEditForm((prev) => ({ ...prev, ward: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Approximate location
                    </span>
                    <input
                      value={productEditForm.approximateLocation}
                      onChange={(event) =>
                        setProductEditForm((prev) => ({
                          ...prev,
                          approximateLocation: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>

                  <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeProductEditor}
                      disabled={savingProductEdit}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingProductEdit}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingProductEdit ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Account Settings</h3>
            <p className="mt-2 text-sm text-slate-600">
              Deleting your account permanently removes profile data, listings, and messages after the grace period.
            </p>
            {deleteError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {deleteError}
              </div>
            )}
            <button
              onClick={async () => {
                const confirmDelete = window.confirm("Delete your account? This action cannot be undone.");
                if (!confirmDelete) return;

                setDeletingAccount(true);
                setDeleteError(null);
                try {
                  await scheduleAccountDeletion();
                  window.alert(
                    "Your account is scheduled for deletion. You can reactivate within 30 days by contacting support."
                  );
                  logout();
                  navigate("/login");
                } catch (error: any) {
                  setDeleteError(error?.message || "Failed to schedule account deletion.");
                  setDeletingAccount(false);
                }
              }}
              disabled={deletingAccount}
              className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            >
              {deletingAccount ? "Scheduling deletion..." : "Delete account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
