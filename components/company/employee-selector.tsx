"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchUsers } from "@/lib/api-service";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EmployeeSelectorProps {
  selectedEmployees: string[];
  onEmployeesChange: (employees: string[]) => void;
  companyUserId?: string;
}

export function EmployeeSelector({
  selectedEmployees,
  onEmployeesChange,
  companyUserId,
}: EmployeeSelectorProps) {
  const [open, setOpen] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", companyUserId],
    queryFn: () => fetchUsers(companyUserId),
  });

  const selectedUsers = users.filter((user) =>
    selectedEmployees.includes(user._id)
  );

  const handleSelect = (userId: string) => {
    if (selectedEmployees.includes(userId)) {
      onEmployeesChange(selectedEmployees.filter((id) => id !== userId));
    } else {
      onEmployeesChange([...selectedEmployees, userId]);
    }
  };

  const removeEmployee = (userId: string) => {
    onEmployeesChange(selectedEmployees.filter((id) => id !== userId));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">
          Add Profiles of Employees
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-white"
            >
              Add Here
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search employees..." />
              <CommandList>
                <CommandEmpty>
                  {isLoading ? "Loading..." : "No employees found."}
                </CommandEmpty>
                <CommandGroup>
                  {users
                    .filter((user) => user.role === "recruiter")
                    .map((user) => (
                      <CommandItem
                        key={user._id}
                        value={user.email}
                        onSelect={() => handleSelect(user._id)}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedEmployees.includes(user._id)
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        {user.email}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Selected Employees:</p>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <Badge
                key={user._id}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {user.email}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-gray-500 hover:text-red-500"
                  onClick={() => removeEmployee(user._id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
      >
        Add More
      </Button>
    </div>
  );
}
