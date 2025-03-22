// Script to add tools to the database
// Load environment variables first
import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

/**
 * Test the database connection
 */
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error connecting to database:', error);
      return false;
    }
    
    console.log('Connection successful!');
    return true;
  } catch (e) {
    console.error('Connection failed:', e.message);
    return false;
  }
}

/**
 * Add a tool and its related data to the database
 * @param {Object} toolDefinition - The tool definition object
 * @param {boolean} updateIfExists - Whether to update the tool if it already exists
 */
async function addTool(toolDefinition, updateIfExists = true) {
  const {
    tool,
    topics = [],
    operatingSystems = [],
    functions = [],
    toolTypes = [],
    languages = []
  } = toolDefinition;
  
  // Check if the tool already exists
  const { data: existingTool } = await supabase
    .from('tools')
    .select('*')
    .eq('petrahubid', tool.petrahubid)
    .single();

  let toolToUse;

  if (existingTool) {
    if (updateIfExists) {
      console.log(`Updating existing tool: ${existingTool.name} (${existingTool.petrahubid})`);
      
      // Update the tool with new values
      const { data: updatedTool, error } = await supabase
        .from('tools')
        .update(tool)
        .eq('id', existingTool.id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating tool:', error);
        return existingTool; // Return existing tool even if update fails
      }
      
      console.log(`Tool updated successfully: ${updatedTool.name}`);
      toolToUse = updatedTool;
      
      // Delete existing related data to replace with new data
      await Promise.all([
        deleteRelatedData('topics', existingTool.id),
        deleteRelatedData('operating_systems', existingTool.id),
        deleteRelatedData('functions', existingTool.id),
        deleteRelatedData('tool_types', existingTool.id),
        deleteRelatedData('languages', existingTool.id)
      ]);
    } else {
      console.log(`Tool already exists: ${existingTool.name} (${existingTool.petrahubid})`);
      return existingTool;
    }
  } else {
    // Insert the tool
    const { data: newTool, error } = await supabase
      .from('tools')
      .insert([tool])
      .select()
      .single();

    if (error) {
      console.error('Error adding tool:', error);
      return null;
    }

    console.log(`Tool added successfully: ${newTool.name}`);
    toolToUse = newTool;
  }
  
  // Add related data
  await Promise.all([
    addRelatedData('topics', topics, toolToUse.id),
    addRelatedData('operating_systems', operatingSystems, toolToUse.id),
    addRelatedData('functions', functions, toolToUse.id),
    addRelatedData('tool_types', toolTypes, toolToUse.id),
    addRelatedData('languages', languages, toolToUse.id)
  ]);
  
  console.log(`All data for ${toolToUse.name} added successfully!`);
  return toolToUse;
}

/**
 * Check if the database has the topic_terms table (new schema)
 */
