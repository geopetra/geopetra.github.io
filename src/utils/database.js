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
      tool_functions(*),
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
      )
    `)
    .order('name');
    
  if (error) {
    console.error('Error fetching tools:', error);
    return [];
  }
  
  // Transform the nested data to a more usable format
  return data.map(tool => {
    // Add console.log to debug the data structure
    console.log('Raw tool data:', JSON.stringify(tool, null, 2));
    
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
  
  try {
    // Check if tool already exists
    const { data: existingTool, error: checkError } = await supabase
      .from('tools')
      .select('id')
      .eq('petrahubid', basicInfo.petrahubid)
      .maybeSingle();
    
    if (checkError) {
      console.error(`Error checking if tool ${basicInfo.name} exists:`, checkError);
      return false;
    }
    
    let toolId;
    
    if (existingTool) {
      // Update existing tool
      const { error: updateError } = await supabase
        .from('tools')
        .update(basicInfo)
        .eq('id', existingTool.id);
      
      if (updateError) {
        console.error(`Error updating tool ${basicInfo.name}:`, updateError);
        // Continue with the existing ID even if update fails
      }
      
      console.log(`Tool ${basicInfo.name} updated successfully!`);
      toolId = existingTool.id;
      
      // Delete existing relations to recreate them
      try {
        const { error: deleteFunctionsError } = await supabase
          .from('tool_functions')
          .delete()
          .eq('tool_id', toolId);
        
        if (deleteFunctionsError) {
          console.error(`Error deleting existing functions for ${basicInfo.name}:`, deleteFunctionsError);
          // Continue anyway
        }
      } catch (e) {
        console.error(`Exception deleting functions for ${basicInfo.name}:`, e);
        // Continue anyway
      }
      
      try {
        const { error: deleteTypesError } = await supabase
          .from('tool_type_relations')
          .delete()
          .eq('tool_id', toolId);
        
        if (deleteTypesError) {
          console.error(`Error deleting existing tool types for ${basicInfo.name}:`, deleteTypesError);
          // Continue anyway
        }
      } catch (e) {
        console.error(`Exception deleting tool types for ${basicInfo.name}:`, e);
        // Continue anyway
      }
      
      try {
        const { error: deleteTopicsError } = await supabase
          .from('tool_topics')
          .delete()
          .eq('tool_id', toolId);
        
        if (deleteTopicsError) {
          console.error(`Error deleting existing topics for ${basicInfo.name}:`, deleteTopicsError);
          // Continue anyway
        }
      } catch (e) {
        console.error(`Exception deleting topics for ${basicInfo.name}:`, e);
        // Continue anyway
      }
      
      try {
        const { error: deleteOSError } = await supabase
          .from('tool_os')
          .delete()
          .eq('tool_id', toolId);
        
        if (deleteOSError) {
          console.error(`Error deleting existing OS for ${basicInfo.name}:`, deleteOSError);
          // Continue anyway
        }
      } catch (e) {
        console.error(`Exception deleting OS for ${basicInfo.name}:`, e);
        // Continue anyway
      }
      
      try {
        const { error: deleteLanguagesError } = await supabase
          .from('tool_language_relations')
          .delete()
          .eq('tool_id', toolId);
        
        if (deleteLanguagesError) {
          console.error(`Error deleting existing languages for ${basicInfo.name}:`, deleteLanguagesError);
          // Continue anyway
        }
      } catch (e) {
        console.error(`Exception deleting languages for ${basicInfo.name}:`, e);
        // Continue anyway
      }
    } else {
      // Add new tool
      const { data: newTool, error: toolError } = await supabase
        .from('tools')
        .insert([basicInfo])
        .select('id')
        .single();
        
      if (toolError) {
        console.error('Error adding tool:', toolError);
        return false;
      }
      
      console.log(`Tool ${basicInfo.name} added successfully!`);
      toolId = newTool.id;
    }
    
    // Add functions
    if (functions && functions.length > 0) {
      try {
        const functionsWithToolId = functions.map(func => {
          // Remove operation field if it exists
          const { operation, ...funcWithoutOperation } = func;
          return {
            ...funcWithoutOperation,
            tool_id: toolId
          };
        });
        
        const { error: functionsError } = await supabase
          .from('tool_functions')
          .insert(functionsWithToolId);
          
        if (functionsError) {
          console.error(`Error adding functions for ${basicInfo.name}:`, functionsError);
          // Continue anyway
        }
      } catch (e) {
        console.error(`Exception adding functions for ${basicInfo.name}:`, e);
        // Continue anyway
      }
    }
    
    // Add tool types
    if (toolTypes && toolTypes.length > 0) {
      for (const typeObj of toolTypes) {
        try {
          // Get the type ID
          const { data: typeData, error: typeError } = await supabase
            .from('tool_types')
            .select('id')
            .eq('type', typeObj.type)
            .single();
            
          if (typeError) {
            console.error(`Error finding tool type "${typeObj.type}":`, typeError);
            continue;
          }
          
          if (!typeData) {
            console.error(`Tool type "${typeObj.type}" not found in database`);
            continue;
          }
          
          // Add the relation
          const { error: relationError } = await supabase
            .from('tool_type_relations')
            .insert([{
              tool_id: toolId,
              type_id: typeData.id
            }]);
            
          if (relationError) {
            console.error(`Error adding tool type relation for "${typeObj.type}":`, relationError);
            // Continue anyway
          }
        } catch (e) {
          console.error(`Exception processing tool type "${typeObj.type}":`, e);
          // Continue to next type
        }
      }
    }
    
    // Add topics
    if (topics && topics.length > 0) {
      for (const topicObj of topics) {
        try {
          // Get the topic ID
          const { data: topicData, error: topicError } = await supabase
            .from('topics')
            .select('id')
            .eq('term', topicObj.term)
            .single();
            
          if (topicError) {
            console.error(`Error finding topic "${topicObj.term}":`, topicError);
            continue;
          }
          
          if (!topicData) {
            console.error(`Topic "${topicObj.term}" not found in database`);
            continue;
          }
          
          // Add the relation
          const { error: relationError } = await supabase
            .from('tool_topics')
            .insert([{
              tool_id: toolId,
              topic_id: topicData.id
            }]);
            
          if (relationError) {
            console.error(`Error adding topic relation for "${topicObj.term}":`, relationError);
            // Continue anyway
          }
        } catch (e) {
          console.error(`Exception processing topic "${topicObj.term}":`, e);
          // Continue to next topic
        }
      }
    }
    
    // Add operating systems
    if (operatingSystems && operatingSystems.length > 0) {
      for (const osObj of operatingSystems) {
        try {
          // Get the OS ID
          const { data: osData, error: osError } = await supabase
            .from('operating_systems')
            .select('id')
            .eq('name', osObj.name)
            .single();
            
          if (osError) {
            console.error(`Error finding OS "${osObj.name}":`, osError);
            continue;
          }
          
          if (!osData) {
            console.error(`OS "${osObj.name}" not found in database`);
            continue;
          }
          
          // Add the relation
          const { error: relationError } = await supabase
            .from('tool_os')
            .insert([{
              tool_id: toolId,
              os_id: osData.id
            }]);
            
          if (relationError) {
            console.error(`Error adding OS relation for "${osObj.name}":`, relationError);
            // Continue anyway
          }
        } catch (e) {
          console.error(`Exception processing OS "${osObj.name}":`, e);
          // Continue to next OS
        }
      }
    }
    
    // Add languages
    if (languages && languages.length > 0) {
      for (const langObj of languages) {
        try {
          // Get the language ID
          const { data: langData, error: langError } = await supabase
            .from('languages')
            .select('id')
            .eq('name', langObj.name)
            .single();
            
          if (langError) {
            console.error(`Error finding language "${langObj.name}":`, langError);
            continue;
          }
          
          if (!langData) {
            console.error(`Language "${langObj.name}" not found in database`);
            continue;
          }
          
          // Add the relation
          const { error: relationError } = await supabase
            .from('tool_language_relations')
            .insert([{
              tool_id: toolId,
              language_id: langData.id
            }]);
            
          if (relationError) {
            console.error(`Error adding language relation for "${langObj.name}":`, relationError);
            // Continue anyway
          }
        } catch (e) {
          console.error(`Exception processing language "${langObj.name}":`, e);
          // Continue to next language
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error in addTool for ${basicInfo.name}:`, error);
    return false;
  }
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
