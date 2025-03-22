// src/lib/database.js

import { supabase } from './supabase.js';

/**
 * Check if the database has the topic_terms table (new schema)
 * @returns {Promise<boolean>} True if using new schema, false otherwise
 */
const checkForNewSchema = async () => {
  try {
    const { data, error } = await supabase
      .from('topic_terms')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (e) {
    return false;
  }
};

// Get all tools
export const getTools = async () => {
  // Check if we're using the new schema
  const useNewSchema = await checkForNewSchema();
  
  if (useNewSchema) {
    // Using new schema with topic_terms and tool_topic_terms
    const { data, error } = await supabase
      .from('tools')
      .select(`
        *,
        tool_topic_terms(
          term_id,
          topic_terms(id, term)
        )
      `)
      .order('name');
      
    if (error) {
      console.error('Error fetching tools:', error);
      return [];
    }
    
    // Transform the nested topic_terms data to match the old format
    // This ensures backward compatibility with the UI
    return data.map(tool => {
      const topics = (tool.tool_topic_terms || []).map(relation => ({
        id: relation.topic_terms?.id,
        term: relation.topic_terms?.term
      })).filter(topic => topic.term); // Filter out any invalid topics
      
      return {
        ...tool,
        topics,
        tool_topic_terms: undefined // Remove the nested structure
      };
    }) || [];
  } else {
    // Using old schema with direct topics relationship
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
  }
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
    // Check if we're using the new schema
    const useNewSchema = await checkForNewSchema();
    
    if (useNewSchema) {
      // Using new schema with topic_terms and tool_topic_terms
      const { data: tool, error: toolError } = await supabase
        .from('tools')
        .select(`
          *,
          functions(*),
          tool_types(*),
          tool_topic_terms(
            term_id,
            topic_terms(id, term)
          ),
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
      
      if (!tool) return null;
      
      // Transform the nested topic_terms data to match the old format
      // This ensures backward compatibility with the UI
      const topics = (tool.tool_topic_terms || []).map(relation => ({
        id: relation.topic_terms?.id,
        term: relation.topic_terms?.term
      })).filter(topic => topic.term); // Filter out any invalid topics
      
      // Replace the nested structure with the flattened topics array
      const toolWithFlattenedTopics = {
        ...tool,
        topics,
        tool_topic_terms: undefined // Remove the nested structure
      };
      
      return toolWithFlattenedTopics;
    } else {
      // Using old schema with direct topics relationship
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
    }
  } catch (error) {
    console.error('Exception in getToolWithDetails:', error);
    return null;
  }
};
