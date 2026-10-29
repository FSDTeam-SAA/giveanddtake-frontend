"use client";
import { forwardRef } from "react";
import { SkillsSelector as CatalogSkillsSelector, type SkillsSelectorHandle, type SkillsSelectorProps } from "../skills-selector";
export type { SkillsSelectorHandle } from "../skills-selector";
export const SkillsSelector = forwardRef<SkillsSelectorHandle, SkillsSelectorProps>(function SkillsSelector(props, ref) {
  return <CatalogSkillsSelector {...props} ref={ref} showLabel={false} />;
});
