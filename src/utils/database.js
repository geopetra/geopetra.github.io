// src/lib/database.js

import { supabase } from './supabase.js';

// Get all tools
export const getTools = async () => {
  const { data, error } = await supabase
    .from('tools')
    .select(`
      *,
      tool_topics(
        topic_id,
        topics(id, term)
      ),
      tool_type_relations(
        type_id,
        tool_types(id, type)
      ),
      tool_os(
        os_id,
        operating_systems(id, name)
      ),
      tool_language_relations(
        language_id,
        languages(id, name)
      ),
      tool_functions(*)
    `)
    .order('name');
    
  if (error) {
    console.error('Error fetching tools:', error);
    return [];
  }
  
  // Transform the nested data to a more usable format
  return data.map(tool => {
    const topics = (tool.tool_topics || []).map(relation => ({
      id: relation.topics?.id,
      term: relation.topics?.term
    })).filter(topic => topic.term);
    
    const toolTypes = (tool.tool_type_relations || []).map(relation => ({
      id: relation.tool_types?.id,
      type: relation.tool_types?.type
    })).filter(type => type.type);
    
    const operatingSystems = (tool.tool_os || []).map(relation => ({
      id: relation.operating_systems?.id,
      name: relation.operating_systems?.name
    })).filter(os => os.name);
    
    const languages = (tool.tool_language_relations || []).map(relation => ({
      id: relation.languages?.id,
      name: relation.languages?.name
    })).filter(lang => lang.name);
    
    return {
      ...tool,
      topics,
      toolTypes,
      operatingSystems,
      languages,
      functions: tool.tool_functions || [],
      // Remove the nested structures
      tool_topics: undefined,
      tool_type_relations: undefined,
      tool_os: undefined,
      tool_language_relations: undefined,
      tool_functions: undefined
    };
  }) || [];
};

// Add a new tool with related information
export const addTool = async (toolData) => {
  const { 
    basicInfo, 
    functions, 
    toolTypes, 
    topics, 
    operatingSystems, 
    languages 
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
      .from('tool_functions')
      .insert(functionsWithToolId);
      
    if (functionsError) throw functionsError;
  }
  
  // Insert tool types
  if (toolTypes && toolTypes.length > 0) {
    for (const type of toolTypes) {
      // Get the type_id from tool_types
      const { data: typeData } = await supabase
        .from('tool_types')
        .select('id')
        .eq('type', type.type)
        .single();
        
      if (typeData) {
        // Insert into junction table
        await supabase
          .from('tool_type_relations')
          .insert([{ 
            tool_id: tool.id,
            type_id: typeData.id
          }]);
      }
    }
  }
  
  // Insert topics
  if (topics && topics.length > 0) {
    for (const topic of topics) {
      // Get the topic_id from topics
      const { data: topicData } = await supabase
        .from('topics')
        .select('id')
        .eq('term', topic.term)
        .single();
        
      if (topicData) {
        // Insert into junction table
        await supabase
          .from('tool_topics')
          .insert([{ 
            tool_id: tool.id,
            topic_id: topicData.id
          }]);
      }
    }
  }
  
  // Insert operating systems
  if (operatingSystems && operatingSystems.length > 0) {
    for (const os of operatingSystems) {
      // Get the os_id from operating_systems
      const { data: osData } = await supabase
        .from('operating_systems')
        .select('id')
        .eq('name', os.name)
        .single();
        
      if (osData) {
        // Insert into junction table
        await supabase
          .from('tool_os')
          .insert([{ 
            tool_id: tool.id,
            os_id: osData.id
          }]);
      }
    }
  }
  
  // Insert languages
  if (languages && languages.length > 0) {
    for (const lang of languages) {
      // Get the language_id from languages
      const { data: langData } = await supabase
        .from('languages')
        .select('id')
        .eq('name', lang.name)
        .single();
        
      if (langData) {
        // Insert into junction table
        await supabase
          .from('tool_language_relations')
          .insert([{ 
            tool_id: tool.id,
            language_id: langData.id
          }]);
      }
    }
  }
  
  return tool;
};

