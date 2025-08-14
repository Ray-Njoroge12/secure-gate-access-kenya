import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface AIInferenceRequest {
  modelId: string;
  inputData: Record<string, any>;
  sessionContext?: Record<string, any>;
  requireExplanation?: boolean;
  confidenceThreshold?: number;
}

interface AIDecisionRequest {
  ruleId: string;
  inputData: Record<string, any>;
  context?: Record<string, any>;
  testMode?: boolean;
}

interface TextAnalysisRequest {
  text: string;
  analysisTypes: string[];
  language?: string;
}

interface ImageAnalysisRequest {
  imageUrl: string;
  analysisTypes: string[];
  options?: Record<string, any>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { createClient } = await import('jsr:@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const requestData = await req.json();
    const action = requestData.action;

    switch (action) {
      case 'ai_inference':
        return await handleAIInference(supabase, requestData);
      
      case 'ai_decision':
        return await handleAIDecision(supabase, requestData);
      
      case 'text_analysis':
        return await handleTextAnalysis(supabase, requestData);
      
      case 'image_analysis':
        return await handleImageAnalysis(supabase, requestData);
      
      case 'model_monitoring':
        return await handleModelMonitoring(supabase, requestData);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('AI processing error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

async function handleAIInference(supabase: any, requestData: any) {
  const {
    modelId,
    inputData,
    sessionContext = {},
    requireExplanation = false,
    confidenceThreshold = 0.7
  }: AIInferenceRequest = requestData;

  if (!modelId || !inputData) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: modelId, inputData' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get model information
  const { data: model, error: modelError } = await supabase
    .from('ai_models')
    .select('*')
    .eq('id', modelId)
    .eq('deployment_status', 'production')
    .single();

  if (modelError || !model) {
    return new Response(
      JSON.stringify({ error: 'Model not found or not in production' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();

  // Simulate AI model inference (replace with actual model calls)
  const mockPrediction = await simulateModelInference(model, inputData);
  
  const processingTime = Date.now() - startTime;

  // Generate explanation if requested
  let explanation = null;
  if (requireExplanation) {
    explanation = generateModelExplanation(model, inputData, mockPrediction);
  }

  // Check confidence threshold
  const meetsThreshold = mockPrediction.confidence >= confidenceThreshold;

  // Store inference session
  const { data: session, error: sessionError } = await supabase
    .from('ai_inference_sessions')
    .insert({
      model_id: modelId,
      inference_type: 'real_time',
      input_data: inputData,
      output_data: mockPrediction,
      confidence_scores: { overall: mockPrediction.confidence },
      prediction_probabilities: mockPrediction.probabilities || {},
      feature_importance: mockPrediction.feature_importance || {},
      explanation_data: explanation || {},
      processing_time_ms: processingTime,
      model_version_used: model.model_version,
      session_context: sessionContext
    })
    .select('id')
    .single();

  if (sessionError) {
    console.error('Error storing inference session:', sessionError);
  }

  return new Response(
    JSON.stringify({
      success: true,
      sessionId: session?.id,
      modelInfo: {
        name: model.model_name,
        version: model.model_version,
        type: model.model_type
      },
      prediction: mockPrediction,
      explanation,
      meetsConfidenceThreshold: meetsThreshold,
      processingTime,
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

async function handleAIDecision(supabase: any, requestData: any) {
  const {
    ruleId,
    inputData,
    context = {},
    testMode = false
  }: AIDecisionRequest = requestData;

  if (!ruleId || !inputData) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: ruleId, inputData' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Execute AI decision using the database function
  const { data: decisionResult, error: decisionError } = await supabase
    .rpc('execute_ai_decision', {
      p_rule_id: ruleId,
      p_input_data: inputData,
      p_context: { ...context, test_mode: testMode }
    });

  if (decisionError) {
    return new Response(
      JSON.stringify({ error: `Decision execution failed: ${decisionError.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      decision: decisionResult,
      testMode,
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

async function handleTextAnalysis(supabase: any, requestData: any) {
  const {
    text,
    analysisTypes,
    language = 'auto'
  }: TextAnalysisRequest = requestData;

  if (!text || !analysisTypes || analysisTypes.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: text, analysisTypes' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();

  // Simulate NLP analysis (replace with actual NLP services)
  const analysisResults = await simulateTextAnalysis(text, analysisTypes, language);
  
  const processingTime = Date.now() - startTime;

  // Store analysis results
  const { data: analysis, error: analysisError } = await supabase
    .from('nlp_text_analysis')
    .insert({
      text_source: 'api_request',
      original_text: text,
      text_hash: await generateTextHash(text),
      language_detected: analysisResults.detectedLanguage,
      language_confidence: analysisResults.languageConfidence,
      sentiment_analysis: analysisResults.sentiment,
      emotion_analysis: analysisResults.emotions,
      topic_classification: analysisResults.topics,
      named_entities: analysisResults.entities,
      key_phrases: analysisResults.keyPhrases,
      intent_analysis: analysisResults.intent,
      urgency_score: analysisResults.urgency,
      toxicity_score: analysisResults.toxicity,
      processing_models_used: ['sentiment_analyzer', 'entity_extractor', 'topic_classifier'],
      processing_time_ms: processingTime,
      confidence_overall: analysisResults.overallConfidence
    })
    .select('id')
    .single();

  if (analysisError) {
    console.error('Error storing text analysis:', analysisError);
  }

  return new Response(
    JSON.stringify({
      success: true,
      analysisId: analysis?.id,
      results: analysisResults,
      processingTime,
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

async function handleImageAnalysis(supabase: any, requestData: any) {
  const {
    imageUrl,
    analysisTypes,
    options = {}
  }: ImageAnalysisRequest = requestData;

  if (!imageUrl || !analysisTypes || analysisTypes.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: imageUrl, analysisTypes' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();

  // Simulate computer vision analysis (replace with actual CV services)
  const analysisResults = await simulateImageAnalysis(imageUrl, analysisTypes, options);
  
  const processingTime = Date.now() - startTime;

  // Store analysis results
  const { data: analysis, error: analysisError } = await supabase
    .from('cv_image_analysis')
    .insert({
      image_source: 'api_request',
      image_url: imageUrl,
      image_hash: await generateImageHash(imageUrl),
      image_format: analysisResults.format,
      image_dimensions: analysisResults.dimensions,
      image_quality_score: analysisResults.quality,
      object_detection: analysisResults.objects,
      face_detection: analysisResults.faces,
      person_detection: analysisResults.persons,
      scene_classification: analysisResults.scene,
      activity_recognition: analysisResults.activities,
      anomaly_detection: analysisResults.anomalies,
      safety_compliance: analysisResults.safety,
      security_threats: analysisResults.threats,
      text_extraction: analysisResults.text,
      processing_models_used: ['object_detector', 'face_detector', 'scene_classifier'],
      processing_time_ms: processingTime,
      confidence_overall: analysisResults.overallConfidence
    })
    .select('id')
    .single();

  if (analysisError) {
    console.error('Error storing image analysis:', analysisError);
  }

  return new Response(
    JSON.stringify({
      success: true,
      analysisId: analysis?.id,
      results: analysisResults,
      processingTime,
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

async function handleModelMonitoring(supabase: any, requestData: any) {
  const { modelId, analysisType = 'performance' } = requestData;

  if (!modelId) {
    return new Response(
      JSON.stringify({ error: 'Missing required field: modelId' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get model performance analysis
  const { data: performanceData, error: performanceError } = await supabase
    .rpc('analyze_ai_model_performance', {
      p_model_id: modelId,
      p_analysis_days: 30
    });

  if (performanceError) {
    return new Response(
      JSON.stringify({ error: `Performance analysis failed: ${performanceError.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get recent monitoring data
  const { data: monitoringData } = await supabase
    .from('ai_model_monitoring')
    .select('*')
    .eq('model_id', modelId)
    .order('monitoring_date', { ascending: false })
    .limit(30);

  return new Response(
    JSON.stringify({
      success: true,
      modelId,
      performance: performanceData,
      monitoringHistory: monitoringData || [],
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

// Simulation functions (replace with actual AI model calls)
async function simulateModelInference(model: any, inputData: any) {
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400)); // Simulate processing time

  const baseConfidence = Math.random() * 0.3 + 0.7; // 0.7 to 1.0

  switch (model.model_type) {
    case 'classification':
      return {
        prediction: Math.random() > 0.5 ? 'high_risk' : 'low_risk',
        confidence: baseConfidence,
        probabilities: {
          high_risk: Math.random() * 0.5 + 0.3,
          medium_risk: Math.random() * 0.3 + 0.2,
          low_risk: Math.random() * 0.3 + 0.2
        },
        feature_importance: {
          behavior_score: Math.random(),
          access_history: Math.random(),
          time_of_day: Math.random()
        }
      };

    case 'regression':
      return {
        prediction: Math.random() * 100 + 50, // 50-150 visitors
        confidence: baseConfidence,
        prediction_interval: {
          lower: Math.random() * 20 + 40,
          upper: Math.random() * 20 + 130
        }
      };

    case 'anomaly_detection':
      return {
        isAnomaly: Math.random() > 0.8,
        anomalyScore: Math.random(),
        confidence: baseConfidence,
        anomalyReasons: ['unusual_timing', 'access_pattern_deviation']
      };

    default:
      return {
        prediction: 'unknown',
        confidence: baseConfidence
      };
  }
}

function generateModelExplanation(model: any, inputData: any, prediction: any) {
  return {
    explanation_type: 'feature_importance',
    top_features: [
      { feature: 'behavior_score', importance: 0.4, impact: 'positive' },
      { feature: 'access_history', importance: 0.3, impact: 'negative' },
      { feature: 'time_of_day', importance: 0.2, impact: 'neutral' }
    ],
    model_reasoning: `Based on ${model.model_name}, the prediction was made primarily considering behavior patterns and historical access data.`,
    confidence_factors: {
      data_quality: 0.9,
      model_certainty: prediction.confidence || 0.8,
      feature_completeness: 0.85
    }
  };
}

async function simulateTextAnalysis(text: string, analysisTypes: string[], language: string) {
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

  return {
    detectedLanguage: language === 'auto' ? 'en' : language,
    languageConfidence: 0.95,
    sentiment: {
      positive: Math.random() * 0.4 + 0.1,
      negative: Math.random() * 0.3 + 0.1,
      neutral: Math.random() * 0.4 + 0.3
    },
    emotions: {
      joy: Math.random() * 0.3,
      anger: Math.random() * 0.2,
      fear: Math.random() * 0.1,
      surprise: Math.random() * 0.2
    },
    topics: [
      { topic: 'customer_service', confidence: 0.8 },
      { topic: 'facility_access', confidence: 0.6 }
    ],
    entities: [
      { text: 'visitor', type: 'PERSON', confidence: 0.9 },
      { text: 'building', type: 'LOCATION', confidence: 0.8 }
    ],
    keyPhrases: ['access request', 'visitor management', 'security check'],
    intent: {
      intent: 'request_access',
      confidence: 0.85
    },
    urgency: Math.random() * 0.3 + 0.1,
    toxicity: Math.random() * 0.1,
    overallConfidence: 0.87
  };
}

async function simulateImageAnalysis(imageUrl: string, analysisTypes: string[], options: any) {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  return {
    format: 'JPEG',
    dimensions: { width: 1920, height: 1080 },
    quality: 0.9,
    objects: [
      { name: 'person', confidence: 0.95, boundingBox: { x: 100, y: 50, width: 200, height: 400 } },
      { name: 'door', confidence: 0.88, boundingBox: { x: 500, y: 0, width: 300, height: 600 } }
    ],
    faces: [
      { confidence: 0.92, landmarks: { eyes: [{ x: 150, y: 100 }, { x: 180, y: 100 }] } }
    ],
    persons: [
      { personId: 1, attributes: { age: '25-35', gender: 'unknown' } }
    ],
    scene: {
      classification: 'indoor_office',
      confidence: 0.89
    },
    activities: [
      { activity: 'walking', confidence: 0.75 }
    ],
    anomalies: [],
    safety: {
      hardhatDetected: false,
      safetyVestDetected: false
    },
    threats: {
      weaponDetected: false,
      riskLevel: 'low'
    },
    text: {
      extractedText: 'VISITOR ENTRANCE',
      confidence: 0.94
    },
    overallConfidence: 0.91
  };
}

async function generateTextHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateImageHash(imageUrl: string): Promise<string> {
  // Simplified hash based on URL for demo
  return await generateTextHash(imageUrl);
}
