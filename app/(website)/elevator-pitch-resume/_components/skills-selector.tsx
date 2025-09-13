"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { FormLabel } from "@/components/ui/form";

interface Skill {
  _id: string;
  name: string;
  categoryIcon: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface SkillsSelectorProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  baseUrl: string;
}

export function SkillsSelector({
  selectedSkills,
  onSkillsChange,
  baseUrl,
}: SkillsSelectorProps) {
  const [skillSearch, setSkillSearch] = useState("");
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch skills from API
  useEffect(() => {
    const fetchSkills = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/skill`
        );
        const data = await response.json();
        if (data.success) {
          setAllSkills(data.data);
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkills();
  }, [baseUrl]);

  // Filter skills based on search
  useEffect(() => {
    if (skillSearch.trim()) {
      const filtered = allSkills.filter(
        (skill) =>
          skill.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
          !selectedSkills.includes(skill.name)
      );
      setFilteredSkills(filtered);
    } else {
      setFilteredSkills([]);
    }
  }, [skillSearch, allSkills, selectedSkills]);

  const addSkill = (skillName: string) => {
    if (!selectedSkills.includes(skillName)) {
      onSkillsChange([...selectedSkills, skillName]);
    }
    setSkillSearch("");
  };

  const removeSkill = (skillName: string) => {
    onSkillsChange(selectedSkills.filter((skill) => skill !== skillName));
  };

  return (
    <div className="space-y-4">
      <FormLabel>Skills*</FormLabel>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search and add skills (e.g., Java, PHP, React...)"
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {isLoading && skillSearch && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">
                Loading skills...
              </span>
            </div>
          </div>
        )}
        {filteredSkills.length > 0 && !isLoading && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
            {filteredSkills.slice(0, 10).map((skill) => (
              <button
                key={skill._id}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                onClick={() => addSkill(skill.name)}
              >
                <span>{skill.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedSkills.map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
          >
            {skill}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => removeSkill(skill)}
            />
          </Badge>
        ))}
      </div>
      {selectedSkills.length === 0 && (
        <p className="text-sm text-gray-500">
          No skills selected. Start typing to search and add skills.
        </p>
      )}
    </div>
  );
}
