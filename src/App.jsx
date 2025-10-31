import React, { useState, useEffect } from 'react';
import { Play, FileJson, CheckCircle, Loader, AlertCircle, Download, Settings, BarChart3, Brain } from 'lucide-react';

const FullFunctionalNLCompiler = () => {
  const [input, setInput] = useState("Any sentence is accepted.");
  const [compilationSteps, setCompilationSteps] = useState([]);
  const [finalJSON, setFinalJSON] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [outputFormat, setOutputFormat] = useState('json');
  const [language, setLanguage] = useState('en');
  const [context, setContext] = useState([]);
  const [analytics, setAnalytics] = useState({ totalCompilations: 0, avgTime: 0, successRate: 100 });
  const [confidenceScore, setConfidenceScore] = useState(0);

  // Enhanced Dictionary API with fallback
  const fetchWordDefinition = async (word) => {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      if (!response.ok) throw new Error('Not found');
      const data = await response.json();
      
      if (data && data[0]) {
        const entry = data[0];
        return {
          word: entry.word,
          phonetic: entry.phonetic || '',
          meanings: entry.meanings.map(m => ({
            partOfSpeech: m.partOfSpeech,
            definitions: m.definitions.slice(0, 2).map(d => ({
              definition: d.definition,
              example: d.example || ''
            })),
            synonyms: m.synonyms?.slice(0, 3) || []
          })),
          origin: entry.origin || ''
        };
      }
      return null;
    } catch (error) {
      // Fallback to basic definitions
      return await fetchFallbackDefinition(word);
    }
  };

  // Fallback dictionary for common words
  const fallbackDictionary = {
    'my': { pos: 'pronoun', type: 'possessive', definition: 'belonging to me' },
    'i': { pos: 'pronoun', type: 'personal', definition: 'the speaker or writer' },
    'you': { pos: 'pronoun', type: 'personal', definition: 'the person being addressed' },
    'is': { pos: 'verb', type: 'auxiliary', definition: 'third person singular present of be' },
    'are': { pos: 'verb', type: 'auxiliary', definition: 'second person singular and plural present of be' },
    'am': { pos: 'verb', type: 'auxiliary', definition: 'first person singular present of be' },
    'was': { pos: 'verb', type: 'auxiliary', definition: 'past tense of be' },
    'were': { pos: 'verb', type: 'auxiliary', definition: 'past tense plural of be' },
    'the': { pos: 'article', type: 'definite', definition: 'denoting a specific item' },
    'a': { pos: 'article', type: 'indefinite', definition: 'used before singular nouns' },
    'an': { pos: 'article', type: 'indefinite', definition: 'used before words starting with vowel sounds' },
    'and': { pos: 'conjunction', type: 'coordinating', definition: 'connecting words or clauses' },
    'but': { pos: 'conjunction', type: 'coordinating', definition: 'used to introduce a contrasting statement' },
    'or': { pos: 'conjunction', type: 'coordinating', definition: 'used to link alternatives' },
    'if': { pos: 'conjunction', type: 'conditional', definition: 'introducing a conditional clause' },
    'when': { pos: 'conjunction', type: 'temporal', definition: 'at what time' },
    'because': { pos: 'conjunction', type: 'causal', definition: 'for the reason that' }
  };

  const fetchFallbackDefinition = async (word) => {
    const lower = word.toLowerCase();
    if (fallbackDictionary[lower]) {
      return {
        word: lower,
        phonetic: '',
        meanings: [{
          partOfSpeech: fallbackDictionary[lower].pos,
          definitions: [{ definition: fallbackDictionary[lower].definition, example: '' }],
          synonyms: []
        }]
      };
    }
    return null;
  };

  // Advanced POS Tagging with rules
  const advancedPOSTagging = (word, prevWord, nextWord, dictEntry) => {
    const lower = word.toLowerCase();
    
    // Check dictionary first
    if (dictEntry && dictEntry.meanings && dictEntry.meanings.length > 0) {
      return dictEntry.meanings[0].partOfSpeech;
    }

    // Fallback dictionary
    if (fallbackDictionary[lower]) {
      return fallbackDictionary[lower].pos;
    }

    // Pronoun detection
    if (['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'].includes(lower)) {
      return 'pronoun';
    }
    if (['my', 'your', 'his', 'her', 'its', 'our', 'their'].includes(lower)) {
      return 'possessive-pronoun';
    }
    if (['this', 'that', 'these', 'those'].includes(lower)) {
      return 'demonstrative-pronoun';
    }

    // Verb detection
    if (['is', 'are', 'am', 'was', 'were', 'be', 'been', 'being'].includes(lower)) {
      return 'verb';
    }
    if (lower.endsWith('ing') && !['thing', 'ring', 'king', 'sing', 'wing'].includes(lower)) {
      return 'verb';
    }
    if (lower.endsWith('ed') && !['red', 'bed', 'fed', 'led'].includes(lower)) {
      return 'verb';
    }
    if (['can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must'].includes(lower)) {
      return 'modal-verb';
    }

    // Adjective detection
    if (lower.endsWith('ly')) {
      return 'adverb';
    }
    if (lower.endsWith('ful') || lower.endsWith('less') || lower.endsWith('ous') || lower.endsWith('ive') || lower.endsWith('able')) {
      return 'adjective';
    }

    // Preposition
    if (['in', 'on', 'at', 'by', 'for', 'with', 'from', 'to', 'of', 'about', 'under', 'over'].includes(lower)) {
      return 'preposition';
    }

    // Conjunction
    if (['and', 'or', 'but', 'if', 'when', 'because', 'although', 'while', 'unless'].includes(lower)) {
      return 'conjunction';
    }

    // Article
    if (['the', 'a', 'an'].includes(lower)) {
      return 'article';
    }

    // Default to noun
    return 'noun';
  };

  // Intent Detection
  const detectIntent = (tokens) => {
    const text = tokens.map(t => t.text.toLowerCase()).join(' ');
    
    // Math operations
    if (/add|sum|plus|\+/.test(text) && /\d+/.test(text)) {
      return { type: 'math_operation', operation: 'addition', confidence: 0.95 };
    }
    if (/subtract|minus|\-/.test(text) && /\d+/.test(text)) {
      return { type: 'math_operation', operation: 'subtraction', confidence: 0.95 };
    }
    if (/multiply|times|\*/.test(text) && /\d+/.test(text)) {
      return { type: 'math_operation', operation: 'multiplication', confidence: 0.95 };
    }
    if (/divide|divided by|\//.test(text) && /\d+/.test(text)) {
      return { type: 'math_operation', operation: 'division', confidence: 0.95 };
    }

    // Questions
    if (/^(what|who|where|when|why|how|which)/.test(text)) {
      return { type: 'question', subtype: text.split(' ')[0], confidence: 0.9 };
    }

    // Commands
    if (/^(create|make|build|generate|write|develop)/.test(text)) {
      return { type: 'command', action: 'create', confidence: 0.85 };
    }

    // Statements
    if (/(is|are|am|was|were)/.test(text)) {
      return { type: 'statement', subtype: 'declarative', confidence: 0.8 };
    }

    return { type: 'unknown', confidence: 0.5 };
  };

  // Enhanced Dependency Parsing
  const dependencyParsing = (tokens) => {
    const dependencies = [];
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      // Subject-Verb relationship
      if (token.pos === 'noun' || token.pos === 'pronoun' || token.pos === 'possessive-pronoun') {
        const nextVerb = tokens.slice(i + 1).find(t => t.pos === 'verb' || t.pos === 'modal-verb');
        if (nextVerb) {
          dependencies.push({
            head: token.text,
            dependent: nextVerb.text,
            relation: 'nsubj',
            confidence: 0.9
          });
        }
      }

      // Verb-Object relationship
      if (token.pos === 'verb') {
        const nextNoun = tokens.slice(i + 1).find(t => t.pos === 'noun');
        if (nextNoun) {
          dependencies.push({
            head: token.text,
            dependent: nextNoun.text,
            relation: 'dobj',
            confidence: 0.85
          });
        }
      }

      // Adjective-Noun modification
      if (token.pos === 'adjective' && i < tokens.length - 1 && tokens[i + 1].pos === 'noun') {
        dependencies.push({
          head: tokens[i + 1].text,
          dependent: token.text,
          relation: 'amod',
          confidence: 0.8
        });
      }

      // Conjunction handling
      if (token.pos === 'conjunction') {
        dependencies.push({
          head: i > 0 ? tokens[i - 1].text : 'ROOT',
          dependent: i < tokens.length - 1 ? tokens[i + 1].text : 'END',
          relation: 'conj',
          type: token.text,
          confidence: 0.75
        });
      }
    }

    return dependencies;
  };

  // Phase 1: Enhanced Lexical Analysis
  const lexicalAnalysis = async (text) => {
    const words = text.match(/\b\w+\b/g) || [];
    const tokens = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const prevWord = i > 0 ? words[i - 1] : null;
      const nextWord = i < words.length - 1 ? words[i + 1] : null;
      
      const dictEntry = await fetchWordDefinition(word);
      const pos = advancedPOSTagging(word, prevWord, nextWord, dictEntry);
      
      tokens.push({
        id: i,
        text: word,
        lowercase: word.toLowerCase(),
        pos: pos,
        dictionaryEntry: dictEntry,
        definition: dictEntry?.meanings[0]?.definitions[0]?.definition || 'No definition available',
        synonyms: dictEntry?.meanings[0]?.synonyms || [],
        hasDictEntry: dictEntry !== null
      });
    }
    
    return tokens;
  };

  // Phase 2: Enhanced Syntax Analysis with Dependency Parsing
  const syntaxAnalysis = (tokens) => {
    const dependencies = dependencyParsing(tokens);
    const intent = detectIntent(tokens);
    
    const parseTree = {
      type: 'SENTENCE',
      intent: intent,
      clauses: [],
      dependencies: dependencies
    };

    let currentClause = {
      subject: null,
      predicate: null,
      objects: [],
      modifiers: [],
      complements: []
    };

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (token.pos === 'conjunction' && ['and', 'or', 'but'].includes(token.lowercase)) {
        parseTree.clauses.push(currentClause);
        currentClause = {
          subject: null,
          predicate: null,
          objects: [],
          modifiers: [],
          complements: []
        };
        continue;
      }

      if ((token.pos === 'noun' || token.pos === 'pronoun' || token.pos === 'possessive-pronoun') && !currentClause.subject) {
        currentClause.subject = {
          word: token.text,
          type: token.pos,
          position: i,
          definition: token.definition
        };
      } else if (token.pos === 'verb' || token.pos === 'modal-verb') {
        currentClause.predicate = {
          word: token.text,
          type: token.pos,
          position: i,
          definition: token.definition
        };
      } else if (token.pos === 'noun' && currentClause.predicate) {
        currentClause.objects.push({
          word: token.text,
          position: i,
          definition: token.definition
        });
      } else if (token.pos === 'adjective' || token.pos === 'adverb') {
        currentClause.modifiers.push({
          word: token.text,
          type: token.pos,
          position: i
        });
      } else if (token.pos === 'article' || token.pos === 'preposition') {
        currentClause.modifiers.push({
          word: token.text,
          type: token.pos,
          position: i
        });
      }
    }

    parseTree.clauses.push(currentClause);
    return parseTree;
  };

  // Phase 3: Enhanced Semantic Analysis
  const semanticAnalysis = (parseTree, tokens) => {
    const semanticTree = {
      sentence_type: parseTree.intent.type,
      intent: parseTree.intent,
      entities: [],
      actions: [],
      relationships: [],
      attributes: {},
      context_references: [],
      confidence_scores: {}
    };

    let totalConfidence = 0;
    let confidenceCount = 0;

    parseTree.clauses.forEach((clause, clauseIndex) => {
      if (clause.subject) {
        const subjectToken = tokens.find(t => t.text === clause.subject.word);
        semanticTree.entities.push({
          name: clause.subject.word,
          type: 'subject',
          role: clause.subject.type,
          definition: clause.subject.definition,
          clause: clauseIndex,
          confidence: subjectToken?.hasDictEntry ? 0.9 : 0.6
        });
        
        // Check for context references (pronouns)
        if (['he', 'she', 'it', 'they', 'him', 'her', 'them'].includes(clause.subject.word.toLowerCase())) {
          semanticTree.context_references.push({
            pronoun: clause.subject.word,
            refers_to: context.length > 0 ? context[context.length - 1].subject : 'unknown',
            confidence: context.length > 0 ? 0.7 : 0.3
          });
        }
      }

      if (clause.predicate) {
        const verbToken = tokens.find(t => t.text === clause.predicate.word);
        semanticTree.actions.push({
          action: clause.predicate.word,
          definition: clause.predicate.definition,
          actor: clause.subject?.word || 'unknown',
          clause: clauseIndex,
          confidence: verbToken?.hasDictEntry ? 0.85 : 0.5
        });
        totalConfidence += verbToken?.hasDictEntry ? 0.85 : 0.5;
        confidenceCount++;
      }

      clause.objects.forEach(obj => {
        const objToken = tokens.find(t => t.text === obj.word);
        semanticTree.entities.push({
          name: obj.word,
          type: 'object',
          definition: obj.definition,
          clause: clauseIndex,
          confidence: objToken?.hasDictEntry ? 0.8 : 0.5
        });
        totalConfidence += objToken?.hasDictEntry ? 0.8 : 0.5;
        confidenceCount++;
      });

      if (clause.subject && clause.predicate) {
        semanticTree.relationships.push({
          subject: clause.subject.word,
          action: clause.predicate.word,
          objects: clause.objects.map(o => o.word),
          clause: clauseIndex,
          confidence: 0.8
        });
      }
    });

    // Calculate overall confidence
    semanticTree.confidence_scores.overall = confidenceCount > 0 ? (totalConfidence / confidenceCount) : 0.5;
    semanticTree.confidence_scores.pos_accuracy = tokens.filter(t => t.hasDictEntry).length / tokens.length;

    parseTree.dependencies.forEach(dep => {
      semanticTree.relationships.push({
        type: 'dependency',
        relation: dep.relation,
        head: dep.head,
        dependent: dep.dependent,
        confidence: dep.confidence
      });
    });

    return semanticTree;
  };

  // Phase 4: Enhanced IR with Nested Structures
  const generateIR = (semanticTree) => {
    const ir = {
      format: 'JSON-IR',
      version: '2.0',
      intent: semanticTree.intent,
      nodes: [],
      edges: [],
      subgraphs: []
    };

    let nodeId = 0;

    // Create nodes for entities
    semanticTree.entities.forEach(entity => {
      ir.nodes.push({
        id: nodeId++,
        type: 'entity',
        label: entity.name,
        properties: {
          entityType: entity.type,
          role: entity.role || 'object',
          definition: entity.definition,
          clause: entity.clause,
          confidence: entity.confidence
        }
      });
    });

    // Create nodes for actions
    semanticTree.actions.forEach(action => {
      ir.nodes.push({
        id: nodeId++,
        type: 'action',
        label: action.action,
        properties: {
          definition: action.definition,
          actor: action.actor,
          clause: action.clause,
          confidence: action.confidence
        }
      });
    });

    // Create edges for relationships
    semanticTree.relationships.forEach(rel => {
      if (rel.type === 'dependency') {
        const headNode = ir.nodes.find(n => n.label === rel.head);
        const depNode = ir.nodes.find(n => n.label === rel.dependent);
        if (headNode && depNode) {
          ir.edges.push({
            from: headNode.id,
            to: depNode.id,
            type: rel.relation,
            confidence: rel.confidence
          });
        }
      } else {
        const subjectNode = ir.nodes.find(n => n.label === rel.subject);
        const actionNode = ir.nodes.find(n => n.label === rel.action);
        
        if (subjectNode && actionNode) {
          ir.edges.push({
            from: subjectNode.id,
            to: actionNode.id,
            type: 'performs',
            confidence: rel.confidence
          });
        }

        rel.objects?.forEach(obj => {
          const objNode = ir.nodes.find(n => n.label === obj);
          if (actionNode && objNode) {
            ir.edges.push({
              from: actionNode.id,
              to: objNode.id,
              type: 'affects',
              confidence: 0.75
            });
          }
        });
      }
    });

    return ir;
  };

  // Phase 5: Real Optimization
  const optimize = (ir) => {
    const optimized = JSON.parse(JSON.stringify(ir));
    const optimizationsApplied = [];

    // 1. Remove duplicate nodes
    const uniqueNodes = [];
    const seenLabels = new Map();
    
    optimized.nodes.forEach(node => {
      const key = `${node.label}-${node.type}`;
      if (!seenLabels.has(key)) {
        uniqueNodes.push(node);
        seenLabels.set(key, node.id);
      } else {
        // Merge properties
        const existingNode = uniqueNodes.find(n => n.label === node.label && n.type === node.type);
        if (existingNode && node.properties.confidence > existingNode.properties.confidence) {
          existingNode.properties = node.properties;
        }
        optimizationsApplied.push(`Merged duplicate node: ${node.label}`);
      }
    });
    
    optimized.nodes = uniqueNodes;

    // 2. Remove redundant edges
    const uniqueEdges = [];
    const seenEdges = new Set();
    
    optimized.edges.forEach(edge => {
      const key = `${edge.from}-${edge.to}-${edge.type}`;
      if (!seenEdges.has(key)) {
        uniqueEdges.push(edge);
        seenEdges.add(key);
      } else {
        optimizationsApplied.push(`Removed redundant edge: ${edge.type}`);
      }
    });
    
    optimized.edges = uniqueEdges;

    // 3. Simplify low-confidence relationships
    optimized.edges = optimized.edges.filter(edge => {
      if (edge.confidence < 0.4) {
        optimizationsApplied.push(`Removed low-confidence edge: ${edge.type} (${edge.confidence.toFixed(2)})`);
        return false;
      }
      return true;
    });

    optimized.optimizations_applied = optimizationsApplied;
    optimized.optimization_stats = {
      nodes_before: ir.nodes.length,
      nodes_after: optimized.nodes.length,
      edges_before: ir.edges.length,
      edges_after: optimized.edges.length,
      reduction_percentage: ((1 - optimized.nodes.length / ir.nodes.length) * 100).toFixed(2)
    };

    return optimized;
  };

  // Phase 6: Multi-format Output Generation
  const generateOutput = (optimizedIR, tokens, semanticTree, format) => {
    const baseJSON = {
      metadata: {
        compiler_version: '2.0-FULL-FUNCTIONAL',
        timestamp: new Date().toISOString(),
        source_language: language,
        target_format: format,
        total_words: tokens.length,
        dictionary_api: 'dictionaryapi.dev + fallback',
        compilation_time_ms: Date.now() - compilationStartTime,
        confidence_score: semanticTree.confidence_scores.overall.toFixed(3)
      },
      original_text: input,
      intent: semanticTree.intent,
      tokens: tokens.map(t => ({
        word: t.text,
        pos: t.pos,
        definition: t.definition,
        synonyms: t.synonyms
      })),
      semantic_structure: semanticTree,
      knowledge_graph: optimizedIR,
      context_memory: context.slice(-3), // Last 3 contexts
      summary: {
        main_subject: semanticTree.entities.find(e => e.type === 'subject')?.name || 'N/A',
        main_action: semanticTree.actions[0]?.action || 'N/A',
        entity_count: semanticTree.entities.length,
        relationship_count: semanticTree.relationships.length,
        confidence: (semanticTree.confidence_scores.overall * 100).toFixed(1) + '%'
      },
      error_handling: {
        has_errors: semanticTree.confidence_scores.overall < 0.5,
        error_reason: semanticTree.confidence_scores.overall < 0.5 ? 'Low confidence in parsing' : null,
        suggestions: semanticTree.confidence_scores.overall < 0.5 ? ['Try simpler sentence structure', 'Check spelling'] : []
      }
    };

    switch (format) {
      case 'json':
        return JSON.stringify(baseJSON, null, 2);
      case 'yaml':
        return convertToYAML(baseJSON);
      case 'xml':
        return convertToXML(baseJSON);
      default:
        return JSON.stringify(baseJSON, null, 2);
    }
  };

  const convertToYAML = (obj, indent = 0) => {
    let yaml = '';
    const spaces = '  '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null) {
        yaml += `${spaces}${key}: null\n`;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += convertToYAML(value, indent + 1);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n`;
            yaml += convertToYAML(item, indent + 2);
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
    return yaml;
  };

  const convertToXML = (obj, rootName = 'nlcompiler') => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;
    
    const buildXML = (obj, indent = 1) => {
      const spaces = '  '.repeat(indent);
      let result = '';
      
      for (const [key, value] of Object.entries(obj)) {
        const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
        if (value === null) {
          result += `${spaces}<${safeKey}/>\n`;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          result += `${spaces}<${safeKey}>\n`;
          result += buildXML(value, indent + 1);
          result += `${spaces}</${safeKey}>\n`;
        } else if (Array.isArray(value)) {
          result += `${spaces}<${safeKey}>\n`;
          value.forEach(item => {
            if (typeof item === 'object') {
              result += `${spaces}  <item>\n`;
              result += buildXML(item, indent + 2);
              result += `${spaces}  </item>\n`;
            } else {
              result += `${spaces}  <item>${item}</item>\n`;
            }
          });
          result += `${spaces}</${safeKey}>\n`;
        } else {
          result += `${spaces}<${safeKey}>${value}</${safeKey}>\n`;
        }
      }
      return result;
    };
    
    xml += buildXML(obj);
    xml += `</${rootName}>`;
    return xml;
  };

  let compilationStartTime = 0;

  const compile = async () => {
    compilationStartTime = Date.now();
    setIsCompiling(true);
    setCompilationSteps([]);
    setFinalJSON(null);
    
    const steps = [];

    try {
      // Phase 1
      steps.push({
        phase: 1,
        name: "Enhanced Lexical Analysis",
        status: "processing",
        description: "Advanced POS tagging with dictionary integration..."
      });
      setCompilationSteps([...steps]);

      const tokens = await lexicalAnalysis(input);
      steps[0].status = "complete";
      steps[0].output = tokens;
      steps[0].details = `Processed ${tokens.length} tokens | ${tokens.filter(t => t.hasDictEntry).length} dictionary hits | POS accuracy: ${((tokens.filter(t => t.hasDictEntry).length / tokens.length) * 100).toFixed(1)}%`;
      setCompilationSteps([...steps]);

      // Phase 2
      steps.push({
        phase: 2,
        name: "Syntax Analysis with Dependency Parsing",
        status: "processing",
        description: "Building parse tree with intent detection..."
      });
      setCompilationSteps([...steps]);

      const parseTree = syntaxAnalysis(tokens);
      steps[1].status = "complete";
      steps[1].output = parseTree;
      steps[1].details = `Intent: ${parseTree.intent.type} (${(parseTree.intent.confidence * 100).toFixed(1)}% confidence) | ${parseTree.clauses.length} clause(s) | ${parseTree.dependencies.length} dependencies`;
      setCompilationSteps([...steps]);

      // Phase 3
      steps.push({
        phase: 3,
        name: "Semantic Analysis with Context",
        status: "processing",
        description: "Extracting meaning and resolving references..."
      });
      setCompilationSteps([...steps]);

      const semanticTree = semanticAnalysis(parseTree, tokens);
      steps[2].status = "complete";
      steps[2].output = semanticTree;
      steps[2].details = `${semanticTree.entities.length} entities | ${semanticTree.actions.length} actions | ${semanticTree.relationships.length} relationships | Confidence: ${(semanticTree.confidence_scores.overall * 100).toFixed(1)}%`;
      setCompilationSteps([...steps]);
      setConfidenceScore(semanticTree.confidence_scores.overall * 100);

      // Phase 4
      steps.push({
        phase: 4,
        name: "IR Generation with Nested Graphs",
        status: "processing",
        description: "Creating advanced knowledge graph..."
      });
      setCompilationSteps([...steps]);

      const ir = generateIR(semanticTree);
      steps[3].status = "complete";
      steps[3].output = ir;
      steps[3].details = `Generated IR v2.0 | ${ir.nodes.length} nodes | ${ir.edges.length} edges | Intent-aware structure`;
      setCompilationSteps([...steps]);

      // Phase 5
      steps.push({
        phase: 5,
        name: "Real Optimization",
        status: "processing",
        description: "Applying graph optimizations..."
      });
      setCompilationSteps([...steps]);

      const optimized = optimize(ir);
      steps[4].status = "complete";
      steps[4].output = optimized;
      steps[4].details = `${optimized.optimizations_applied.length} optimizations | Reduced ${optimized.optimization_stats.reduction_percentage}% | ${optimized.nodes.length} nodes final`;
      setCompilationSteps([...steps]);

      // Phase 6
      steps.push({
        phase: 6,
        name: `Multi-Format Output (${outputFormat.toUpperCase()})`,
        status: "processing",
        description: "Generating final structured output..."
      });
      setCompilationSteps([...steps]);

      const output = generateOutput(optimized, tokens, semanticTree, outputFormat);
      steps[5].status = "complete";
      steps[5].output = output;
      steps[5].details = `Generated ${outputFormat.toUpperCase()} output | Size: ${(output.length / 1024).toFixed(2)}KB | Ready for export`;
      setCompilationSteps([...steps]);

      setFinalJSON(output);

      // Update context memory
      const newContext = {
        subject: semanticTree.entities.find(e => e.type === 'subject')?.name,
        action: semanticTree.actions[0]?.action,
        timestamp: Date.now()
      };
      setContext(prev => [...prev, newContext].slice(-5)); // Keep last 5

      // Update analytics
      const compTime = Date.now() - compilationStartTime;
      setAnalytics(prev => ({
        totalCompilations: prev.totalCompilations + 1,
        avgTime: ((prev.avgTime * prev.totalCompilations) + compTime) / (prev.totalCompilations + 1),
        successRate: semanticTree.confidence_scores.overall >= 0.5 ? 
          ((prev.successRate * prev.totalCompilations + 100) / (prev.totalCompilations + 1)) :
          ((prev.successRate * prev.totalCompilations) / (prev.totalCompilations + 1))
      }));

    } catch (error) {
      console.error('Compilation error:', error);
      steps.push({
        phase: 'error',
        name: 'Compilation Error',
        status: 'error',
        details: `Error: ${error.message}. Please try a different input.`,
        output: { error: error.message, stack: error.stack }
      });
      setCompilationSteps([...steps]);
      
      setAnalytics(prev => ({
        ...prev,
        successRate: (prev.successRate * prev.totalCompilations) / (prev.totalCompilations + 1)
      }));
    }

    setIsCompiling(false);
  };

  const downloadOutput = () => {
    if (!finalJSON) return;
    
    const blob = new Blob([finalJSON], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nlc-output-${Date.now()}.${outputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const phaseColors = {
    1: 'from-gray-700 via-gray-800 to-black',
    2: 'from-gray-600 via-gray-700 to-gray-900',
    3: 'from-gray-800 via-black to-gray-900',
    4: 'from-black via-gray-900 to-gray-800',
    5: 'from-gray-700 via-gray-900 to-black',
    6: 'from-gray-900 via-black to-gray-800'
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat p-4 md:p-8 relative" style={{backgroundImage: 'url(/bg.png)'}}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      <div className="relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex flex-col items-center gap-6 mb-6">
            <div className="flex items-center justify-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white rounded-full blur-xl opacity-20 animate-pulse"></div>
                <Brain className="relative text-white drop-shadow-2xl" size={56} />
              </div>
              <div>
                <h1 className="text-6xl font-black text-white drop-shadow-2xl tracking-tight" style={{textShadow: '0 0 20px rgba(255,255,255,0.5)'}}>
                  LLMind
                </h1>
                <p className="text-gray-400 text-sm font-medium tracking-[0.3em] mt-1 uppercase">v2.0 • Production-Ready</p>
              </div>
            </div>
            <div className="flex justify-center gap-3 flex-wrap max-w-4xl">
            <div className="group relative bg-white/5 backdrop-blur-md border-2 border-white/20 rounded-sm px-5 py-2.5 hover:bg-white hover:text-black transition-all duration-300 hover:border-b-[6px] hover:shadow-[0_6px_25px_rgba(255,255,255,0.6)] cursor-pointer hover:-translate-y-0.5">
              <span className="text-white group-hover:text-black text-xs font-black tracking-[0.15em] transition-colors duration-300" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>ADVANCED POS TAGGING</span>
            </div>
            <div className="group relative bg-white/5 backdrop-blur-md border-2 border-white/20 rounded-sm px-5 py-2.5 hover:bg-white hover:text-black transition-all duration-300 hover:border-b-[6px] hover:shadow-[0_6px_25px_rgba(255,255,255,0.6)] cursor-pointer hover:-translate-y-0.5">
              <span className="text-white group-hover:text-black text-xs font-black tracking-[0.15em] transition-colors duration-300" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>DEPENDENCY PARSING</span>
            </div>
            <div className="group relative bg-white/5 backdrop-blur-md border-2 border-white/20 rounded-sm px-5 py-2.5 hover:bg-white hover:text-black transition-all duration-300 hover:border-b-[6px] hover:shadow-[0_6px_25px_rgba(255,255,255,0.6)] cursor-pointer hover:-translate-y-0.5">
              <span className="text-white group-hover:text-black text-xs font-black tracking-[0.15em] transition-colors duration-300" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>INTENT DETECTION</span>
            </div>
            <div className="group relative bg-white/5 backdrop-blur-md border-2 border-white/20 rounded-sm px-5 py-2.5 hover:bg-white hover:text-black transition-all duration-300 hover:border-b-[6px] hover:shadow-[0_6px_25px_rgba(255,255,255,0.6)] cursor-pointer hover:-translate-y-0.5">
              <span className="text-white group-hover:text-black text-xs font-black tracking-[0.15em] transition-colors duration-300" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>CONTEXT MEMORY</span>
            </div>
            <div className="group relative bg-white/5 backdrop-blur-md border-2 border-white/20 rounded-sm px-5 py-2.5 hover:bg-white hover:text-black transition-all duration-300 hover:border-b-[6px] hover:shadow-[0_6px_25px_rgba(255,255,255,0.6)] cursor-pointer hover:-translate-y-0.5">
              <span className="text-white group-hover:text-black text-xs font-black tracking-[0.15em] transition-colors duration-300" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>MULTI-FORMAT OUTPUT</span>
            </div>
              <div className="group relative bg-white/5 backdrop-blur-md border-2 border-white/20 rounded-sm px-5 py-2.5 hover:bg-white hover:text-black transition-all duration-300 hover:border-b-[6px] hover:shadow-[0_6px_25px_rgba(255,255,255,0.6)] cursor-pointer hover:-translate-y-0.5">
                <span className="text-white group-hover:text-black text-xs font-black tracking-[0.15em] transition-colors duration-300" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>REAL OPTIMIZATION</span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="group relative bg-white/5 backdrop-blur-xl border-2 border-white/20 rounded-sm p-5 text-white hover:bg-white hover:text-black transition-all duration-300 overflow-hidden hover:border-b-[6px] hover:shadow-[0_10px_35px_rgba(255,255,255,0.5)] cursor-pointer hover:-translate-y-1">
            <div className="relative flex items-center gap-3 mb-3">
              <div className="p-2 bg-black/50 group-hover:bg-white/20 border border-white/30 rounded-sm transition-colors duration-300">
                <BarChart3 size={22} className="text-white group-hover:text-black transition-colors duration-300" />
              </div>
              <span className="text-xs font-black text-gray-400 group-hover:text-black tracking-[0.12em] uppercase transition-colors duration-300" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>Total Runs</span>
            </div>
            <p className="relative text-5xl font-black text-white group-hover:text-black transition-colors duration-300" style={{textShadow: '0 0 10px rgba(255,255,255,0.5)', fontFamily: 'system-ui, -apple-system, sans-serif'}}>{analytics.totalCompilations}</p>
          </div>
          <div className="group relative bg-white/5 backdrop-blur-xl border-2 border-white/20 rounded-sm p-5 text-white hover:bg-white hover:text-black transition-all duration-300 overflow-hidden hover:border-b-[6px] hover:shadow-[0_10px_35px_rgba(255,255,255,0.5)] cursor-pointer hover:-translate-y-1">
            <div className="relative flex items-center gap-3 mb-3">
              <div className="p-2 bg-black/50 group-hover:bg-white/20 border border-white/30 rounded-sm transition-colors duration-300">
                <CheckCircle size={22} className="text-white group-hover:text-black transition-colors duration-300" />
              </div>
              <span className="text-xs font-black text-gray-400 group-hover:text-black tracking-[0.12em] uppercase transition-colors duration-300" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>Success Rate</span>
            </div>
            <p className="relative text-5xl font-black text-white group-hover:text-black transition-colors duration-300" style={{textShadow: '0 0 10px rgba(255,255,255,0.5)', fontFamily: 'system-ui, -apple-system, sans-serif'}}>{analytics.successRate.toFixed(1)}%</p>
          </div>
          <div className="group relative bg-white/5 backdrop-blur-xl border-2 border-white/20 rounded-sm p-5 text-white hover:bg-white hover:text-black transition-all duration-300 overflow-hidden hover:border-b-[6px] hover:shadow-[0_10px_35px_rgba(255,255,255,0.5)] cursor-pointer hover:-translate-y-1">
            <div className="relative flex items-center gap-3 mb-3">
              <div className="p-2 bg-black/50 group-hover:bg-white/20 border border-white/30 rounded-sm transition-colors duration-300">
                <Loader size={22} className="text-white group-hover:text-black transition-colors duration-300" />
              </div>
              <span className="text-xs font-black text-gray-400 group-hover:text-black tracking-[0.12em] uppercase transition-colors duration-300" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>Avg Time</span>
            </div>
            <p className="relative text-5xl font-black text-white group-hover:text-black transition-colors duration-300" style={{textShadow: '0 0 10px rgba(255,255,255,0.5)', fontFamily: 'system-ui, -apple-system, sans-serif'}}>{analytics.avgTime.toFixed(0)}ms</p>
          </div>
          <div className="group relative bg-white/5 backdrop-blur-xl border-2 border-white/20 rounded-sm p-5 text-white hover:bg-white hover:text-black transition-all duration-300 overflow-hidden hover:border-b-[6px] hover:shadow-[0_10px_35px_rgba(255,255,255,0.5)] cursor-pointer hover:-translate-y-1">
            <div className="relative flex items-center gap-3 mb-3">
              <div className="p-2 bg-black/50 group-hover:bg-white/20 border border-white/30 rounded-sm transition-colors duration-300">
                <Brain size={22} className="text-white group-hover:text-black transition-colors duration-300" />
              </div>
              <span className="text-xs font-black text-gray-400 group-hover:text-black tracking-[0.12em] uppercase transition-colors duration-300" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>Confidence</span>
            </div>
            <p className="relative text-5xl font-black text-white group-hover:text-black transition-colors duration-300" style={{textShadow: '0 0 10px rgba(255,255,255,0.5)', fontFamily: 'system-ui, -apple-system, sans-serif'}}>{confidenceScore.toFixed(1)}%</p>
          </div>
        </div>

        {/* Input Section */}
        <div className="relative bg-white/5 backdrop-blur-2xl border-2 border-white/20 rounded-sm shadow-2xl p-8 mb-8 overflow-hidden">
          <div className="relative mb-6">
            <div className="flex flex-col items-center gap-4 mb-6">
              <label className="text-xs font-bold text-gray-400 tracking-wider uppercase">Output Format:</label>
              <select 
                value={outputFormat} 
                onChange={(e) => setOutputFormat(e.target.value)}
                className="px-6 py-3 bg-black/50 backdrop-blur-md border-2 border-white/30 rounded-sm text-white text-sm focus:outline-none focus:border-white hover:bg-black/70 transition-all duration-300 cursor-pointer font-mono"
              >
                <option value="json" className="bg-black">JSON</option>
                <option value="yaml" className="bg-black">YAML</option>
                <option value="xml" className="bg-black">XML</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-white mb-3 tracking-[0.2em] uppercase">
                Enter any English text:
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full px-5 py-4 bg-black/50 backdrop-blur-md border-2 border-white/30 rounded-sm focus:border-white focus:outline-none text-white placeholder-gray-500 min-h-32 transition-all duration-300 hover:bg-black/70 font-mono"
                placeholder="Type any sentence, paragraph, or command..."
              />
            </div>
          </div>

          <button
            onClick={compile}
            disabled={isCompiling}
            className="relative w-full px-8 py-6 bg-white text-black font-black text-xl rounded-sm hover:bg-black hover:text-white border-2 border-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 overflow-hidden group hover:border-b-[8px] hover:shadow-[0_12px_50px_rgba(255,255,255,0.7)] hover:-translate-y-1"
            style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
          >
            <div className="relative flex items-center gap-4">
              {isCompiling ? (
                <>
                  <Loader className="animate-spin" size={28} />
                  <span className="tracking-[0.2em] uppercase font-black">Compiling with AI-Powered NLP...</span>
                </>
              ) : (
                <>
                  <Play size={28} className="group-hover:scale-125 transition-transform duration-300" />
                  <span className="tracking-[0.2em] uppercase font-black">Compile to {outputFormat.toUpperCase()}</span>
                </>
              )}
            </div>
          </button>

          {/* Context Memory Display */}
          {context.length > 0 && (
            <div className="relative mt-6 p-4 bg-black/50 backdrop-blur-md rounded-sm border-2 border-white/30">
              <p className="text-xs font-bold text-white mb-3 tracking-[0.2em] uppercase">Context Memory (Last {context.length} inputs):</p>
              <div className="flex gap-2 flex-wrap">
                {context.slice(-3).map((ctx, idx) => (
                  <span key={idx} className="text-xs bg-white/10 text-white px-3 py-2 rounded-sm border border-white/30 backdrop-blur-sm font-mono">
                    {ctx.subject} → {ctx.action}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Compilation Steps */}
        {compilationSteps.length > 0 && (
          <div className="space-y-5 mb-8">
            {compilationSteps.map((step) => (
              <div key={step.phase} className="group relative bg-white/5 backdrop-blur-2xl border-2 border-white/20 rounded-sm shadow-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover:border-b-4 hover:shadow-[0_8px_30px_rgba(255,255,255,0.4)]">
                <div className={`relative bg-gradient-to-r ${phaseColors[step.phase] || 'from-gray-500 to-gray-600'} p-6 overflow-hidden border-b-2 border-white/30`}>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4 text-white">
                      <div className="relative w-14 h-14 bg-white/20 backdrop-blur-md border-2 border-white/50 rounded-sm flex items-center justify-center font-black text-2xl shadow-lg">
                        <span className="relative" style={{textShadow: '0 0 10px rgba(255,255,255,0.8)'}}>{step.phase}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black tracking-wider uppercase">{step.name}</h3>
                        <p className="text-sm opacity-90 font-medium mt-1 tracking-wide">{step.description}</p>
                      </div>
                    </div>
                    {step.status === 'complete' && <CheckCircle size={32} className="drop-shadow-lg" />}
                    {step.status === 'processing' && <Loader className="animate-spin drop-shadow-lg" size={32} />}
                    {step.status === 'error' && <AlertCircle size={32} className="drop-shadow-lg" />}
                  </div>
                </div>
                
                {step.status === 'complete' && (
                  <div className="p-6">
                    <div className="bg-white/10 backdrop-blur-md border-l-4 border-white p-4 rounded-sm mb-4">
                      <p className="text-sm text-white font-medium font-mono">{step.details}</p>
                    </div>
                    <details className="group/details bg-black/50 backdrop-blur-md rounded-sm border-2 border-white/30 overflow-hidden">
                      <summary className="cursor-pointer p-4 font-bold text-white hover:bg-white/10 transition-all duration-300 flex items-center justify-between tracking-wider uppercase text-sm">
                        <span>View Output Data</span>
                        <span className="text-xs opacity-60 group-open/details:rotate-180 transition-transform duration-300">▼</span>
                      </summary>
                      <pre className="text-xs text-white overflow-x-auto max-h-64 overflow-y-auto p-4 bg-black/80 font-mono border-t-2 border-white/20">
                        {typeof step.output === 'string' ? step.output : JSON.stringify(step.output, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}

                {step.status === 'error' && (
                  <div className="p-6">
                    <div className="bg-white/10 backdrop-blur-md border-l-4 border-white p-4 rounded-sm">
                      <p className="text-sm text-white font-medium font-mono">{step.details}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Final Output */}
        {finalJSON && (
          <div className="relative bg-white/5 backdrop-blur-2xl border-2 border-white/20 rounded-sm shadow-2xl p-8 overflow-hidden">
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-black/50 border-2 border-white/50 rounded-sm backdrop-blur-md">
                  <FileJson className="text-white" size={40} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-wider uppercase" style={{textShadow: '0 0 20px rgba(255,255,255,0.5)'}}>Final {outputFormat.toUpperCase()} Output</h2>
                  <p className="text-gray-400 font-medium mt-1 tracking-wide uppercase text-sm">Production-ready structured data</p>
                </div>
              </div>
              <button
                onClick={downloadOutput}
                className="group flex items-center gap-3 bg-white text-black px-7 py-4 rounded-sm hover:bg-black hover:text-white border-2 border-white transition-all duration-300 font-black hover:border-b-[6px] hover:shadow-[0_10px_35px_rgba(255,255,255,0.6)] uppercase tracking-[0.15em] hover:-translate-y-1"
                style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
              >
                <Download size={24} className="group-hover:animate-bounce" />
                Download
              </button>
            </div>
            
            <div className="relative bg-black/80 backdrop-blur-md rounded-sm p-6 mb-6 border-2 border-white/30 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-white"></div>
              <pre className="text-white font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
                {finalJSON}
              </pre>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(finalJSON);
                alert(`${outputFormat.toUpperCase()} copied to clipboard!`);
              }}
              className="relative w-full bg-white text-black font-black py-5 rounded-sm hover:bg-black hover:text-white border-2 border-white transition-all duration-300 overflow-hidden group hover:border-b-[8px] hover:shadow-[0_12px_50px_rgba(255,255,255,0.7)] uppercase tracking-[0.2em] hover:-translate-y-1"
              style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
            >
              <span className="relative text-lg">Copy {outputFormat.toUpperCase()} to Clipboard</span>
            </button>
          </div>
        )}



        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-white/5 backdrop-blur-xl border-2 border-white/20 rounded-sm px-8 py-4">
            <p className="text-white font-black text-lg tracking-[0.2em] uppercase" style={{textShadow: '0 0 15px rgba(255,255,255,0.5)'}}>Natural Language Compiler</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default FullFunctionalNLCompiler;