// "use client";

// import { Check } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { cn } from "@/lib/utils";
// import { useState } from "react";
// import { PaymentMethodModal } from "@/components/shared/PaymentMethodModal";

// interface Feature {
//   text: string;
//   included: boolean;
// }

// interface Plan {
//   name: string;
//   priceMonthly?: string;
//   priceAnnual?: string;
//   description?: string;
//   features: Feature[];
//   buttonText: string;
//   highlighted?: boolean;
//   planId: string;
// }

// const pricingPlans: Plan[] = [
//   {
//     name: "Pay as You Go",
//     description: "$99.99 per Job Advert (30 Days Post)",
//     features: [
//       { text: "First post free!", included: true },
//       { text: "Recruiter's 180-Second Elevator Video Pitch", included: true },
//       {
//         text: "Enjoy seamless job posting amendments/closure/reopening",
//         included: true,
//       },
//       { text: "Schedule your job post", included: true },
//       { text: "Initial video screening of job applicants", included: true },
//       {
//         text: "View elevator video pitches of all job applicants",
//         included: true,
//       },
//       { text: "Update job applicants promptly", included: true },
//     ],
//     buttonText: "Sign up",
//     planId: "pay_as_you_go"
//   },
//   {
//     name: "Basic Plan",
//     priceMonthly: "$190.99",
//     priceAnnual: "$2,100.89",
//     features: [
//       { text: "First post free!", included: true },
//       { text: "Recruiter's 180-Second Elevator Video Pitch", included: true },
//       { text: "Up to 24 job posts per annual cycle", included: true },
//       {
//         text: "Enjoy seamless job posting amendments/closure/reopening",
//         included: true,
//       },
//       { text: "Schedule your job post", included: true },
//       { text: "Initial video screening of job applicants", included: true },
//       {
//         text: "View elevator video pitches of all job applicants",
//         included: true,
//       },
//       { text: "Update job applicants promptly", included: true },
//       { text: "12 months for the price of 11 Months!", included: true },
//       {
//         text: "Enjoy seamless job posting amendments/closure/reopening",
//         included: true,
//       },
//     ],
//     buttonText: "Sign up to basic",
//     planId: "basic_plan"
//   },
//   {
//     name: "Bronze Plan",
//     priceMonthly: "$270.99",
//     priceAnnual: "$2,969.99",
//     features: [
//       { text: "First post free!", included: true },
//       { text: "Recruiter's 180-Second Elevator Video Pitch", included: true },
//       { text: "Up to 36 job posts per annual cycle", included: true },
//       {
//         text: "Enjoy seamless job posting amendment/closure/reopening",
//         included: true,
//       },
//       { text: "Schedule your job post", included: true },
//       { text: "Initial video screening of job applicants", included: true },
//       {
//         text: "View elevator video pitches of all job applicants",
//         included: true,
//       },
//       { text: "Update job applicants promptly", included: true },
//       { text: "12 months for the price of 11 Months!", included: true },
//     ],
//     buttonText: "Sign up to bronze",
//     planId: "bronze_plan"
//   },
//   {
//     name: "Silver Plan",
//     priceMonthly: "$352.99",
//     priceAnnual: "$3,882.89",
//     features: [
//       { text: "First post free!", included: true },
//       { text: "Recruiter's 180-Second Elevator Video Pitch", included: true },
//       { text: "Up to 48 job posts per annual cycle", included: true },
//       {
//         text: "Enjoy seamless job posting amendment/closure/reopening",
//         included: true,
//       },
//       { text: "Schedule your job post", included: true },
//       { text: "Initial video screening of job applicants", included: true },
//       {
//         text: "View elevator video pitches of all job applicants",
//         included: true,
//       },
//       { text: "Update job applicants promptly", included: true },
//       { text: "12 months for the price of 11 Months!", included: true },
//     ],
//     buttonText: "Sign up to silver",
//     planId: "silver_plan"
//   },
//   {
//     name: "Gold Plan",
//     priceMonthly: "$425.99",
//     priceAnnual: "$4,685.99",
//     features: [
//       { text: "First post free!", included: true },
//       { text: "Recruiter's 180-Second Elevator Video Pitch", included: true },
//       { text: "Up to 60 job posts per annual cycle", included: true },
//       {
//         text: "Enjoy seamless job posting amendment/closure/reopening",
//         included: true,
//       },
//       { text: "Schedule your job post", included: true },
//       { text: "Initial video screening of job applicants", included: true },
//       {
//         text: "View elevator video pitches of all job applicants",
//         included: true,
//       },
//       { text: "Update job applicants promptly", included: true },
//       { text: "12 months for the price of 11 Months!", included: true },
//     ],
//     buttonText: "Sign up to gold",
//     planId: "gold_plan"
//   },
//   {
//     name: "Platinum Plan",
//     priceMonthly: "$999.99",
//     priceAnnual: "$10,999.89",
//     features: [
//       { text: "First post free!", included: true },
//       { text: "Recruiter's 180-Second Elevator Video Pitch", included: true },
//       { text: "Unlimited job posts per annual cycle", included: true },
//       {
//         text: "Enjoy seamless job posting amendment/closure/reopening",
//         included: true,
//       },
//       { text: "Schedule your job post", included: true },
//       { text: "Initial video screening of job applicants", included: true },
//       {
//         text: "View elevator video pitches of all job applicants",
//         included: true,
//       },
//       { text: "Update job applicants promptly", included: true },
//       { text: "12 months for the price of 11 Months!", included: true },
//     ],
//     buttonText: "Sign up to platinum",
//     planId: "platinum_plan"
//   },
// ];