async function checkForNewSchema() {
  try {
    const { data, error } = await supabase
      .from('topic_terms')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (e) {
    return false;
  }
}

/**
 * Delete related data for a tool
 * @param {string} table - The table name
 * @param {string} toolId - The tool ID
 */
async function deleteRelatedData(table, toolId) {
  // Special handling for topics with new schema
  if (table === 'topics') {
    const useNewSchema = await checkForNewSchema();
    
    if (useNewSchema) {
      // Delete from junction table
      const { error } = await supabase
        .from('tool_topic_terms')
        .delete()
        .eq('tool_id', toolId);
        
      if (error) {
        console.error(`Error deleting from tool_topic_terms:`, error);
      } else {
        console.log(`Deleted topic relationships for tool ID ${toolId}`);
      }
      
      return;
    }
  }
  
  // For other tables or old schema
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('tool_id', toolId);
    
  if (error) {
    console.error(`Error deleting from ${table}:`, error);
  } else {
    console.log(`Deleted ${table} for tool ID ${toolId}`);
  }
}

/**
 * Check if a tool type exists and add it if it doesn't
 * @param {string} type - The tool type to check/add
 */
async function ensureToolTypeExists(type) {
  // Check if the tool type exists in the tool_type_options table
  const { data: existingType, error: typeError } = await supabase
    .from('tool_type_options')
    .select('type')
    .eq('type', type)
    .maybeSingle();
  
  if (typeError) {
    console.error(`Error checking tool type "${type}":`, typeError);
    return false;
  }
  
  // If the tool type doesn't exist, add it
  if (!existingType) {
    console.log(`Adding new tool type option: ${type}`);
    const { error: insertError } = await supabase
      .from('tool_type_options')
      .insert([{ type }]);
      
    if (insertError) {
      console.error(`Error adding tool type option "${type}":`, insertError);
      return false;
    }
    
    console.log(`Tool type option "${type}" added successfully`);
  }
  
  return true;
}

/**
 * Check if a function operation exists and add it if it doesn't
 * @param {string} operation - The function operation to check/add
 */
async function ensureFunctionExists(operation) {
  // Check if the function exists in the function_options table
  const { data: existingFunction, error: functionError } = await supabase
    .from('function_options')
    .select('operation')
    .eq('operation', operation)
    .maybeSingle();
  
  if (functionError) {
    console.error(`Error checking function "${operation}":`, functionError);
    return false;
  }
  
  // If the function doesn't exist, add it
  if (!existingFunction) {
    console.log(`Adding new function option: ${operation}`);
    const { error: insertError } = await supabase
      .from('function_options')
      .insert([{ operation }]);
      
    if (insertError) {
      console.error(`Error adding function option "${operation}":`, insertError);
      return false;
    }
    
    console.log(`Function option "${operation}" added successfully`);
  }
  
  return true;
}

/**
 * Check if an OS exists and add it if it doesn't
 * @param {string} name - The OS name to check/add
 */
async function ensureOSExists(name) {
  // Check if the OS exists in the os_options table
  const { data: existingOS, error: osError } = await supabase
    .from('os_options')
    .select('name')
    .eq('name', name)
    .maybeSingle();
  
  if (osError) {
    console.error(`Error checking OS "${name}":`, osError);
    return false;
  }
  
  // If the OS doesn't exist, add it
  if (!existingOS) {
    console.log(`Adding new OS option: ${name}`);
    const { error: insertError } = await supabase
      .from('os_options')
      .insert([{ name }]);
      
    if (insertError) {
      console.error(`Error adding OS option "${name}":`, insertError);
      return false;
    }
    
    console.log(`OS option "${name}" added successfully`);
  }
  
  return true;
}

/**
 * Check if a language exists and add it if it doesn't
 * @param {string} name - The language name to check/add
 */
async function ensureLanguageExists(name) {
  // Check if the language exists in the language_options table
  const { data: existingLang, error: langError } = await supabase
    .from('language_options')
    .select('name')
    .eq('name', name)
    .maybeSingle();
  
  if (langError) {
    console.error(`Error checking language "${name}":`, langError);
    return false;
  }
  
  // If the language doesn't exist, add it
  if (!existingLang) {
    console.log(`Adding new language option: ${name}`);
    const { error: insertError } = await supabase
      .from('language_options')
      .insert([{ name }]);
      
    if (insertError) {
      console.error(`Error adding language option "${name}":`, insertError);
      return false;
    }
    
    console.log(`Language option "${name}" added successfully`);
  }
  
  return true;
}

/**
 * Add related data for a tool
 * @param {string} table - The table name
 * @param {Array} items - The items to add
 * @param {string} toolId - The tool ID
 */
async function addRelatedData(table, items, toolId) {
  if (!items || items.length === 0) {
    console.log(`No ${table} to add`);
    return;
  }
  
  // Special handling for tool types
  if (table === 'tool_types') {
    for (const item of items) {
      // Ensure the tool type exists in the options table
      const typeExists = await ensureToolTypeExists(item.type);
      if (!typeExists) {
        console.warn(`Skipping tool type "${item.type}" as it couldn't be added to options`);
        continue;
      }
      
      // Add the tool type to the tool
      const { error } = await supabase
        .from('tool_types')
        .insert([{ 
          type: item.type,
          tool_id: toolId 
        }]);
        
      if (error) {
        console.error(`Error adding tool type "${item.type}":`, error);
      }
    }
    
    console.log(`${table} added successfully`);
    return;
  }
  
  // Special handling for functions
  if (table === 'functions') {
    for (const item of items) {
      const operations = Array.isArray(item.operation) ? item.operation : [item.operation];
      
      for (const operation of operations) {
        // Ensure the function exists in the options table
        const functionExists = await ensureFunctionExists(operation);
        if (!functionExists) {
          console.warn(`Skipping function "${operation}" as it couldn't be added to options`);
          continue;
        }
      }
      
      // Add the function to the tool
      const { error } = await supabase
        .from('functions')
        .insert([{ 
          ...item,
          tool_id: toolId 
        }]);
        
      if (error) {
        console.error(`Error adding function:`, error);
      }
    }
    
    console.log(`${table} added successfully`);
    return;
  }
  
  // Special handling for operating systems
  if (table === 'operating_systems') {
    for (const item of items) {
      // Ensure the OS exists in the options table
      const osExists = await ensureOSExists(item.name);
      if (!osExists) {
        console.warn(`Skipping OS "${item.name}" as it couldn't be added to options`);
        continue;
      }
      
      // Add the OS to the tool
      const { error } = await supabase
        .from('operating_systems')
        .insert([{ 
          name: item.name,
          tool_id: toolId 
        }]);
        
      if (error) {
        console.error(`Error adding OS "${item.name}":`, error);
      }
    }
    
    console.log(`${table} added successfully`);
    return;
  }
  
  // Special handling for languages
  if (table === 'languages') {
    for (const item of items) {
      // Ensure the language exists in the options table
      const langExists = await ensureLanguageExists(item.name);
      if (!langExists) {
        console.warn(`Skipping language "${item.name}" as it couldn't be added to options`);
        continue;
      }
      
      // Add the language to the tool
      const { error } = await supabase
        .from('languages')
        .insert([{ 
          name: item.name,
          tool_id: toolId 
        }]);
        
      if (error) {
        console.error(`Error adding language "${item.name}":`, error);
      }
    }
    
    console.log(`${table} added successfully`);
    return;
  }
  
  // Special handling for topics
  if (table === 'topics') {
    const useNewSchema = await checkForNewSchema();
    
    if (useNewSchema) {
      // Using new schema with topic_terms and tool_topic_terms
      for (const item of items) {
        // Check if topic term exists in topic_terms
        const { data: existingTerm, error: termError } = await supabase
          .from('topic_terms')
          .select('id')
          .eq('term', item.term)
          .maybeSingle();
        
        let termId;
        
        // If topic doesn't exist, add it to topic_terms
        if (!existingTerm) {
          console.log(`Adding new topic term: ${item.term}`);
          const { data: newTerm, error: insertError } = await supabase
            .from('topic_terms')
            .insert([{ term: item.term }])
            .select('id')
            .single();
            
          if (insertError) {
            console.error(`Error adding topic term "${item.term}":`, insertError);
            continue;
          }
          
          termId = newTerm.id;
        } else {
          termId = existingTerm.id;
        }
        
        // Add the relationship to the junction table
        const { error: relationError } = await supabase
          .from('tool_topic_terms')
          .insert([{ 
            tool_id: toolId, 
            term_id: termId 
          }]);
          
        if (relationError) {
          console.error(`Error adding topic relationship for "${item.term}":`, relationError);
        }
      }
      
      console.log('Topics added successfully');
      return;
    } else {
      // Using old schema with direct topics relationship
      for (const item of items) {
        // Check if topic exists
        const { data: existingTopics } = await supabase
          .from('topics')
          .select('id')
          .eq('term', item.term);
        
        // If topic doesn't exist, add it without tool_id
        if (!existingTopics || existingTopics.length === 0) {
          console.log(`Adding new topic: ${item.term}`);
          await supabase.from('topics').insert([{ term: item.term }]);
        }
      }
    }
  }
  
  // Add tool_id to each item
  const itemsWithToolId = items.map(item => ({
    ...item,
    tool_id: toolId
  }));
  
  const { error } = await supabase
    .from(table)
    .insert(itemsWithToolId);
    
  if (error) {
    console.error(`Error adding ${table}:`, error);
  } else {
    console.log(`${table} added successfully`);
  }
}

// Tool definitions
const tools = [
  {
    tool: {
      name: 'PetroSim',
      petrahubid: 'petrosim',
      description: 'A comprehensive simulation tool for petrological analysis and modeling of igneous and metamorphic processes.',
      homepage: 'https://github.com/petrosim/petrosim',
      version: '2.1.0',
      accessibility: 'Open source',
      cost: 'Free',
      maturity: 'Mature',
      license: 'MIT'
    },
    topics: [
      { term: 'Igneous Petrology' },
      { term: 'Metamorphic Petrology' },
      { term: 'Geochemistry' }
    ],
    operatingSystems: [
      { name: 'Windows' },
      { name: 'Mac' },
      { name: 'Linux' }
    ],
    functions: [
      { operation: ['Modelling'], note: 'Phase equilibria modeling' },
      { operation: ['Calculation'], note: 'Geothermobarometry' },
      { operation: ['Analysis'], note: 'Mineral chemistry analysis' }
    ],
    toolTypes: [
      { type: 'Desktop application' },
      { type: 'Command-line tool' }
    ],
    languages: [
      { name: 'Python' },
      { name: 'C++' }
    ]
  },
  // Add more tools here as needed
  {
    tool: {
      name: 'LinaForma',
      petrahubid: 'linaforma',
      description: 'Inverse workflow for quantitative P-T',
      homepage: 'https://github.com/TMackay-Champion/LinaForma',
      version: '1.0.0',
      accessibility: 'Open source',
      cost: 'Free',
      maturity: 'Mature',
      license: 'GPLv3'
    },
    topics: [
      { term: 'Phase Equilibrium Modelling' },
      { term: 'Metamorphic Petrology' },
      { term: 'Igneous Petrology' }
    ],
    operatingSystems: [
      { name: 'Windows' }
    ],
    functions: [
      { operation: ['Calculation'], note: 'Thermodynamic calculations' },
      { operation: ['Modelling'], note: 'Phase diagram generation' }
    ],
    toolTypes: [
      { type: 'Script package' },
      { type: 'Command-line tool' }
    ],
    languages: [
      { name: 'MATLAB' }
    ]
  }
];

// Main function
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const skipUpdates = args.includes('--skip-updates');
  const addEntityType = args.includes('--add-entity');
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('Database connection failed. Exiting.');
    process.exit(1);
  }
  
  // If just adding an entity type
  if (addEntityType) {
    const entityIndex = args.indexOf('--add-entity');
    const entityType = args[entityIndex + 1];
    const entityValue = args[entityIndex + 2];
    
    if (!entityType || !entityValue || entityType.startsWith('--') || entityValue.startsWith('--')) {
      console.error('Please provide an entity type and value to add.');
      console.error('Example: --add-entity tool-type "Script package"');
      console.error('Supported entity types: tool-type, function, os, language, topic, petrology-term');
      process.exit(1);
    }
    
    console.log(`Adding ${entityType}: ${entityValue}`);
    
    let success = false;
    
    switch (entityType) {
      case 'tool-type':
        success = await ensureToolTypeExists(entityValue);
        break;
      case 'function':
        success = await ensureFunctionExists(entityValue);
        break;
      case 'os':
        success = await ensureOSExists(entityValue);
        break;
      case 'language':
        success = await ensureLanguageExists(entityValue);
        break;
      case 'topic':
        // Add to topic_terms
        const { error: topicError } = await supabase
          .from('topic_terms')
          .insert([{ term: entityValue }])
          .onConflict('term')
          .ignore();
        success = !topicError;
        if (topicError) console.error(`Error adding topic "${entityValue}":`, topicError);
        break;
      case 'petrology-term':
        // Add to petrology_terms
        const { error: petroError } = await supabase
          .from('petrology_terms')
          .insert([{ term: entityValue }])
          .onConflict('term')
          .ignore();
        success = !petroError;
        if (petroError) console.error(`Error adding petrology term "${entityValue}":`, petroError);
        break;
      default:
        console.error(`Unknown entity type: ${entityType}`);
        console.error('Supported entity types: tool-type, function, os, language, topic, petrology-term');
        process.exit(1);
    }
    
    if (success) {
      console.log(`${entityType} "${entityValue}" is now available for use.`);
    } else {
      console.error(`Failed to add ${entityType} "${entityValue}".`);
    }
    process.exit(0);
    return;
  }
  
  console.log(`Running with update mode: ${skipUpdates ? 'disabled' : 'enabled'}`);
  
  // Process each tool
  for (const toolDefinition of tools) {
    await addTool(toolDefinition, !skipUpdates);
  }
  
  console.log('All tools processed successfully!');
}

// Run the script
main()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