// Get a tool with all related information
export const getToolWithDetails = async (petrahubid) => {
  try {
    const { data: tool, error: toolError } = await supabase
      .from('tools')
      .select(`
        *,
        tool_functions(*),
        tool_type_relations(
          type_id,
          tool_types(id, type)
        ),
        tool_topics(
          topic_id,
          topics(id, term)
        ),
        tool_os(
          os_id,
          operating_systems(id, name)
        ),
        tool_language_relations(
          language_id,
          languages(id, name)
        )
      `)
      .eq('petrahubid', petrahubid)
      .single();
      
    if (toolError) {
      console.error('Error fetching tool details:', toolError);
      return null;
    }
    
    if (!tool) return null;
    
    // Transform the nested data to a more usable format
    const topics = (tool.tool_topics || []).map(relation => ({
      id: relation.topics?.id,
      term: relation.topics?.term
    })).filter(topic => topic.term);
    
    const toolTypes = (tool.tool_type_relations || []).map(relation => ({
      id: relation.tool_types?.id,
      type: relation.tool_types?.type
    })).filter(type => type.type);
    
    const operatingSystems = (tool.tool_os || []).map(relation => ({
      id: relation.operating_systems?.id,
      name: relation.operating_systems?.name
    })).filter(os => os.name);
    
    const languages = (tool.tool_language_relations || []).map(relation => ({
      id: relation.languages?.id,
      name: relation.languages?.name
    })).filter(lang => lang.name);
    
    // Process functions to ensure operation is in a consistent format
    const functions = (tool.tool_functions || []).map(func => {
      // Ensure operation exists, use function_name as fallback
      if (!func.operation && func.function_name) {
        func.operation = func.function_name;
      }
      return func;
    });
    
    // Replace the nested structures with flattened arrays
    const transformedTool = {
      ...tool,
      topics,
      toolTypes,
      operatingSystems,
      languages,
      functions,
      // Remove the nested structures
      tool_topics: undefined,
      tool_type_relations: undefined,
      tool_os: undefined,
      tool_language_relations: undefined,
      tool_functions: undefined
    };
    
    return transformedTool;
  } catch (error) {
    console.error('Exception in getToolWithDetails:', error);
    return null;
  }
};

// Delete a tool and all its related data
export const deleteTool = async (toolId) => {
  const { error } = await supabase
    .from('tools')
    .delete()
    .eq('id', toolId);
    
  if (error) {
    console.error('Error deleting tool:', error);
    return false;
  }
  
  return true;
};

// Update basic tool information
export const updateTool = async (toolId, updates) => {
  const { error } = await supabase
    .from('tools')
    .update(updates)
    .eq('id', toolId);
    
  if (error) {
    console.error('Error updating tool:', error);
    return false;
  }
  
  return true;
};

// Get all unique topics for filtering
export const getAllTopics = async () => {
  const { data, error } = await supabase
    .from('topics')
    .select('id, term')
    .order('term');
    
  if (error) {
    console.error('Error fetching topics:', error);
    return [];
  }
  
  return data || [];
};

// Get all unique operating systems for filtering
export const getAllOperatingSystems = async () => {
  const { data, error } = await supabase
    .from('operating_systems')
    .select('id, name')
    .order('name');
    
  if (error) {
    console.error('Error fetching operating systems:', error);
    return [];
  }
  
  return data || [];
};

// Get all unique tool types for filtering
export const getAllToolTypes = async () => {
  const { data, error } = await supabase
    .from('tool_types')
    .select('id, type')
    .order('type');
    
  if (error) {
    console.error('Error fetching tool types:', error);
    return [];
  }
  
  return data || [];
};

// Get all unique programming languages for filtering
export const getAllLanguages = async () => {
  const { data, error } = await supabase
    .from('languages')
    .select('id, name')
    .order('name');
    
  if (error) {
    console.error('Error fetching languages:', error);
    return [];
  }
  
  return data || [];
};
