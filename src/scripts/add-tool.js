// Script to add tools to the database
// Load environment variables first
import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

// Debug environment variables
console.log('Environment variables in Node.js script:');
console.log('- PUBLIC_SUPABASE_URL:', process.env.PUBLIC_SUPABASE_URL ? 'Found' : 'Missing');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? 'Found' : 'Missing');
console.log('- PUBLIC_SUPABASE_ANON_KEY:', process.env.PUBLIC_SUPABASE_ANON_KEY ? 'Found' : 'Missing');
console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Found' : 'Missing');

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
      name: 'GeoThermo',
      petrahubid: 'geothermo',
      description: 'A tool for thermodynamic calculations in geosciences, focusing on mineral equilibria.',
      homepage: 'https://example.com/geothermo',
      version: '1.5.2',
      accessibility: 'Open source',
      cost: 'Free',
      maturity: 'Mature',
      license: 'GPL-3.0'
    },
    topics: [
      { term: 'Thermodynamics' },
      { term: 'Geochemistry' },
      { term: 'Metamorphic Petrology' }
    ],
    operatingSystems: [
      { name: 'Windows' },
      { name: 'Linux' }
    ],
    functions: [
      { operation: ['Calculation'], note: 'Thermodynamic calculations' },
      { operation: ['Modelling'], note: 'Phase diagram generation' }
    ],
    toolTypes: [
      { type: 'Desktop application' }
    ],
    languages: [
      { name: 'C++' },
      { name: 'Fortran' }
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