// export default function PricingPage() {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
//   const [showPlanOptions, setShowPlanOptions] = useState(false);
//   const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

//   const handlePlanSelect = (plan: Plan) => {
//     if (!plan.priceMonthly) {
//       // For Pay as You Go - extract price keeping the decimal point
//       const priceMatch = plan.description?.match(/\$(\d+\.\d{2})/);
//       setSelectedPrice(priceMatch ? priceMatch[1] : "99.99");
//       setSelectedPlan(plan);
//       setIsModalOpen(true);
//     } else {
//       setSelectedPlan(plan);
//       setShowPlanOptions(true);
//     }
//   };

//   const handlePaymentOptionSelect = (isMonthly: boolean) => {
//     if (selectedPlan) {
//       // Extract price keeping the decimal point
//       const priceStr = isMonthly ? selectedPlan.priceMonthly : selectedPlan.priceAnnual;
//       const priceMatch = priceStr?.match(/\$?(\d+,\d{3}\.\d{2}|\d+\.\d{2})/);
//       const priceValue = priceMatch ? priceMatch[1].replace(/,/g, '') : "0.00";
//       setSelectedPrice(priceValue);
//       setIsModalOpen(true);
//       setShowPlanOptions(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
//       {showPlanOptions && selectedPlan && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//           <div className="rounded-lg bg-white p-6 shadow-xl">
//             <h3 className="mb-4 text-xl font-bold">
//               Select Payment Option for {selectedPlan.name}
//             </h3>
//             <div className="space-y-3">
//               <Button
//                 className="w-full bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90"
//                 onClick={() => handlePaymentOptionSelect(true)}
//               >
//                 Monthly: {selectedPlan.priceMonthly}
//               </Button>
//               <Button
//                 className="w-full bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90"
//                 onClick={() => handlePaymentOptionSelect(false)}
//               >
//                 Annual: {selectedPlan.priceAnnual}
//               </Button>
//               <Button
//                 variant="ghost"
//                 className="w-full"
//                 onClick={() => setShowPlanOptions(false)}
//               >
//                 Cancel
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//       <div>
//         <div className="mb-12 mt-[60px] text-center">
//           <h1 className="mb-2 text-4xl font-bold text-gray-800">
//             Company Price List
//           </h1>
//           <p className="text-xl text-gray-600">For Elevator Pitch</p>
//         </div>
//         <div className="grid w-full max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
//           {pricingPlans.map((plan, index) => (
//             <Card
//               key={index}
//               className={cn(
//                 "flex flex-col justify-between overflow-hidden border-none rounded-lg  shadow-sm",
//                 plan.highlighted && "border-blue-500 ring-2 ring-blue-500"
//               )}
//             >
//               <CardHeader className="space-y-2 p-6">
//                 <CardTitle className="font-midium text-base text-[#2B7FD0]">
//                   {plan.name.toUpperCase()}
//                 </CardTitle>
//                 {plan.description ? (
//                   <CardDescription className="text-[32px] font-bold text-[#282828]">
//                     {plan.description}
//                   </CardDescription>
//                 ) : (
//                   <div className="">
//                     <p className="text-[32px] font-bold text-[#282828]">
//                       {plan.priceMonthly}{" "}
//                       <span className="text-[32px] font-bold text-[#282828]">
//                         per month
//                       </span>
//                     </p>
//                     <p className="text-[32px] font-bold text-[#282828]">
//                       {plan.priceAnnual}{" "}
//                       <span className="text-[32px] font-bold text-[#282828]">
//                         per annum
//                       </span>
//                     </p>
//                   </div>
//                 )}
//               </CardHeader>
//               <CardContent className="flex-grow space-y-4 p-6 pt-0">
//                 <h3 className="font-midium text-base text-[#8593A3]">
//                   What you will get
//                 </h3>
//                 <ul className="space-y-2 text-[#343434]">
//                   {plan.features.map((feature, featureIndex) => (
//                     <li key={featureIndex} className="flex items-start gap-2">
//                       <div className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#2B7FD0]">
//                         <Check className="h-5 w-5 flex-shrink-0 text-white" />
//                       </div>
//                       <span className="text-base text-[#343434] font-medium">{feature.text}</span>
//                     </li>
//                   ))}
//                 </ul>
//               </CardContent>
//               <CardFooter className="p-6 pt-0">
//                 <Button
//                   className="h-[58px] w-full rounded-[80px] text-lg font-semibold text-[#8593A3]"
//                   variant={plan.highlighted ? "default" : "outline"}
//                   onClick={() => handlePlanSelect(plan)}
//                 >
//                   {plan.buttonText}
//                 </Button>
//               </CardFooter>
//             </Card>
//           ))}
//         </div>
//       </div>

