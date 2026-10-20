"use client"

import { SkillsSelector as CatalogSkillsSelector } from "../skills-selector"

export function SkillsSelector(props: { selectedSkills: string[]; onSkillsChange: (skills: string[]) => void }) {
  return <CatalogSkillsSelector {...props} showLabel={false} />
}
