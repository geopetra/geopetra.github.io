// Script to add a sample tool to the database
import { supabase } from '../utils/supabase.js';

/**
 * Check the database schema to help with debugging
 */
async function checkTableSchema() {
  try {
    // Try a simple query to see what we get back
    const { data: sampleRow, error: sampleError } = await supabase
      .from('tools')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.error('Error fetching sample row:', sampleError);
    } else {
      console.log('Sample row structure:', sampleRow.length > 0 ? Object.keys(sampleRow[0]) : 'No rows found');
    }
  } catch (e) {
    console.error('Exception during schema check:', e);
  }
}

/**
 * Add a sample tool and related data to the database
 */
async function addSampleTool() {
  // Check the table schema to debug
  await checkTableSchema();
  
  // Check if the tool already exists
  const { data: existingTool } = await supabase
    .from('tools')
    .select('*')
    .eq('name', 'PetroSim')
    .single();

  if (existingTool) {
    console.log('Tool already exists:', existingTool.name);
    return;
  }

  // Sample tool data
  const toolData = {
    name: 'PetroSim',
    petrahubid: 'petrosim',  // Changed to lowercase to match database column name
    description: 'A comprehensive simulation tool for petrological analysis and modeling of igneous and metamorphic processes.',
    homepage: 'https://github.com/petrosim/petrosim',
    version: '2.1.0',
    accessibility: 'Open source',
    cost: 'Free',
    maturity: 'Mature',
    license: 'MIT'
  };

  // Insert the tool
  const { data: tool, error } = await supabase
    .from('tools')
    .insert([toolData])
    .select()
    .single();

  if (error) {
    console.error('Error adding tool:', error);
    
    // Try to get more details about the error
    console.log('Tool data that failed:', toolData);
    
    // Try inserting with minimal fields to see if that works
    const minimalToolData = {
      name: 'PetroSim-Minimal',
      petrahubid: 'petrosim-minimal', // Added required field
      description: 'Minimal test'
    };
    
    console.log('Trying with minimal data:', minimalToolData);
    const { data: minimalTool, error: minimalError } = await supabase
      .from('tools')
      .insert([minimalToolData])
      .select()
      .single();
      
    if (minimalError) {
      console.error('Even minimal insert failed:', minimalError);
    } else {
      console.log('Minimal insert succeeded:', minimalTool);
      
      // Clean up the test entry
      const { error: deleteError } = await supabase
        .from('tools')
        .delete()
        .eq('id', minimalTool.id);
        
      if (deleteError) {
        console.error('Error deleting test entry:', deleteError);
      }
    }
    
    return;
  }

  console.log('Tool added successfully:', tool.name);

  // Add topics
  const topics = [
    { term: 'Igneous Petrology', tool_id: tool.id },
    { term: 'Metamorphic Petrology', tool_id: tool.id },
    { term: 'Geochemistry', tool_id: tool.id }
  ];

  const { error: topicsError } = await supabase
    .from('topics')
    .insert(topics);

  if (topicsError) {
    console.error('Error adding topics:', topicsError);
  } else {
    console.log('Topics added successfully');
  }

  // Add operating systems
  const operatingSystems = [
    { name: 'Windows', tool_id: tool.id },
    { name: 'Mac', tool_id: tool.id },     // Changed from 'macOS' to 'Mac' to match the constraint
    { name: 'Linux', tool_id: tool.id }
  ];

  const { error: osError } = await supabase
    .from('operating_systems')
    .insert(operatingSystems);

  if (osError) {
    console.error('Error adding operating systems:', osError);
  } else {
    console.log('Operating systems added successfully');
  }

  // Add functions
  const functions = [
    { operation: ['Modelling'], tool_id: tool.id, note: 'Phase equilibria modeling' },
    { operation: ['Calculation'], tool_id: tool.id, note: 'Geothermobarometry' },
    { operation: ['Analysis'], tool_id: tool.id, note: 'Mineral chemistry analysis' }
  ];

  const { error: functionsError } = await supabase
    .from('functions')
    .insert(functions);

  if (functionsError) {
    console.error('Error adding functions:', functionsError);
  } else {
    console.log('Functions added successfully');
  }

  // Add tool types
  const toolTypes = [
    { type: 'Desktop application', tool_id: tool.id },
    { type: 'Command-line tool', tool_id: tool.id }
  ];

  const { error: toolTypesError } = await supabase
    .from('tool_types')
    .insert(toolTypes);

  if (toolTypesError) {
    console.error('Error adding tool types:', toolTypesError);
  } else {
    console.log('Tool types added successfully');
  }

  // Add languages
  const languages = [
    { name: 'Python', tool_id: tool.id },
    { name: 'C++', tool_id: tool.id }
  ];

  const { error: languagesError } = await supabase
    .from('languages')
    .insert(languages);

  if (languagesError) {
    console.error('Error adding languages:', languagesError);
  } else {
    console.log('Languages added successfully');
  }

  console.log('Tool and related data added successfully!');
}

// Run the function
addSampleTool()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