//       <PaymentMethodModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         price={selectedPrice || ""}
//         // planId={selectedPlan?.planId || ""}
//       />
//     </div>
//   );
// } 


"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { PaymentMethodModal } from "@/components/shared/PaymentMethodModal";
import { useQuery } from "@tanstack/react-query";

interface Feature {
  text: string;
  included: boolean;
}

interface Plan {
  _id: string;
  title: string;
  description: string;
  price: number;
  features: string[];
  for: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Plan[];
}

const fetchCompanyPlans = async (): Promise<Plan[]> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data: ApiResponse = await response.json();
  return data.data.filter((plan) => plan.for === "company");
};

const transformApiPlanToLocalPlan = (apiPlan: Plan): {
  name: string;
  description: string;
  features: Feature[];
  buttonText: string;
  planId: string;
} => {
  return {
    name: apiPlan.title,
    description: `$${apiPlan.price} per Job Advert (30 Days Post)`,
    features: apiPlan.features.map(feature => ({
      text: feature,
      included: true
    })),
    buttonText: "Sign up to  bronze",
    planId: apiPlan._id
  };
};

export default function PricingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [showPlanOptions, setShowPlanOptions] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ReturnType<typeof transformApiPlanToLocalPlan> | null>(null);

  const { data: apiPlans, isLoading, error } = useQuery({
    queryKey: ["companyPlans"],
    queryFn: fetchCompanyPlans
  });

  const handlePlanSelect = (plan: ReturnType<typeof transformApiPlanToLocalPlan>) => {
    // Extract price keeping the decimal point
    const priceMatch = plan.description.match(/\$(\d+\.\d{2}|\d+)/);
    setSelectedPrice(priceMatch ? priceMatch[1] : "0.00");
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Loading plans...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-500">Error loading plans</h1>
          <p className="text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!apiPlans || apiPlans.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">No company plans available</h1>
        </div>
      </div>
    );
  }

  const pricingPlans = apiPlans.map(transformApiPlanToLocalPlan);

  return (
    <div className="flex items-center justify-center bg-gray-50 p-4">
      <div>
        <div className="mb-12 mt-[60px] text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">
            Company Price List
          </h1>
          <p className="text-xl text-gray-600">For Elevator Pitch</p>
        </div>
        <div className="grid w-full container grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 py-4">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              className={cn(
                "flex flex-col justify-between overflow-hidden border-none rounded-lg shadow-sm",
           
              )}
            >
              <CardHeader className="space-y-2 p-6">
                <CardTitle className="font-midium text-base text-[#2B7FD0]">
                  {plan.name.toUpperCase()}
                </CardTitle>
                <CardDescription className="text-[32px] font-bold text-[#282828]">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4 p-6 pt-0">
                <h3 className="font-midium text-base text-[#8593A3]">
                  What you will get
                </h3>
                <ul className="space-y-2 text-[#343434]">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <div className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#2B7FD0]">
                        <Check className="h-5 w-5 flex-shrink-0 text-white" />
                      </div>
                      <span className="text-base text-[#343434] font-medium">{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button
                  className="h-[58px] w-full rounded-[80px] text-lg font-semibold text-[#8593A3]"
                  variant="outline"
                  onClick={() => handlePlanSelect(plan)}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <PaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        price={selectedPrice || ""}
        planId={selectedPlan?.planId || ""}
      />
    </div>
  );
}