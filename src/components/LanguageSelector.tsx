
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/hooks/use-language";

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/90 border-gray-300 text-gray-700 hover:bg-gray-50 px-3 flex gap-2 shadow-sm"
        >
          <Globe size={14} className="text-gray-600" />
          <span className="font-medium">{language.toUpperCase()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-0 bg-white border border-gray-200 shadow-lg">
        <div className="flex flex-col">
          <Button
            variant={language === "it" ? "default" : "ghost"}
            onClick={() => {
              setLanguage("it");
              setOpen(false);
            }}
            className={`rounded-none justify-start text-sm ${language === "it" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"}`}
          >
            🇮🇹 Italiano
          </Button>
          <Button
            variant={language === "en" ? "default" : "ghost"}
            onClick={() => {
              setLanguage("en");
              setOpen(false);
            }}
            className={`rounded-none justify-start text-sm ${language === "en" ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"}`}
          >
            🇬🇧 English
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LanguageSelector;
