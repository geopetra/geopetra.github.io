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
      name: 'MageMin',
      petrahubid: 'magemin',
      description: 'Gibbs energy minimization solver package',
      homepage: 'https://github.com/ComputationalThermodynamics/MAGEMin',
      accessibility: 'Open-source',
      cost: 'Free',
      development_stage: 'Mature',
      license: 'GPLv3',
      documentation: 'https://github.com/ComputationalThermodynamics/MAGEMin',
      citation: JSON.stringify({
        papers: [
          {
            title: 'MAGEMin, an Efficient Gibbs Energy Minimizer: Application to Igneous Systems',
            authors: 'Riel N., Kaus B.J.P., Green E.C.R., Berlie N.',
            journal: 'Geochemistry, Geophysics, Geosystems',
            year: 2022,
            doi: 'https://doi.org/10.1029/2022GC010427'
          }
        ]
      }),
      support: JSON.stringify({
        contacts: [
          {
            name: 'Nicholas Riel',
            email: 'nriel@uni-mainz.de',
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
      { name: 'Windows' },
      { name: 'Mac' },
      { name: 'Linux' }
    ],
    functions: [
      { function_name: 'Gibbs Energy Minimization', description: 'Performs Gibbs energy minimization calculations', note: 'Efficient solver for phase equilibria', operation: 'Gibbs Energy Minimization' }
    ],
    toolTypes: [
      { type: 'Web application' }
    ],
    languages: [
      { name: 'Julia' }
    ]
  },
  {
    basicInfo: {
      name: 'Theriak-Domino',
      petrahubid: 'theriak-domino',
      description: 'Programs to calculate and plot thermodynamic functions, equilibrium assemblages and rock-specific equilibrium assemblage diagrams',
      homepage: 'https://github.com/Theriak-Domino',
      accessibility: 'Open-source',
      cost: 'Free',
      development_stage: 'Mature',
      license: 'GPLv3',
      documentation: 'https://github.com/Theriak-Domino',
      citation: JSON.stringify({
        papers: [
          {
            title: 'The computation of chemical equilibrium in complex systems containing non-ideal solutions',
            authors: 'de Capitani, C., and Brown, T.H.',
            journal: 'Geochim. Cosmochim. Acta',
            year: 1987,
            doi: 'v. 51, p. 2639-2652'
          },
          {
            title: 'The computation of equilibrium assemblage diagrams with Theriak/Domino software',
            authors: 'de Capitani, C., and Petrakakis, K.',
            journal: 'American Mineralogist',
            year: 2010,
            doi: 'v. 95, p. 1006-1016'
          }
        ]
      }),
      support: JSON.stringify({
        contacts: [
          {
            name: 'Doug Tinkham',
            email: 'dtinkham@laurentian.ca',
            role: 'Support'
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
      { name: 'Windows' },
      { name: 'Mac' },
      { name: 'Linux' }
    ],
    functions: [
      { function_name: 'Gibbs Energy Minimization', description: 'Performs Gibbs energy minimization calculations', note: 'For equilibrium assemblages', operation: 'Gibbs Energy Minimization' }
    ],
    toolTypes: [
      { type: 'Suite' }
    ],
    languages: [
      { name: 'Fortran' }
    ]
  },
  {
    basicInfo: {
      name: 'HPx-eos',
      petrahubid: 'hpx-eos',
      description: 'Thermodynamic models for minerals and geological fluids',
      homepage: 'https://hpxeosandthermocalc.org/',
      accessibility: '',
      cost: 'Free',
      development_stage: 'Mature',
      license: '',
      documentation: 'https://hpxeosandthermocalc.org/',
      citation: JSON.stringify({
        papers: [
          {
            title: 'Various papers',
            authors: 'Green et al (2007), Green et al (2016), Holland & Powell (2003), Holland & Powell (2011), Holland et al (2018), Powell et al (1998), Weller et al (2024), White et al (2007), White et al (2014)',
            journal: 'Various journals',
            year: '2003-2024',
            doi: 'Multiple DOIs'
          }
        ]
      }),
      support: JSON.stringify({
        contacts: [
          {
            name: 'Eleanor Green',
            email: 'eleanor.green@unimelb.edu.au',
            role: 'Support'
          }
        ]
      })
    },
    topics: [
      { term: 'Metamorphic Petrology' },
      { term: 'Igneous Petrology' }
    ],
    operatingSystems: [],
    functions: [
      { function_name: 'Thermodynamic Models', description: 'Provides thermodynamic models for minerals and fluids', note: 'For geological applications', operation: 'Thermodynamic Models' }
    ],
    toolTypes: [],
    languages: []
  },
  {
    basicInfo: {
      name: 'THERMOCALC',
      petrahubid: 'thermocalc',
      description: 'Phase equilibrium calculation software',
      homepage: 'https://hpxeosandthermocalc.org/',
      accessibility: '',
      cost: 'Free',
      development_stage: 'Mature',
      license: '',
      documentation: 'https://hpxeosandthermocalc.org/',
      citation: JSON.stringify({
        papers: [
          {
            title: 'Various papers',
            authors: 'Powell & Holland (1988), Powell & Holland (1994), Powell et al (1998)',
            journal: 'Various journals',
            year: '1988-1998',
            doi: 'Multiple DOIs'
          }
        ]
      }),
      support: JSON.stringify({
        contacts: [
          {
            name: 'Eleanor Green',
            email: 'eleanor.green@unimelb.edu.au',
            role: 'Support'
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
      { name: 'Windows' },
      { name: 'Mac' }
    ],
    functions: [
      { function_name: 'Calculate phase equilibria', description: 'Calculates phase equilibria for geological systems', note: 'Based on thermodynamic data', operation: 'Calculate phase equilibria' }
    ],
    toolTypes: [
      { type: 'Command-line tool' }
    ],
    languages: []
  },
  {
    basicInfo: {
      name: 'Perple_X',
      petrahubid: 'perplex',
      description: 'Calculating phase diagrams, manipulating thermodynamic data, and modeling equilibrium phase fractionation and reactive transport',
      homepage: 'https://www.perplex.ethz.ch/',
      accessibility: '',
      cost: 'Free',
      development_stage: 'Mature',
      license: '',
      documentation: 'https://www.perplex.ethz.ch/',
      citation: JSON.stringify({
        papers: [
          {
            title: 'Various papers',
            authors: 'Connolly JAD (1990, 2005, 2009, 2018), Connolly JAD & Kerrick DM (1987), Connolly JAD & Petrini K (2002)',
            journal: 'Various journals',
            year: '1987-2018',
            doi: 'Multiple DOIs'
          }
        ]
      }),
      support: JSON.stringify({
        contacts: [
          {
            name: 'Jamie Connolly',
            email: 'james.connolly@erdw.ethz.ch',
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
      { name: 'Windows' },
      { name: 'Mac' },
      { name: 'Linux' }
    ],
    functions: [
      { function_name: 'Calculate phase equilibria', description: 'Calculates phase equilibria for geological systems', note: 'For various compositions', operation: 'Calculate phase equilibria' }
    ],
    toolTypes: [
      { type: 'Suite' }
    ],
    languages: [
      { name: 'Fortran' }
    ]
  },
  {
    basicInfo: {
      name: 'XMapTools',
      petrahubid: 'xmaptools',
      description: 'Open-source software solution for the analysis of quantitative chemical data in 2D and 3D',
      homepage: 'https://xmaptools.ch/',
      accessibility: 'Open-source',
      cost: 'Free',
      development_stage: 'Mature',
      license: '',
      documentation: 'https://xmaptools.ch/',
      citation: JSON.stringify({
        papers: [
          {
            title: 'Quantitative compositional mapping of mineral phases by electron probe micro-analyser',
            authors: 'Lanari, P., Vho, A., Bovay, T., Airaghi, L., Centrella, S.',
            journal: 'Geological Society of London, Special Publications',
            year: 2019,
            doi: '478, 39-63'
          },
          {
            title: 'XMapTools: a MATLAB©-based program for electron microprobe X-ray image processing and geothermobarometry',
            authors: 'Lanari, P., Vidal, O., De Andrade, V., Dubacq, B., Lewin, E., Grosch, E., Schwartz, S.',
            journal: 'Computers and Geosciences',
            year: 2014,
            doi: '62, 227-240'
          },
          {
            title: 'Multi-phase quantitative compositional mapping by LA-ICP-MS: analytical approach and data reduction protocol implemented in XMapTools',
            authors: 'Markmann, T.A., Lanari, P., Piccoli, F., Pettke, T., Tamblyn, R., Tedeschi, M., Lueder, M., Kunz, B., Riel, N., and Laughton, J.',
            journal: 'Chemical Geology',
            year: 2024,
            doi: '646, 121895'
          }
        ]
      }),
      support: JSON.stringify({
        contacts: [
          {
            name: 'Pierre Lanari',
            email: 'pierre.lanari@unil.ch',
            role: 'Developer'
          }
        ]
      })
    },
    topics: [
      { term: 'Metamorphic Petrology' },
      { term: 'Igneous Petrology' }
    ],
    operatingSystems: [
      { name: 'Windows' },
      { name: 'Mac' }
    ],
    functions: [
      { function_name: 'Quantitative compositional analysis', description: 'Analyzes quantitative chemical data in 2D and 3D', note: 'For mineral phases', operation: 'Quantitative compositional analysis' }
    ],
    toolTypes: [
      { type: 'Desktop Application' }
    ],
    languages: [
      { name: 'MATLAB' },
      { name: 'Bikeshed' },
      { name: 'HTML' }
    ]
  },
  {
    basicInfo: {
      name: 'Bingo Antidote',
      petrahubid: 'bingo-antidote',
      description: 'Iterative thermodynamic modelling',
      homepage: 'https://xmaptools.ch/bingo-antidote/',
      accessibility: 'Open-source',
      cost: 'Free',
      development_stage: 'Mature',
      license: '',
      documentation: 'https://xmaptools.ch/bingo-antidote/',
      citation: JSON.stringify({
        papers: [
          {
            title: 'Iterative thermodynamic modelling – Part 1: A theoretical scoring technique and a computer program (BINGO-ANTIDOTE)',
            authors: 'Duesterhoeft, E. & Lanari, P.',
            journal: 'Journal of Metamorphic Geology',
            year: 2020,
            doi: '38, 527-551'
          },
          {
            title: 'Iterative thermodynamic modelling—Part 2: tracing equilibrium relationships between minerals in metamorphic rocks',
            authors: 'Lanari, P. & Hermann, J.',
            journal: 'Journal of Metamorphic Geology',
            year: 2020,
            doi: '39, 651-674'
          }
        ]
      }),
      support: JSON.stringify({
        contacts: [
          {
            name: 'Pierre Lanari',
            email: 'pierre.lanari@unil.ch',
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
      { name: 'Windows' },
      { name: 'Mac' }
    ],
    functions: [
      { function_name: 'Iterative thermodynamic modelling', description: 'Performs iterative thermodynamic modelling', note: 'For mineral equilibria', operation: 'Iterative thermodynamic modelling' }
    ],
    toolTypes: [
      { type: 'Desktop Application' }
    ],
    languages: [
      { name: 'Fortran' },
      { name: 'MATLAB' }
    ]
  },
  {
    basicInfo: {
      name: 'MinPlotX',
      petrahubid: 'minplotx',
      description: 'Tool for formula recalculation, visualization, and comparison of large mineral compositional datasets',
      homepage: 'https://github.com/NilsGies/MinPlotX',
      accessibility: 'Open-source',
      cost: 'Free',
      development_stage: 'Mature',
      license: 'GPLv3',
      documentation: 'https://github.com/NilsGies/MinPlotX',
      citation: JSON.stringify({
        papers: [
          {
            title: 'MinPlotX: A powerful tool for formula recalculation, visualization, and comparison of large mineral compositional datasets',
            authors: 'Walters, J. B. & Gies, N. B.',
            journal: 'Mineralogia',
            year: 2025,
            doi: 'https://doi.org/10.2478/mipo-2025-0003'
          }
        ]
      }),
      support: JSON.stringify({
        contacts: [
          {
            name: 'Jesse Walters, Nils de Gies',
            email: '',
            role: 'Developers'
          }
        ]
      })
    },
    topics: [
      { term: 'Metamorphic Petrology' },
      { term: 'Igneous Petrology' }
    ],
    operatingSystems: [
      { name: 'Windows' },
      { name: 'Mac' },
      { name: 'Linux' }
    ],
    functions: [
      { function_name: 'Mineral formula recalculation', description: 'Recalculates mineral formulas from compositional data', note: 'For various mineral groups', operation: 'Mineral formula recalculation' },
      { function_name: 'Mineral compositional visualization', description: 'Visualizes mineral compositional data', note: 'For large datasets', operation: 'Mineral compositional visualization' }
    ],
    toolTypes: [
      { type: 'Desktop application' }
    ],
    languages: [
      { name: 'MATLAB' },
      { name: 'HTML' },
      { name: 'CSS' }
    ]
  },
  {
    basicInfo: {
      name: 'LinaForma',
      petrahubid: 'linaforma',
      description: 'Quantitative P-T conditions and uncertainty',
      homepage: 'https://github.com/TMackay-Champion/LinaForma',
      accessibility: 'Open-source',
      cost: 'Free',
      development_stage: 'Mature',
      license: 'GPLv3',
      documentation: 'https://github.com/TMackay-Champion/LinaForma',
      citation: JSON.stringify({
        papers: [
          {
            title: 'Towards Optimal P-T Estimates: An Inverse Method for Quantifying P-T Conditions and Uncertainty in Phase Equilibrium Modelling',
            authors: 'Mackay-Champion, T. & Cawood, I. P.',
            journal: 'Journal of Metamorphic Geology',
            year: 2024,
            doi: 'in review'
          }
        ]
      }),
      support: JSON.stringify({
        contacts: [
          {
            name: 'Ian Cawood',
            email: 'ipcawood@gmail.com',
            role: 'Developer'
          },
          {
            name: 'Tobermory Mackay-Champion',
            email: 'tmackaychampion@gmail.com',
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
      { name: 'Windows' },
      { name: 'Mac' },
      { name: 'Linux' }
    ],
    functions: [
      { function_name: 'Inversion', description: 'Performs inverse modeling for P-T conditions', note: 'For phase equilibria', operation: 'Inversion' },
      { function_name: 'P-T conditions', description: 'Determines pressure-temperature conditions', note: 'From mineral assemblages', operation: 'P-T conditions' },
      { function_name: 'Uncertainty estimation', description: 'Estimates uncertainty in P-T determinations', note: 'Statistical approach', operation: 'Uncertainty estimation' }
    ],
    toolTypes: [
      { type: 'Workflow' }
    ],
    languages: [
      { name: 'MATLAB' }
    ]
  },
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
      { function_name: 'Phase equilibria modeling', description: 'Models phase equilibria in igneous and metamorphic systems', note: 'Uses thermodynamic databases', operation: 'Phase equilibria modeling' },
      { function_name: 'Geothermobarometry', description: 'Calculates pressure and temperature conditions', note: 'Multiple calibrations available', operation: 'Geothermobarometry' },
      { function_name: 'Mineral chemistry analysis', description: 'Analyzes mineral compositions', note: 'Supports various mineral groups', operation: 'Mineral chemistry analysis' }
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
      name: 'GeoThermo',
      petrahubid: 'geothermo',
      description: 'Advanced thermodynamic modeling tool for geological processes',
      homepage: 'https://github.com/geothermo/geothermo',
      accessibility: 'Open Source',
      cost: 'Free',
      development_stage: 'Emerging',
      license: 'Apache',
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
      { function_name: 'Thermodynamic modeling', description: 'Comprehensive thermodynamic modeling of geological systems', note: 'Uses multiple databases', operation: 'Thermodynamic modeling' },
      { function_name: 'Phase diagram calculation', description: 'Calculates phase diagrams for various compositions', note: 'Supports P-T, T-X diagrams', operation: 'Phase diagram calculation' },
      { function_name: 'Reaction path modeling', description: 'Models reaction paths in P-T-X space', note: 'Includes kinetic constraints', operation: 'Reaction path modeling' }
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
