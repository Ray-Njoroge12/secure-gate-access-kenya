import { useState } from "react";
import { Select } from "@/components/ui/select";

const SecurityDashboard = () => {
  const [language, setLanguage] = useState("en");

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4">
        <label className="block mb-1 font-medium">{language === "sw" ? "Chagua Lugha" : "Select Language"}</label>
        <Select value={language} onValueChange={setLanguage} className="w-40">
          <option value="en">English</option>
          <option value="sw">Kiswahili</option>
        </Select>
      </div>
      <h1 className="text-3xl font-bold mb-6">{language === "sw" ? "Dashibodi ya Ulinzi" : "Security Dashboard"}</h1>
      {/* ...localize other major UI elements using language state... */}
    </div>
  );
};

export default SecurityDashboard;