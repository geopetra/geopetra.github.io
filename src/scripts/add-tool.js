// Script to add tools to the database
// Load environment variables first
import 'dotenv/config';
import { supabase } from '../utils/supabase.js';
import { addTool } from '../utils/database.js';

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
 * Check if a topic exists and add it if it doesn't
 * @param {string} term - The topic term to check/add
 */
async function ensureTopicExists(term) {
  // Check if the topic exists
  const { data: existingTopic, error: topicError } = await supabase
    .from('topics')
    .select('id')
    .eq('term', term)
    .maybeSingle();
  
  if (topicError) {
    console.error(`Error checking topic "${term}":`, topicError);
    return null;
  }
  
  // If the topic doesn't exist, add it
  if (!existingTopic) {
    console.log(`Adding new topic: ${term}`);
    const { data: newTopic, error: insertError } = await supabase
      .from('topics')
      .insert([{ term }])
      .select('id')
      .single();
      
    if (insertError) {
      console.error(`Error adding topic "${term}":`, insertError);
      return null;
    }
    
    console.log(`Topic "${term}" added successfully`);
    return newTopic.id;
  }
  
  return existingTopic.id;
}

/**
 * Check if a language exists and add it if it doesn't
 * @param {string} name - The language name to check/add
 */
async function ensureLanguageExists(name) {
  // Check if the language exists
  const { data: existingLang, error: langError } = await supabase
    .from('languages')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  
  if (langError) {
    console.error(`Error checking language "${name}":`, langError);
    return null;
  }
  
  // If the language doesn't exist, add it
  if (!existingLang) {
    console.log(`Adding new language: ${name}`);
    const { data: newLang, error: insertError } = await supabase
      .from('languages')
      .insert([{ name }])
      .select('id')
      .single();
      
    if (insertError) {
      console.error(`Error adding language "${name}":`, insertError);
      return null;
    }
    
    console.log(`Language "${name}" added successfully`);
    return newLang.id;
  }
  
  return existingLang.id;
}

/**
 * Add an entity to the database
 * @param {string} entityType - The type of entity to add
 * @param {string} entityValue - The value of the entity to add
 */
async function addEntity(entityType, entityValue) {
  let success = false;
  let id = null;
  
  switch (entityType) {
    case 'tool-type':
      // Check if the tool type exists
      const { data: existingType, error: typeError } = await supabase
        .from('tool_types')
        .select('id')
        .eq('type', entityValue)
        .maybeSingle();
      
      if (typeError) {
        console.error(`Error checking tool type "${entityValue}":`, typeError);
        return false;
      }
      
      // If the tool type doesn't exist, add it
      if (!existingType) {
        const { data: newType, error: insertError } = await supabase
          .from('tool_types')
          .insert([{ type: entityValue }])
          .select('id')
          .single();
          
        if (insertError) {
          console.error(`Error adding tool type "${entityValue}":`, insertError);
          return false;
        }
        
        id = newType.id;
        success = true;
      } else {
        id = existingType.id;
        success = true;
      }
      break;
      
    case 'topic':
      id = await ensureTopicExists(entityValue);
      success = !!id;
      break;
      
    case 'language':
      id = await ensureLanguageExists(entityValue);
      success = !!id;
      break;
      
    case 'os':
      // Check if the OS exists
      const { data: existingOS, error: osError } = await supabase
        .from('operating_systems')
        .select('id')
        .eq('name', entityValue)
        .maybeSingle();
      
      if (osError) {
        console.error(`Error checking OS "${entityValue}":`, osError);
        return false;
      }
      
      // If the OS doesn't exist, add it
      if (!existingOS) {
        const { data: newOS, error: insertError } = await supabase
          .from('operating_systems')
          .insert([{ name: entityValue }])
          .select('id')
          .single();
          
        if (insertError) {
          console.error(`Error adding OS "${entityValue}":`, insertError);
          return false;
        }
        
        id = newOS.id;
        success = true;
      } else {
        id = existingOS.id;
        success = true;
      }
      break;
      
    default:
      console.error(`Unknown entity type: ${entityType}`);
      console.error('Supported entity types: tool-type, topic, os, language');
      return false;
  }
  
  if (success) {
    console.log(`${entityType} "${entityValue}" is now available for use (ID: ${id}).`);
    return true;
  } else {
    console.error(`Failed to add ${entityType} "${entityValue}".`);
    return false;
  }
}

