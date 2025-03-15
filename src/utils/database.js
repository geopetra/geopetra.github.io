// src/lib/database.js

import { supabase } from './supabase.js';

// Get all tools
export const getTools = async () => {
  const { data, error } = await supabase
    .from('tools')
    .select(`
      *,
      topics(*)
    `)
    .order('name');
    
  if (error) {
    console.error('Error fetching tools:', error);
    return [];
  }
  
  return data || [];
};

// Add a new tool with related information
export const addTool = async (toolData) => {
  const { 
    basicInfo, 
    functions, 
    toolTypes, 
    topics, 
    operatingSystems, 
    languages, 
    petrologyTerms 
  } = toolData;
  
  // Begin transaction
  const { data: tool, error: toolError } = await supabase
    .from('tools')
    .insert([basicInfo])
    .select()
    .single();
  
  if (toolError) throw toolError;
  
  // Insert functions
  if (functions && functions.length > 0) {
    const functionsWithToolId = functions.map(func => ({
      ...func,
      tool_id: tool.id
    }));
    
    const { error: functionsError } = await supabase
      .from('functions')
      .insert(functionsWithToolId);
      
    if (functionsError) throw functionsError;
  }
  
  // Similarly add other related data...
  
  return tool;
};

// Get a tool with all related information
export const getToolWithDetails = async (petrahubid) => {
  try {
    const { data: tool, error: toolError } = await supabase
      .from('tools')
      .select(`
        *,
        functions(*),
        tool_types(*),
        topics(*),
        operating_systems(*),
        languages(*),
        tool_petrology_terms(
          petrology_terms(*)
        )
      `)
      .eq('petrahubid', petrahubid)
      .single();
    
    if (toolError) {
      console.error('Error fetching tool details:', toolError);
      return null;
    }
    
    return tool;
  } catch (error) {
    console.error('Exception in getToolWithDetails:', error);
    return null;
  }
};
