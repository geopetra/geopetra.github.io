// Script to add a sample tool to the database
import { supabase } from '../utils/supabase.js';

async function addSampleTool() {
  // First, check if the tool already exists
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
    petrahubID: 'petrosim',
    description: 'A comprehensive simulation tool for petrological analysis and modeling of igneous and metamorphic processes.',
    homepage: 'https://github.com/petrosim/petrosim',
    version: '2.1.0'
    // Removed logo, publication_date, and last_update as they don't exist in the schema
  };

  // Insert the tool
  const { data: tool, error } = await supabase
    .from('tools')
    .insert([toolData])
    .select()
    .single();

  if (error) {
    console.error('Error adding tool:', error);
    return;
  }

  console.log('Tool added successfully:', tool.name);

  // Add topics
  const topics = [
    { name: 'Igneous Petrology', tool_id: tool.id },
    { name: 'Metamorphic Petrology', tool_id: tool.id },
    { name: 'Geochemistry', tool_id: tool.id }
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
    { name: 'macOS', tool_id: tool.id },
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
    { name: 'Phase equilibria modeling', tool_id: tool.id },
    { name: 'Geothermobarometry', tool_id: tool.id },
    { name: 'Mineral chemistry analysis', tool_id: tool.id }
  ];

  const { error: functionsError } = await supabase
    .from('functions')
    .insert(functions);

  if (functionsError) {
    console.error('Error adding functions:', functionsError);
  } else {
    console.log('Functions added successfully');
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
