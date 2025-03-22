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
 */
async function addTool(toolDefinition) {
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

  if (existingTool) {
    console.log(`Tool already exists: ${existingTool.name} (${existingTool.petrahubid})`);
    return existingTool;
  }

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
  
  // Add related data
  await Promise.all([
    addRelatedData('topics', topics, newTool.id),
    addRelatedData('operating_systems', operatingSystems, newTool.id),
    addRelatedData('functions', functions, newTool.id),
    addRelatedData('tool_types', toolTypes, newTool.id),
    addRelatedData('languages', languages, newTool.id)
  ]);
  
  console.log(`All data for ${newTool.name} added successfully!`);
  return newTool;
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
      description: 'Inverse workflow for quantitative $P$-$T$',
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
      { type: 'Desktop application' }
    ],
    languages: [
      { name: 'MATLAB' }
    ]
  }
];

// Main function
async function main() {
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('Database connection failed. Exiting.');
    process.exit(1);
  }
  
  // Process each tool
  for (const toolDefinition of tools) {
    await addTool(toolDefinition);
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
