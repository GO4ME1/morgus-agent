/**
 * Skills Tool - Allows agent to list and load skills
 */

import { Tool } from '../tools';
import { skillsManager } from '../skills';

export const listSkillsTool: Tool = {
  name: 'list_skills',
  description: 'List all available skills that Morgus has learned. Use this when user asks about capabilities or when you need to check what specialized knowledge is available.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    return skillsManager.listSkills();
  }
};

export const loadSkillTool: Tool = {
  name: 'load_skill',
  description: 'Load a specific skill by ID to get detailed instructions for a specialized task.',
  parameters: {
    type: 'object',
    properties: {
      skill_id: {
        type: 'string',
        description: 'The ID of the skill to load (e.g., "website-builder", "data-analysis")'
      }
    },
    required: ['skill_id']
  },
  execute: async (args: { skill_id: string }) => {
    const skills = skillsManager.getAllSkills();
    const skill = skills.find(s => s.id === args.skill_id);
    
    if (!skill) {
      return `Skill not found: ${args.skill_id}. Use list_skills to see available skills.`;
    }

    return `# ${skill.name}\n\n${skill.content}`;
  }
};
