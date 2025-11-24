import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ListProperty from "./ListProperty";
import ListService from "./ListService";
import ListAgrovet from "./ListAgrovet";
import ListProduct from "./ListProduct";

type Category = "land" | "service" | "agrovet" | "product";
type ProductCategory = "produce" | "livestock" | "inputs";

type ListUnifiedProps = {
  initialCategory?: Category;
  initialLandType?: "rental";
  initialServiceType?: "equipment" | "professional_services";
  initialProductCategory?: ProductCategory;
};

const CATEGORY_CARDS: Array<{
  id: Category;
  title: string;
  subtitle: string;
  badge: string;
}> = [
  {
    id: "land",
    title: "Farmland",
    subtitle: "Lease or sell land with boosts, verification, and MPesa billing.",
    badge: "Free 1st listing",
  },
  {
    id: "service",
    title: "Services & Equipment",
    subtitle: "Annual subscription for equipment or pro services with optional boosts.",
    badge: "KSh 599/yr",
  },
  {
    id: "agrovet",
    title: "Agrovets",
    subtitle: "Showcase agro-dealer stock with verification and boosts.",
    badge: "KSh 599/yr",
  },
  {
    id: "product",
    title: "Products & Livestock",
    subtitle: "Sell produce, inputs, or animals with a tiny commission or annual plan.",
    badge: "0.5% or KSh 49",
  },
];

const ListUnified: React.FC<ListUnifiedProps> = ({
  initialCategory = "land",
  initialLandType = "rental",
  initialServiceType = "equipment",
  initialProductCategory,
}) => {
  const [searchParams] = useSearchParams();

  const parseCategory = (value: string | null): Category | undefined => {
    if (value === "land" || value === "service" || value === "agrovet" || value === "product") {
      return value;
    }
    return undefined;
  };

  const parsedCategory = parseCategory(searchParams.get("category")) || initialCategory;
  const parsedLandType = "rental";
  const parsedServiceType =
    (searchParams.get("serviceType") as "equipment" | "professional_services" | null) ||
    initialServiceType;
  const parsedProductCategory =
    (searchParams.get("productType") as ProductCategory | null) ||
    initialProductCategory ||
    "produce";

  const [category, setCategory] = useState<Category>(parsedCategory);
  const [landType] = useState<"rental">(parsedLandType);
  const [serviceType, setServiceType] = useState<
    "equipment" | "professional_services"
  >(parsedServiceType);
  const [productCategory, setProductCategory] = useState<ProductCategory>(parsedProductCategory);

  const activeCard = useMemo(
    () => CATEGORY_CARDS.find((c) => c.id === category),
    [category]
  );

  const renderForm = () => {
    if (category === "land") {
      return (
        <ListProperty
          key={`land-${landType}`}
          initialType={landType}
        />
      );
    }
    if (category === "service") {
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(
              ["equipment", "professional_services"] as Array<
                "equipment" | "professional_services"
              >
            ).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setServiceType(type)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  serviceType === type
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-green-400"
                }`}
              >
                {type === "equipment" ? "Equipment Hire" : "Professional Services"}
              </button>
            ))}
          </div>
          <ListService
            key={`service-${serviceType}`}
            initialServiceType={serviceType}
          />
        </div>
      );
    }
    if (category === "product") {
      return (
        <ListProduct
          key={`product-${productCategory}`}
          initialCategory={productCategory}
        />
      );
    }
    return <ListAgrovet key="agrovet" />;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-3xl bg-white shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-600">
              Unified Listing Desk
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              List land, services, or agrovets from one page
            </h1>
            <p className="text-gray-600">
              Pick what you are listing, and we’ll load the right form, documents, and monetization options.
            </p>
          </div>
          {activeCard && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <p className="font-semibold">{activeCard.title}</p>
              <p className="text-green-700">{activeCard.subtitle}</p>
              <span className="mt-1 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                {activeCard.badge}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {CATEGORY_CARDS.map((card) => {
            const selected = category === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setCategory(card.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-green-600 bg-green-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-green-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-gray-900">{card.title}</p>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    {card.badge}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{card.subtitle}</p>
              </button>
            );
          })}
        </div>

        {category === "land" && (
          <div className="mt-4 flex flex-wrap gap-2">
            {(["sale", "rental"] as Array<"sale" | "rental">).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setLandType(type)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  landType === type
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-400"
                }`}
              >
                {type === "sale" ? "For Sale" : "For Rent/Lease"}
              </button>
            ))}
          </div>
        )}
        {category === "product" && (
          <div className="mt-4 flex flex-wrap gap-2">
            {(["produce", "livestock", "inputs"] as ProductCategory[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setProductCategory(type)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  productCategory === type
                    ? "border-orange-600 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-orange-400"
                }`}
              >
                {type === "produce"
                  ? "Produce"
                  : type === "livestock"
                  ? "Livestock"
                  : "Inputs"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white shadow-sm p-3 md:p-4">
        {renderForm()}
      </div>
    </div>
  );
};

export default ListUnified;