// Tool definitions
const tools = [
  {
    basicInfo: {
      name: 'PetroSim',
      petrahubid: 'petrosim',
      description: 'A comprehensive simulation tool for petrological analysis and modeling of igneous and metamorphic processes.',
      homepage: 'https://github.com/petrosim/petrosim',
      accessibility: 'Open Source',
      cost: 'Free',
      development_stage: 'Mature',
      license: 'MIT',
      documentation: 'https://github.com/petrosim/petrosim/docs',
      citation: JSON.stringify({
        papers: [
          {
            title: 'PetroSim: A new tool for petrological modeling',
            authors: 'Smith J, Johnson A',
            journal: 'Journal of Petrology',
            year: 2022,
            doi: '10.1234/petrosim'
          }
        ]
      }),
      support: JSON.stringify({
        contacts: [
          {
            name: 'John Smith',
            email: 'john@petrosim.org',
            role: 'Developer'
          }
        ]
      })
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
      { function_name: 'Phase equilibria modeling', description: 'Models phase equilibria in igneous and metamorphic systems', note: 'Uses thermodynamic databases', operation: ['Phase equilibria modeling'] },
      { function_name: 'Geothermobarometry', description: 'Calculates pressure and temperature conditions', note: 'Multiple calibrations available', operation: ['Geothermobarometry'] },
      { function_name: 'Mineral chemistry analysis', description: 'Analyzes mineral compositions', note: 'Supports various mineral groups', operation: ['Mineral chemistry analysis'] }
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
  {
    basicInfo: {
      name: 'LinaForma',
      petrahubid: 'linaforma',
      description: 'Inverse workflow for quantitative P-T',
      homepage: 'https://github.com/TMackay-Champion/LinaForma',
      accessibility: 'Open Source',
      cost: 'Free',
      development_stage: 'Mature',
      license: 'GPL',
      documentation: 'https://github.com/TMackay-Champion/LinaForma/README.md',
      citation: JSON.stringify({
        papers: [
          {
            title: 'LinaForma: Inverse workflow for P-T determination',
            authors: 'Mackay T',
            journal: 'Journal of Metamorphic Geology',
            year: 2021,
            doi: '10.1234/linaforma'
          }
        ]
      }),
      support: JSON.stringify({
        contacts: [
          {
            name: 'T. Mackay',
            email: 'tmackay@example.com',
            role: 'Developer'
          }
        ]
      })
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
      { function_name: 'Thermodynamic calculations', description: 'Performs thermodynamic calculations for mineral assemblages', note: 'Based on Gibbs free energy minimization', operation: ['Thermodynamic calculations'] },
      { function_name: 'Phase diagram generation', description: 'Generates phase diagrams for rock compositions', note: 'P-T, T-X, and P-X diagrams', operation: ['Phase diagram generation'] }
    ],
    toolTypes: [
      { type: 'Workflow' },
      { type: 'Command-line tool' }
    ],
    languages: [
      { name: 'MATLAB' }
    ]
  },
  {
    basicInfo: {
      name: 'GeoThermo',
      petrahubid: 'geothermo',
      description: 'Advanced thermodynamic modeling tool for geological processes',
      homepage: 'https://github.com/geothermo/geothermo',
      accessibility: 'Open Source',
      cost: 'Free',
      development_stage: 'Beta',
      license: 'Apache 2.0',
      documentation: 'https://geothermo.readthedocs.io/',
      citation: JSON.stringify({
        papers: [
          {
            title: 'GeoThermo: A new approach to thermodynamic modeling in geology',
            authors: 'Johnson R, Williams S',
            journal: 'Computers & Geosciences',
            year: 2023,
            doi: '10.1234/geothermo'
          }
        ]
      }),
      support: JSON.stringify({
        contacts: [
          {
            name: 'Rachel Johnson',
            email: 'rjohnson@geothermo.org',
            role: 'Lead Developer'
          }
        ]
      })
    },
    topics: [
      { term: 'Thermodynamics' },
      { term: 'Geochemistry' },
      { term: 'Metamorphic Petrology' }
    ],
    operatingSystems: [
      { name: 'Windows' },
      { name: 'Linux' },
      { name: 'Mac' }
    ],
    functions: [
      { function_name: 'Thermodynamic modeling', description: 'Comprehensive thermodynamic modeling of geological systems', note: 'Uses multiple databases', operation: ['Thermodynamic modeling'] },
      { function_name: 'Phase diagram calculation', description: 'Calculates phase diagrams for various compositions', note: 'Supports P-T, T-X diagrams', operation: ['Phase diagram calculation'] },
      { function_name: 'Reaction path modeling', description: 'Models reaction paths in P-T-X space', note: 'Includes kinetic constraints', operation: ['Reaction path modeling'] }
    ],
    toolTypes: [
      { type: 'Desktop application' },
      { type: 'Library' }
    ],
    languages: [
      { name: 'Python' },
      { name: 'Fortran' }
    ]
  }
];

// Main function
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const skipUpdates = args.includes('--skip-updates');
  const addEntityFlag = args.includes('--add-entity');
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('Database connection failed. Exiting.');
    process.exit(1);
  }
  
  // If just adding an entity type
  if (addEntityFlag) {
    const entityIndex = args.indexOf('--add-entity');
    const entityType = args[entityIndex + 1];
    const entityValue = args[entityIndex + 2];
    
    if (!entityType || !entityValue || entityType.startsWith('--') || entityValue.startsWith('--')) {
      console.error('Please provide an entity type and value to add.');
      console.error('Example: --add-entity tool-type "Script package"');
      console.error('Supported entity types: tool-type, topic, os, language');
      process.exit(1);
    }
    
    console.log(`Adding ${entityType}: ${entityValue}`);
    
    const success = await addEntity(entityType, entityValue);
    
    if (success) {
      console.log(`${entityType} "${entityValue}" is now available for use.`);
    } else {
      console.error(`Failed to add ${entityType} "${entityValue}".`);
    }
    process.exit(success ? 0 : 1);
    return;
  }
  
  console.log(`Running with update mode: ${skipUpdates ? 'disabled' : 'enabled'}`);
  
  // Ensure all required entities exist before adding tools
  for (const toolDefinition of tools) {
    // Ensure topics exist
    for (const topic of toolDefinition.topics) {
      await ensureTopicExists(topic.term);
    }
    
    // Ensure languages exist
    for (const lang of toolDefinition.languages) {
      await ensureLanguageExists(lang.name);
    }
    
    // Ensure tool types exist
    for (const type of toolDefinition.toolTypes) {
      await addEntity('tool-type', type.type);
    }
    
    // Ensure operating systems exist
    for (const os of toolDefinition.operatingSystems) {
      await addEntity('os', os.name);
    }
  }
  
  // Process each tool
  for (const toolDefinition of tools) {
    try {
      // Check if tool already exists
      const { data: existingTool, error: checkError } = await supabase
        .from('tools')
        .select('id')
        .eq('petrahubid', toolDefinition.basicInfo.petrahubid)
        .maybeSingle();
      
      if (checkError) {
        console.error(`Error checking if tool ${toolDefinition.basicInfo.name} exists:`, checkError);
        continue;
      }
      
      if (existingTool) {
        console.log(`Tool ${toolDefinition.basicInfo.name} already exists. Skipping...`);
        // Optionally, you could update the tool here instead of skipping
        // await updateTool(existingTool.id, toolDefinition.basicInfo);
        // console.log(`Tool ${toolDefinition.basicInfo.name} updated successfully!`);
      } else {
        await addTool(toolDefinition);
        console.log(`Tool ${toolDefinition.basicInfo.name} added successfully!`);
      }
    } catch (error) {
      console.error(`Error processing tool ${toolDefinition.basicInfo.name}:`, error);
    }
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
