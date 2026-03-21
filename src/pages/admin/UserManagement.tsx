import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Flag,
  Lock,
  Pencil,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS, adminApiRequest } from "../../config/api";
import {
  getConstituenciesByCounty,
  getWardsByConstituency,
  kenyaCounties,
} from "../../data/kenyaCounties";

type AdminAccessType = "regular" | "bulk_buyer" | "bulk_seller";
type InstitutionType =
  | "farm"
  | "cooperative"
  | "restaurant"
  | "hotel"
  | "hospital"
  | "school"
  | "processor"
  | "distributor"
  | "retailer"
  | "ngo"
  | "government"
  | "other";
type DeliveryCoverage = "countrywide" | "within_county" | "negotiable";
type ProcurementFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "as_needed";

interface User {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  userType?: string;
  role?: string;
  verification: { idVerified?: boolean };
  fraudFlags?: number;
  accountStatus?: string;
  createdAt: string;
  ratings?: { average?: number };
  listings?: any[];
}

interface CreateUserResponse {
  data?: {
    user?: {
      _id: string;
      fullName: string;
      email?: string;
      phone?: string;
      userType?: string;
    };
    accessType?: AdminAccessType;
    setupUrl?: string;
    expiresAt?: string;
  };
}

interface CreateUserFormState {
  accessType: AdminAccessType;
  fullName: string;
  email: string;
  phone: string;
  organizationName: string;
  institutionType: InstitutionType;
  county: string;
  constituency: string;
  ward: string;
  streetAddress: string;
  productsText: string;
  deliveryCoverage: DeliveryCoverage;
  yearsInAgriculture: string;
  procurementFrequency: ProcurementFrequency;
  monthlyVolume: string;
  estimatedBudgetPerOrder: string;
  notes: string;
}

const API_BASE_ADMIN_USERS = API_ENDPOINTS.admin.users.getAll;
const INPUT_CLASS =
  "w-full rounded-2xl border border-[#d8c8bc] bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-[#8f5135] focus:ring-2 focus:ring-[#ead6c5]";

const INSTITUTION_TYPES: Array<{ value: InstitutionType; label: string }> = [
  { value: "farm", label: "Farm" },
  { value: "cooperative", label: "Cooperative" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hotel" },
  { value: "hospital", label: "Hospital" },
  { value: "school", label: "School" },
  { value: "processor", label: "Processor" },
  { value: "distributor", label: "Distributor" },
  { value: "retailer", label: "Retailer" },
  { value: "ngo", label: "NGO" },
  { value: "government", label: "Government" },
  { value: "other", label: "Other" },
];

const DELIVERY_COVERAGE_OPTIONS: Array<{ value: DeliveryCoverage; label: string }> = [
  { value: "countrywide", label: "Countrywide" },
  { value: "within_county", label: "Within county" },
  { value: "negotiable", label: "Negotiable" },
];

const PROCUREMENT_FREQUENCY_OPTIONS: Array<{ value: ProcurementFrequency; label: string }> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "as_needed", label: "As needed" },
];

const createDefaultForm = (): CreateUserFormState => ({
  accessType: "regular",
  fullName: "",
  email: "",
  phone: "",
  organizationName: "",
  institutionType: "farm",
  county: "",
  constituency: "",
  ward: "",
  streetAddress: "",
  productsText: "",
  deliveryCoverage: "within_county",
  yearsInAgriculture: "",
  procurementFrequency: "weekly",
  monthlyVolume: "",
  estimatedBudgetPerOrder: "",
  notes: "",
});

const accessTypeLabel = (value: AdminAccessType) => {
  if (value === "bulk_buyer") return "Bulk buyer";
  if (value === "bulk_seller") return "Bulk seller";
  return "Regular user";
};

const userTypeLabel = (user?: User) => {
  if (!user?.userType) return "Regular";
  if (user.userType === "seller") return "Seller";
  if (user.userType === "buyer") return "Buyer";
  return user.userType;
};

const AdminUserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserFormState>(() => createDefaultForm());
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState<{
    fullName: string;
    accessType: AdminAccessType;
    setupUrl: string;
    expiresAt?: string;
  } | null>(null);

  const constituencyOptions = useMemo(
    () => (createForm.county ? getConstituenciesByCounty(createForm.county) : []),
    [createForm.county]
  );

  const wardOptions = useMemo(
    () =>
      createForm.county && createForm.constituency
        ? getWardsByConstituency(createForm.county, createForm.constituency)
        : [],
    [createForm.county, createForm.constituency]
  );

  const isBulkAccess = createForm.accessType !== "regular";
  const isBulkBuyer = createForm.accessType === "bulk_buyer";
  const isBulkSeller = createForm.accessType === "bulk_seller";

  useEffect(() => {
    void handleSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!createForm.county) {
      if (createForm.constituency || createForm.ward) {
        setCreateForm((current) => ({ ...current, constituency: "", ward: "" }));
      }
      return;
    }

    const constituencyIsValid = constituencyOptions.some(
      (option) => option.value === createForm.constituency
    );

    if (!constituencyIsValid && createForm.constituency) {
      setCreateForm((current) => ({ ...current, constituency: "", ward: "" }));
      return;
    }

    if (createForm.ward) {
      const wardIsValid = wardOptions.some((option) => option.value === createForm.ward);
      if (!wardIsValid) {
        setCreateForm((current) => ({ ...current, ward: "" }));
      }
    }
  }, [createForm.county, createForm.constituency, createForm.ward, constituencyOptions, wardOptions]);

  const handleSearch = async (newPage = 1) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (statusFilter) params.append("status", statusFilter);
      params.append("page", String(newPage));
      params.append("limit", "20");
      params.append("sortBy", "createdAt");

      const response = await adminApiRequest(`${API_ENDPOINTS.admin.users.search}?${params.toString()}`);
      setUsers(response.data || []);
      setTotal(response.pagination?.total || 0);
      setPage(newPage);
    } catch (err: any) {
      setError(err?.message || "Failed to search users.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId: string, reason: string) => {
    if (!reason.trim()) {
      setError("Suspension reason is required");
      return;
    }

    try {
      await adminApiRequest(`${API_BASE_ADMIN_USERS}/${userId}/suspend`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
      });
      setError("");
      void handleSearch(page);
      setShowUserDetail(false);
    } catch (err: any) {
      setError(err?.message || "Failed to suspend user.");
    }
  };

  const handleUnsuspend = async (userId: string) => {
    try {
      await adminApiRequest(`${API_BASE_ADMIN_USERS}/${userId}/unsuspend`, {
        method: "PUT",
      });
      setError("");
      void handleSearch(page);
      setShowUserDetail(false);
    } catch (err: any) {
      setError(err?.message || "Failed to unsuspend user.");
    }
  };

  const handleFlagUser = async (userId: string, reason: string) => {
    if (!reason.trim()) {
      setError("Flag reason is required");
      return;
    }

    try {
      await adminApiRequest(`${API_BASE_ADMIN_USERS}/${userId}/flag`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
      });
      setError("");
      void handleSearch(page);
      setShowUserDetail(false);
    } catch (err: any) {
      setError(err?.message || "Failed to flag user.");
    }
  };

  const handleClearFlags = async (userId: string) => {
    try {
      await adminApiRequest(`${API_BASE_ADMIN_USERS}/${userId}/clear-flags`, {
        method: "PUT",
      });
      setError("");
      void handleSearch(page);
      setShowUserDetail(false);
    } catch (err: any) {
      setError(err?.message || "Failed to clear flags.");
    }
  };

  const handleUpdateEmail = async (userId: string, email: string) => {
    try {
      await adminApiRequest(`${API_BASE_ADMIN_USERS}/${userId}/email`, {
        method: "PUT",
        body: JSON.stringify({ email }),
      });
      setError("");
      void handleSearch(page);
      setShowUserDetail(false);
    } catch (err: any) {
      setError(err?.message || "Failed to update email.");
    }
  };

  const handleUpdatePhone = async (userId: string, phone: string) => {
    try {
      await adminApiRequest(`${API_BASE_ADMIN_USERS}/${userId}/phone`, {
        method: "PUT",
        body: JSON.stringify({ phone }),
      });
      setError("");
      void handleSearch(page);
      setShowUserDetail(false);
    } catch (err: any) {
      setError(err?.message || "Failed to update phone.");
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await adminApiRequest(`${API_BASE_ADMIN_USERS}/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
      setError("");
      void handleSearch(page);
      setShowUserDetail(false);
    } catch (err: any) {
      setError(err?.message || "Failed to update role.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await adminApiRequest(`${API_BASE_ADMIN_USERS}/${userId}`, {
        method: "DELETE",
      });
      setError("");
      void handleSearch(page);
      setShowUserDetail(false);
    } catch (err: any) {
      setError(err?.message || "Failed to delete user.");
    }
  };

  const resetCreateForm = () => {
    setCreateForm(createDefaultForm());
    setCreateError("");
    setCreateSuccess(null);
  };

  const openCreateModal = () => {
    resetCreateForm();
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetCreateForm();
  };

  const buildCreatePayload = () => {
    const payload: any = {
      accessType: createForm.accessType,
      fullName: createForm.fullName.trim(),
      email: createForm.email.trim() ? createForm.email.trim().toLowerCase() : undefined,
      phone: createForm.phone.trim() || undefined,
    };

    if (!isBulkAccess) return payload;

    payload.bulkProfile = {
      organizationName: createForm.organizationName.trim(),
      institutionType: createForm.institutionType,
      address: {
        county: createForm.county,
        constituency: createForm.constituency || undefined,
        ward: createForm.ward || undefined,
        streetAddress: createForm.streetAddress.trim() || undefined,
      },
      products: createForm.productsText
        .split(/\n|,/g)
        .map((item) => item.trim())
        .filter(Boolean),
      deliveryCoverage: createForm.deliveryCoverage,
      yearsInAgriculture: isBulkSeller ? Number(createForm.yearsInAgriculture) : undefined,
      procurementFrequency: isBulkBuyer ? createForm.procurementFrequency : undefined,
      monthlyVolume: isBulkBuyer ? createForm.monthlyVolume.trim() || undefined : undefined,
      estimatedBudgetPerOrder: isBulkBuyer
        ? createForm.estimatedBudgetPerOrder.trim() || undefined
        : undefined,
      notes: createForm.notes.trim() || undefined,
    };

    return payload;
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError("");
    setCreateSuccess(null);

    if (!createForm.fullName.trim()) {
      setCreateError("Full name is required.");
      return;
    }

    if (!createForm.email.trim() && !createForm.phone.trim()) {
      setCreateError("Email or phone number is required.");
      return;
    }

    if (isBulkAccess) {
      if (!createForm.phone.trim()) {
        setCreateError("Phone number is required for bulk accounts.");
        return;
      }
      if (!createForm.organizationName.trim()) {
        setCreateError("Institution or business name is required.");
        return;
      }
      if (!createForm.county) {
        setCreateError("County is required for bulk accounts.");
        return;
      }
      if (!createForm.productsText.trim()) {
        setCreateError("Add at least one product.");
        return;
      }
      if (isBulkSeller && !createForm.yearsInAgriculture.trim()) {
        setCreateError("Years in agriculture is required for bulk sellers.");
        return;
      }
    }

    try {
      setCreateSubmitting(true);
      const response = (await adminApiRequest(API_ENDPOINTS.admin.users.create, {
        method: "POST",
        body: JSON.stringify(buildCreatePayload()),
      })) as CreateUserResponse;

      const setupUrl = response.data?.setupUrl || "";
      setCreateSuccess({
        fullName: response.data?.user?.fullName || createForm.fullName.trim(),
        accessType: response.data?.accessType || createForm.accessType,
        setupUrl,
        expiresAt: response.data?.expiresAt,
      });
      void handleSearch(1);
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create user.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const copySetupLink = async (setupUrl: string) => {
    try {
      await navigator.clipboard.writeText(setupUrl);
    } catch {
      setCreateError("Could not copy the setup link. Copy it manually instead.");
    }
  };

  return (
    <div className="ui-page-shell">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="ui-card rounded-[2rem] border border-[#dccbbd] bg-white p-6 shadow-[0_24px_70px_-50px_rgba(88,41,19,0.45)] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e8d8cb] bg-[#fbf4ee] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#8f5135]">
                Admin console
              </div>
              <div>
                <h1 className="font-display text-3xl text-[#1f160f] sm:text-4xl">User management</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
                  Search, manage, and onboard users. Bulk buyer and bulk seller setup expands
                  dynamically so admin only sees the fields that matter.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="ui-btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
            >
              <UserPlus className="h-4 w-4" />
              Register user
            </button>
          </div>
        </section>

        <section className="ui-card rounded-[1.75rem] border border-[#e5d5c8] bg-white p-5 shadow-[0_20px_60px_-48px_rgba(88,41,19,0.4)] sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_0.8fr_auto] lg:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Search by name, email, or phone
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleSearch(1);
                  }}
                  placeholder="Search users..."
                  className="w-full rounded-2xl border border-[#d8c8bc] bg-white px-11 py-3 text-sm text-stone-800 outline-none transition focus:border-[#8f5135] focus:ring-2 focus:ring-[#ead6c5]"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-2xl border border-[#d8c8bc] bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-[#8f5135] focus:ring-2 focus:ring-[#ead6c5]"
              >
                <option value="">All users</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="suspended">Suspended</option>
                <option value="flagged">Flagged for fraud</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => void handleSearch(1)}
              disabled={loading}
              className="ui-btn-secondary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search className="h-4 w-4" />
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="ui-card overflow-hidden rounded-[1.75rem] border border-[#e5d5c8] bg-white shadow-[0_20px_60px_-48px_rgba(88,41,19,0.4)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#efe3d8]">
              <thead className="bg-[#fbf6f1] text-left text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4">Flags</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3e8dd] bg-white text-sm text-stone-700">
                {users.map((user) => (
                  <tr key={user._id} className="transition hover:bg-[#fdf9f6]">
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/users/${user._id}`)}
                        className="text-left"
                      >
                        <div className="font-semibold text-[#1f160f] transition hover:text-[#8f5135]">
                          {user.fullName}
                        </div>
                        <div className="mt-1 text-xs font-medium text-[#8f5135]">Open profile</div>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div>{user.email || "No email"}</div>
                      <div className="mt-1 text-xs text-stone-500">{user.phone || "No phone"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full border border-[#eadccf] bg-[#fbf7f2] px-3 py-1 text-xs font-semibold text-[#8f5135]">
                        {userTypeLabel(user)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          user.accountStatus === "suspended"
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {user.accountStatus === "suspended" ? (
                          <>
                            <Lock className="h-3.5 w-3.5" />
                            Suspended
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Active
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.verification?.idVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700">
                          <AlertTriangle className="h-4 w-4" />
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.fraudFlags && user.fraudFlags > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          <Flag className="h-3.5 w-3.5" />
                          {user.fraudFlags}
                        </span>
                      ) : (
                        <span className="text-stone-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDetail(true);
                        }}
                        className="text-sm font-semibold text-[#8f5135] transition hover:text-[#6f3d27]"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && !loading ? (
            <div className="px-6 py-12 text-center text-sm text-stone-500">
              No users found. Adjust your filters and try again.
            </div>
          ) : null}
        </section>
        {total > 20 ? (
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => void handleSearch(Math.max(1, page - 1))}
              disabled={page === 1}
              className="ui-btn-secondary rounded-2xl px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <div className="rounded-2xl border border-[#e7d7ca] bg-white px-4 py-2 text-sm text-stone-600">
              Page {page}
            </div>
            <button
              type="button"
              onClick={() => void handleSearch(page + 1)}
              disabled={page * 20 >= total}
              className="ui-btn-secondary rounded-2xl px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      {showUserDetail && selectedUser ? (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowUserDetail(false);
            setSelectedUser(null);
          }}
          onSuspend={handleSuspend}
          onUnsuspend={handleUnsuspend}
          onFlag={handleFlagUser}
          onClearFlags={handleClearFlags}
          onUpdateEmail={handleUpdateEmail}
          onUpdatePhone={handleUpdatePhone}
          onUpdateRole={handleUpdateRole}
          onDelete={handleDeleteUser}
        />
      ) : null}

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-[#ddcdbf] bg-white shadow-[0_32px_90px_-50px_rgba(15,23,42,0.55)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#efe2d6] bg-white/95 px-6 py-5 backdrop-blur">
              <div>
                <h2 className="font-display text-2xl text-[#1f160f]">Register a user</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Admin can create a user, assign access, and send the setup link immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eadccf] text-stone-500 transition hover:bg-[#fbf7f2] hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[0.88fr_1.12fr]">
              <aside className="space-y-4 rounded-[1.75rem] border border-[#eadccf] bg-[#fbf7f2] p-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e8d8cb] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8f5135]">
                  Dynamic setup
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1f160f]">Access type drives the form</h3>
                  <p className="mt-2 text-sm leading-7 text-stone-600">
                    Regular users stay simple. Bulk buyers and bulk sellers expand to collect
                    institution, location, products, and the role-specific details already used in
                    the bulk workflow.
                  </p>
                </div>
                <div className="space-y-3">
                  <AccessOptionCard
                    active={createForm.accessType === "regular"}
                    label="Regular user"
                    description="Name, email, and phone when available."
                    onClick={() => setCreateForm((current) => ({ ...current, accessType: "regular" }))}
                  />
                  <AccessOptionCard
                    active={createForm.accessType === "bulk_buyer"}
                    label="Bulk buyer"
                    description="Institution details, demand profile, and procurement signals."
                    onClick={() => setCreateForm((current) => ({ ...current, accessType: "bulk_buyer" }))}
                  />
                  <AccessOptionCard
                    active={createForm.accessType === "bulk_seller"}
                    label="Bulk seller"
                    description="Institution details, products, delivery coverage, and years in agriculture."
                    onClick={() => setCreateForm((current) => ({ ...current, accessType: "bulk_seller" }))}
                  />
                </div>
                {createSuccess ? (
                  <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <div className="font-semibold">Congratulations, they are in.</div>
                    <div className="mt-1">
                      {createSuccess.fullName} is set up as {accessTypeLabel(createSuccess.accessType).toLowerCase()}.
                    </div>
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-white px-3 py-3 text-xs break-all text-stone-700">
                      {createSuccess.setupUrl}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void copySetupLink(createSuccess.setupUrl)}
                        className="ui-btn-secondary inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy setup link
                      </button>
                      <button
                        type="button"
                        onClick={resetCreateForm}
                        className="ui-btn-secondary inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Register another
                      </button>
                    </div>
                  </div>
                ) : null}
              </aside>

              <form onSubmit={handleCreateUser} className="space-y-6">
                {createError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {createError}
                  </div>
                ) : null}

                <section className="rounded-[1.5rem] border border-[#eadccf] bg-white p-5">
                  <h3 className="text-base font-semibold text-[#1f160f]">Core details</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <FormField label="Full name" required>
                      <input
                        value={createForm.fullName}
                        onChange={(event) => setCreateForm((current) => ({ ...current, fullName: event.target.value }))}
                        className={INPUT_CLASS}
                        placeholder="Full name"
                      />
                    </FormField>
                    <FormField label={createForm.phone.trim() ? "Email (optional)" : "Email"} required={!createForm.phone.trim()}>
                      <input
                        value={createForm.email}
                        onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
                        className={INPUT_CLASS}
                        placeholder="name@example.com"
                        type="email"
                      />
                    </FormField>
                    <FormField label={isBulkAccess ? "Phone number" : createForm.email.trim() ? "Phone number (optional)" : "Phone number"} required={isBulkAccess}>
                      <input
                        value={createForm.phone}
                        onChange={(event) => setCreateForm((current) => ({ ...current, phone: event.target.value }))}
                        className={INPUT_CLASS}
                        placeholder="07... or +254..."
                      />
                    </FormField>
                    <FormField label="Access type">
                      <input value={accessTypeLabel(createForm.accessType)} className={`${INPUT_CLASS} bg-[#fbf7f2]`} readOnly />
                    </FormField>
                  </div>
                </section>
                {isBulkAccess ? (
                  <>
                    <section className="rounded-[1.5rem] border border-[#eadccf] bg-white p-5">
                      <h3 className="text-base font-semibold text-[#1f160f]">Institution details</h3>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <FormField label="Institution or business name" required>
                          <input
                            value={createForm.organizationName}
                            onChange={(event) => setCreateForm((current) => ({ ...current, organizationName: event.target.value }))}
                            className={INPUT_CLASS}
                            placeholder="Institution or business name"
                          />
                        </FormField>
                        <FormField label="Institution type" required>
                          <select
                            value={createForm.institutionType}
                            onChange={(event) =>
                              setCreateForm((current) => ({
                                ...current,
                                institutionType: event.target.value as InstitutionType,
                              }))
                            }
                            className={INPUT_CLASS}
                          >
                            {INSTITUTION_TYPES.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FormField>
                      </div>
                    </section>

                    <section className="rounded-[1.5rem] border border-[#eadccf] bg-white p-5">
                      <h3 className="text-base font-semibold text-[#1f160f]">Location</h3>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <FormField label="County" required>
                          <select
                            value={createForm.county}
                            onChange={(event) =>
                              setCreateForm((current) => ({
                                ...current,
                                county: event.target.value,
                                constituency: "",
                                ward: "",
                              }))
                            }
                            className={INPUT_CLASS}
                          >
                            <option value="">Select county</option>
                            {kenyaCounties.map((county) => (
                              <option key={county.name} value={county.name}>
                                {county.name}
                              </option>
                            ))}
                          </select>
                        </FormField>
                        <FormField label="Constituency">
                          <select
                            value={createForm.constituency}
                            onChange={(event) =>
                              setCreateForm((current) => ({
                                ...current,
                                constituency: event.target.value,
                                ward: "",
                              }))
                            }
                            className={INPUT_CLASS}
                            disabled={!createForm.county}
                          >
                            <option value="">Select constituency</option>
                            {constituencyOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FormField>
                        <FormField label="Ward">
                          <select
                            value={createForm.ward}
                            onChange={(event) => setCreateForm((current) => ({ ...current, ward: event.target.value }))}
                            className={INPUT_CLASS}
                            disabled={!createForm.constituency}
                          >
                            <option value="">Select ward</option>
                            {wardOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FormField>
                        <FormField label="Street address">
                          <input
                            value={createForm.streetAddress}
                            onChange={(event) => setCreateForm((current) => ({ ...current, streetAddress: event.target.value }))}
                            className={INPUT_CLASS}
                            placeholder="Street, market, or landmark"
                          />
                        </FormField>
                      </div>
                    </section>

                    <section className="rounded-[1.5rem] border border-[#eadccf] bg-white p-5">
                      <h3 className="text-base font-semibold text-[#1f160f]">Trade profile</h3>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <FormField
                          label={isBulkBuyer ? "Products needed" : "Products sold"}
                          required
                          className="md:col-span-2"
                        >
                          <textarea
                            value={createForm.productsText}
                            onChange={(event) => setCreateForm((current) => ({ ...current, productsText: event.target.value }))}
                            className={`${INPUT_CLASS} min-h-[110px]`}
                            placeholder={
                              isBulkBuyer
                                ? "Tomatoes, onions, eggs, maize"
                                : "Tomatoes, onions, eggs, dry maize"
                            }
                          />
                        </FormField>
                        <FormField label="Delivery coverage" required>
                          <select
                            value={createForm.deliveryCoverage}
                            onChange={(event) =>
                              setCreateForm((current) => ({
                                ...current,
                                deliveryCoverage: event.target.value as DeliveryCoverage,
                              }))
                            }
                            className={INPUT_CLASS}
                          >
                            {DELIVERY_COVERAGE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FormField>
                        {isBulkSeller ? (
                          <FormField label="Years in agriculture" required>
                            <input
                              type="number"
                              min="0"
                              value={createForm.yearsInAgriculture}
                              onChange={(event) =>
                                setCreateForm((current) => ({
                                  ...current,
                                  yearsInAgriculture: event.target.value,
                                }))
                              }
                              className={INPUT_CLASS}
                              placeholder="e.g. 5"
                            />
                          </FormField>
                        ) : null}
                        {isBulkBuyer ? (
                          <>
                            <FormField label="Procurement frequency">
                              <select
                                value={createForm.procurementFrequency}
                                onChange={(event) =>
                                  setCreateForm((current) => ({
                                    ...current,
                                    procurementFrequency: event.target.value as ProcurementFrequency,
                                  }))
                                }
                                className={INPUT_CLASS}
                              >
                                {PROCUREMENT_FREQUENCY_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </FormField>
                            <FormField label="Monthly volume">
                              <input
                                value={createForm.monthlyVolume}
                                onChange={(event) => setCreateForm((current) => ({ ...current, monthlyVolume: event.target.value }))}
                                className={INPUT_CLASS}
                                placeholder="e.g. 2 tonnes"
                              />
                            </FormField>
                            <FormField label="Estimated budget per order">
                              <input
                                value={createForm.estimatedBudgetPerOrder}
                                onChange={(event) =>
                                  setCreateForm((current) => ({
                                    ...current,
                                    estimatedBudgetPerOrder: event.target.value,
                                  }))
                                }
                                className={INPUT_CLASS}
                                placeholder="e.g. KES 120,000"
                              />
                            </FormField>
                          </>
                        ) : null}
                        <FormField label="Notes" className="md:col-span-2">
                          <textarea
                            value={createForm.notes}
                            onChange={(event) => setCreateForm((current) => ({ ...current, notes: event.target.value }))}
                            className={`${INPUT_CLASS} min-h-[110px]`}
                            placeholder="Any extra context the team should keep on record"
                          />
                        </FormField>
                      </div>
                    </section>
                  </>
                ) : (
                  <section className="rounded-[1.5rem] border border-[#eadccf] bg-[#fbf7f2] p-5 text-sm leading-7 text-stone-600">
                    Regular users stay simple. Admin only needs name and either an email or phone number.
                    If email is provided, a setup link is sent so the user can set their password. Phone-only users can log in with their number.
                  </section>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#f0e4da] pt-2">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="ui-btn-secondary rounded-2xl px-5 py-3 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createSubmitting}
                    className="ui-btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    {createSubmitting ? "Creating user..." : "Create and send setup link"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const FormField = ({
  label,
  children,
  required,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) => (
  <label className={`block ${className}`}>
    <span className="mb-2 block text-sm font-medium text-stone-700">
      {label}
      {required ? <span className="ml-1 text-[#8f5135]">*</span> : null}
    </span>
    {children}
  </label>
);

const AccessOptionCard = ({
  active,
  label,
  description,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-[1.35rem] border px-4 py-4 text-left transition ${
      active
        ? "border-[#8f5135] bg-white text-[#1f160f] shadow-[0_18px_40px_-32px_rgba(88,41,19,0.4)]"
        : "border-[#eadccf] bg-[#fffaf6] text-stone-600 hover:border-[#d9c4b3] hover:bg-white"
    }`}
  >
    <div className="font-semibold">{label}</div>
    <div className="mt-1 text-sm leading-6">{description}</div>
  </button>
);

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
  onSuspend: (userId: string, reason: string) => void;
  onUnsuspend: (userId: string) => void;
  onFlag: (userId: string, reason: string) => void;
  onClearFlags: (userId: string) => void;
  onUpdateEmail: (userId: string, email: string) => void;
  onUpdatePhone: (userId: string, phone: string) => void;
  onUpdateRole: (userId: string, role: string) => void;
  onDelete: (userId: string) => void;
}

const ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "moderator", label: "Moderator" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  onClose,
  onSuspend,
  onUnsuspend,
  onFlag,
  onClearFlags,
  onUpdateEmail,
  onUpdatePhone,
  onUpdateRole,
  onDelete,
}) => {
  const [suspendReason, setSuspendReason] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [newEmail, setNewEmail] = useState(user.email || "");
  const [newPhone, setNewPhone] = useState(user.phone || "");
  const [newRole, setNewRole] = useState(user.role || "user");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [action, setAction] = useState<"view" | "suspend" | "flag" | "edit-email" | "edit-phone" | "edit-role" | "delete">("view");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-[#ddcdbf] bg-white shadow-[0_32px_90px_-50px_rgba(15,23,42,0.55)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#efe2d6] bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-2xl font-semibold text-[#1f160f]">{user.fullName}</h2>
            <p className="mt-1 text-sm text-stone-500">Admin actions and account status.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eadccf] text-stone-500 transition hover:bg-[#fbf7f2] hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoTile label="Email" value={user.email || "No email"} />
            <InfoTile label="Phone" value={user.phone || "No phone"} />
            <InfoTile label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
            <InfoTile
              label="Verification"
              value={user.verification?.idVerified ? "ID verified" : "Not verified"}
              valueClassName={user.verification?.idVerified ? "text-emerald-700" : "text-amber-700"}
            />
          </div>

          {user.fraudFlags && user.fraudFlags > 0 ? (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              <div className="font-semibold">Fraud flags: {user.fraudFlags}</div>
              <div className="mt-1">This user has been flagged for suspicious activity.</div>
            </div>
          ) : null}

          {action === "view" ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setAction("edit-email")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                >
                  <Pencil className="h-4 w-4" />
                  Edit email
                </button>
                <button
                  type="button"
                  onClick={() => setAction("edit-phone")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                >
                  <Pencil className="h-4 w-4" />
                  Edit phone
                </button>
                <button
                  type="button"
                  onClick={() => setAction("edit-role")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  <Shield className="h-4 w-4" />
                  Change role
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setAction("suspend")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  <Lock className="h-4 w-4" />
                  {user.accountStatus === "suspended" ? "Unsuspend" : "Suspend account"}
                </button>
                <button
                  type="button"
                  onClick={() => setAction("flag")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                >
                  <Flag className="h-4 w-4" />
                  Flag for fraud
                </button>
                {user.fraudFlags && user.fraudFlags > 0 ? (
                  <button
                    type="button"
                    onClick={() => onClearFlags(user._id)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Clear flags
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setAction("delete")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Permanently delete account
              </button>
            </div>
          ) : null}

          {action === "suspend" ? (
            <div className="space-y-3 rounded-[1.5rem] border border-[#eadccf] bg-[#fbf7f2] p-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Suspension reason</span>
                <textarea
                  value={suspendReason}
                  onChange={(event) => setSuspendReason(event.target.value)}
                  placeholder="Describe why this account is being suspended..."
                  className={`${INPUT_CLASS} min-h-[110px]`}
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (user.accountStatus === "suspended") {
                      onUnsuspend(user._id);
                    } else {
                      onSuspend(user._id, suspendReason);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  {user.accountStatus === "suspended" ? "Confirm unsuspend" : "Confirm suspension"}
                </button>
                <button
                  type="button"
                  onClick={() => setAction("view")}
                  className="ui-btn-secondary rounded-2xl px-5 py-3 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {action === "flag" ? (
            <div className="space-y-3 rounded-[1.5rem] border border-[#eadccf] bg-[#fbf7f2] p-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Flag reason</span>
                <textarea
                  value={flagReason}
                  onChange={(event) => setFlagReason(event.target.value)}
                  placeholder="Describe the fraud concern..."
                  className={`${INPUT_CLASS} min-h-[110px]`}
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onFlag(user._id, flagReason)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
                >
                  Confirm flag
                </button>
                <button
                  type="button"
                  onClick={() => setAction("view")}
                  className="ui-btn-secondary rounded-2xl px-5 py-3 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {action === "edit-email" ? (
            <div className="space-y-3 rounded-[1.5rem] border border-[#eadccf] bg-[#fbf7f2] p-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">New email address</span>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="new@email.com"
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateEmail(user._id, newEmail)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#8f5135] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6f3d27]"
                >
                  Save email
                </button>
                <button type="button" onClick={() => setAction("view")} className="ui-btn-secondary rounded-2xl px-5 py-3 text-sm font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {action === "edit-phone" ? (
            <div className="space-y-3 rounded-[1.5rem] border border-[#eadccf] bg-[#fbf7f2] p-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">New phone number</span>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(event) => setNewPhone(event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="07XXXXXXXX"
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onUpdatePhone(user._id, newPhone)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#8f5135] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6f3d27]"
                >
                  Save phone
                </button>
                <button type="button" onClick={() => setAction("view")} className="ui-btn-secondary rounded-2xl px-5 py-3 text-sm font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {action === "edit-role" ? (
            <div className="space-y-3 rounded-[1.5rem] border border-[#eadccf] bg-[#fbf7f2] p-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Role</span>
                <select
                  value={newRole}
                  onChange={(event) => setNewRole(event.target.value)}
                  className={INPUT_CLASS}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateRole(user._id, newRole)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Save role
                </button>
                <button type="button" onClick={() => setAction("view")} className="ui-btn-secondary rounded-2xl px-5 py-3 text-sm font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {action === "delete" ? (
            <div className="space-y-3 rounded-[1.5rem] border border-red-200 bg-red-50 p-5">
              <div className="text-sm font-semibold text-red-700">This cannot be undone. The account and all associated data will be permanently removed.</div>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Type <strong>{user.fullName}</strong> to confirm</span>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(event) => setDeleteConfirm(event.target.value)}
                  className={INPUT_CLASS}
                  placeholder={user.fullName}
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={deleteConfirm !== user.fullName}
                  onClick={() => onDelete(user._id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Permanently delete
                </button>
                <button type="button" onClick={() => setAction("view")} className="ui-btn-secondary rounded-2xl px-5 py-3 text-sm font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const InfoTile = ({
  label,
  value,
  valueClassName = "text-stone-800",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) => (
  <div className="rounded-[1.4rem] border border-[#eadccf] bg-[#fbf7f2] px-4 py-4">
    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</div>
    <div className={`mt-2 text-sm font-semibold ${valueClassName}`}>{value}</div>
  </div>
);

export default AdminUserManagement;
