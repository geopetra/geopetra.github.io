// Script to delete fake tools from the database
import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

/**
 * Test the database connection
 */
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    const { error } = await supabase
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
 * Delete a tool by its petrahubid
 */
async function deleteToolByPetrahubid(petrahubid) {
  try {
    // First get the tool ID
    const { data: tool, error: getError } = await supabase
      .from('tools')
      .select('id')
      .eq('petrahubid', petrahubid)
      .maybeSingle();
      
    if (getError) {
      console.error(`Error finding tool with petrahubid ${petrahubid}:`, getError);
      return false;
    }
    
    if (!tool) {
      console.log(`Tool with petrahubid ${petrahubid} not found.`);
      return true; // Already deleted or never existed
    }
    
    const toolId = tool.id;
    console.log(`Found tool ${petrahubid} with ID ${toolId}`);
    
    // Delete related data first
    try {
      // Delete functions
      const { error: deleteFunctionsError } = await supabase
        .from('tool_functions')
        .delete()
        .eq('tool_id', toolId);
      
      if (deleteFunctionsError) {
        console.error(`Error deleting functions for tool ${petrahubid}:`, deleteFunctionsError);
      } else {
        console.log(`Deleted functions for tool ${petrahubid}`);
      }
      
      // Delete tool types
      const { error: deleteTypesError } = await supabase
        .from('tool_type_relations')
        .delete()
        .eq('tool_id', toolId);
      
      if (deleteTypesError) {
        console.error(`Error deleting tool types for tool ${petrahubid}:`, deleteTypesError);
      } else {
        console.log(`Deleted tool types for tool ${petrahubid}`);
      }
      
      // Delete topics
      const { error: deleteTopicsError } = await supabase
        .from('tool_topics')
        .delete()
        .eq('tool_id', toolId);
      
      if (deleteTopicsError) {
        console.error(`Error deleting topics for tool ${petrahubid}:`, deleteTopicsError);
      } else {
        console.log(`Deleted topics for tool ${petrahubid}`);
      }
      
      // Delete operating systems
      const { error: deleteOSError } = await supabase
        .from('tool_os')
        .delete()
        .eq('tool_id', toolId);
      
      if (deleteOSError) {
        console.error(`Error deleting OS for tool ${petrahubid}:`, deleteOSError);
      } else {
        console.log(`Deleted OS relations for tool ${petrahubid}`);
      }
      
      // Delete languages
      const { error: deleteLanguagesError } = await supabase
        .from('tool_language_relations')
        .delete()
        .eq('tool_id', toolId);
      
      if (deleteLanguagesError) {
        console.error(`Error deleting languages for tool ${petrahubid}:`, deleteLanguagesError);
      } else {
        console.log(`Deleted language relations for tool ${petrahubid}`);
      }
    } catch (e) {
      console.error(`Error deleting related data for tool ${petrahubid}:`, e);
    }
    
    // Finally delete the tool itself
    const { error: deleteToolError } = await supabase
      .from('tools')
      .delete()
      .eq('id', toolId);
      
    if (deleteToolError) {
      console.error(`Error deleting tool ${petrahubid}:`, deleteToolError);
      return false;
    }
    
    console.log(`Tool ${petrahubid} deleted successfully!`);
    return true;
  } catch (error) {
    console.error(`Error in deleteToolByPetrahubid for ${petrahubid}:`, error);
    return false;
  }
}

// Main function
async function main() {
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('Database connection failed. Exiting.');
    process.exit(1);
  }
  
  // List of fake tools to delete
  const fakeTools = ['petrosim', 'geothermo'];
  
  // Delete each fake tool
  for (const petrahubid of fakeTools) {
    console.log(`Attempting to delete tool: ${petrahubid}`);
    const success = await deleteToolByPetrahubid(petrahubid);
    if (!success) {
      console.error(`Failed to delete tool ${petrahubid}`);
    }
  }
  
  console.log('Fake tools deletion completed!');
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
