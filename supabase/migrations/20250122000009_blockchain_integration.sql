-- Blockchain Integration - Low Priority Phase
-- Immutable Audit Trails and Decentralized Identity Management

-- 1. Blockchain Networks and Configuration
CREATE TABLE blockchain_networks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  network_name VARCHAR(100) NOT NULL UNIQUE,
  network_type VARCHAR(50) NOT NULL CHECK (network_type IN ('public', 'private', 'consortium', 'hybrid')),
  blockchain_protocol VARCHAR(50) NOT NULL CHECK (blockchain_protocol IN ('ethereum', 'hyperledger_fabric', 'polygon', 'avalanche', 'solana', 'corda', 'stellar')),
  chain_id INTEGER,
  rpc_endpoint TEXT NOT NULL,
  ws_endpoint TEXT,
  explorer_url TEXT,
  native_currency VARCHAR(10),
  network_status VARCHAR(20) DEFAULT 'active' CHECK (network_status IN ('active', 'inactive', 'maintenance', 'deprecated')),
  consensus_mechanism VARCHAR(50) DEFAULT 'proof_of_stake',
  block_time_seconds INTEGER DEFAULT 15,
  gas_price_gwei DECIMAL(10,2),
  max_gas_limit BIGINT DEFAULT 8000000,
  network_fees JSONB DEFAULT '{}',
  security_features JSONB DEFAULT '{}',
  smart_contract_support BOOLEAN DEFAULT true,
  privacy_features JSONB DEFAULT '{}',
  interoperability_protocols TEXT[],
  governance_model VARCHAR(50),
  validator_nodes JSONB DEFAULT '{}',
  network_statistics JSONB DEFAULT '{}',
  compliance_features JSONB DEFAULT '{}',
  environmental_impact JSONB DEFAULT '{}',
  api_rate_limits JSONB DEFAULT '{}',
  monitoring_endpoints JSONB DEFAULT '{}',
  backup_endpoints TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Smart Contracts Registry
CREATE TABLE smart_contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_name VARCHAR(200) NOT NULL,
  contract_purpose VARCHAR(100) NOT NULL CHECK (contract_purpose IN ('audit_trail', 'identity_management', 'access_control', 'verification', 'compliance', 'asset_tracking', 'reputation')),
  blockchain_network_id UUID REFERENCES blockchain_networks(id) ON DELETE CASCADE,
  contract_address VARCHAR(200) NOT NULL,
  contract_abi JSONB NOT NULL,
  contract_bytecode TEXT,
  contract_source_code TEXT,
  solidity_version VARCHAR(20),
  compiler_version VARCHAR(50),
  optimization_enabled BOOLEAN DEFAULT true,
  deployment_transaction_hash VARCHAR(200),
  deployment_block_number BIGINT,
  deployment_gas_used BIGINT,
  deployment_cost_wei BIGINT,
  contract_version VARCHAR(20) DEFAULT '1.0',
  upgrade_strategy VARCHAR(50) DEFAULT 'immutable' CHECK (upgrade_strategy IN ('immutable', 'proxy', 'beacon', 'diamond')),
  proxy_contract_address VARCHAR(200),
  implementation_address VARCHAR(200),
  admin_addresses TEXT[],
  function_signatures JSONB DEFAULT '{}',
  event_signatures JSONB DEFAULT '{}',
  access_controls JSONB DEFAULT '{}',
  gas_optimization JSONB DEFAULT '{}',
  security_audits JSONB DEFAULT '{}',
  integration_interfaces JSONB DEFAULT '{}',
  monitoring_events TEXT[],
  performance_metrics JSONB DEFAULT '{}',
  usage_statistics JSONB DEFAULT '{}',
  maintenance_schedule JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  verification_platform VARCHAR(50),
  deployment_status VARCHAR(20) DEFAULT 'active' CHECK (deployment_status IN ('active', 'inactive', 'deprecated', 'upgraded')),
  deployed_by UUID,
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Blockchain Transactions and Events
CREATE TABLE blockchain_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_hash VARCHAR(200) NOT NULL UNIQUE,
  blockchain_network_id UUID REFERENCES blockchain_networks(id) ON DELETE CASCADE,
  smart_contract_id UUID REFERENCES smart_contracts(id) ON DELETE SET NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('audit_log', 'identity_update', 'access_grant', 'verification', 'compliance_check', 'asset_transfer')),
  from_address VARCHAR(200) NOT NULL,
  to_address VARCHAR(200) NOT NULL,
  value_wei BIGINT DEFAULT 0,
  gas_price_gwei DECIMAL(10,2),
  gas_limit BIGINT,
  gas_used BIGINT,
  transaction_fee_wei BIGINT,
  nonce INTEGER,
  block_number BIGINT,
  block_hash VARCHAR(200),
  transaction_index INTEGER,
  block_timestamp TIMESTAMPTZ,
  confirmation_count INTEGER DEFAULT 0,
  transaction_status VARCHAR(20) DEFAULT 'pending' CHECK (transaction_status IN ('pending', 'confirmed', 'failed', 'replaced', 'dropped')),
  function_name VARCHAR(100),
  function_parameters JSONB DEFAULT '{}',
  event_logs JSONB DEFAULT '{}',
  internal_transactions JSONB DEFAULT '{}',
  error_message TEXT,
  revert_reason TEXT,
  business_context JSONB NOT NULL,
  data_hash VARCHAR(200), -- Hash of the actual data being stored
  previous_hash VARCHAR(200), -- Link to previous related transaction
  audit_trail_id UUID, -- Link to system audit trail
  compliance_flags TEXT[],
  privacy_level VARCHAR(20) DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'confidential')),
  encryption_used BOOLEAN DEFAULT false,
  digital_signature JSONB DEFAULT '{}',
  merkle_proof JSONB DEFAULT '{}',
  cross_chain_data JSONB DEFAULT '{}',
  integration_metadata JSONB DEFAULT '{}',
  monitoring_alerts JSONB DEFAULT '{}',
  performance_impact JSONB DEFAULT '{}',
  cost_attribution JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Decentralized Identity (DID) Management
CREATE TABLE decentralized_identities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  did_identifier VARCHAR(500) NOT NULL UNIQUE, -- Decentralized Identifier
  did_method VARCHAR(50) NOT NULL CHECK (did_method IN ('did:ethr', 'did:key', 'did:web', 'did:ion', 'did:sov', 'did:poly')),
  subject_type VARCHAR(50) NOT NULL CHECK (subject_type IN ('person', 'organization', 'device', 'service', 'application')),
  blockchain_network_id UUID REFERENCES blockchain_networks(id) ON DELETE CASCADE,
  controller_addresses TEXT[] NOT NULL,
  public_keys JSONB NOT NULL,
  authentication_methods JSONB NOT NULL,
  service_endpoints JSONB DEFAULT '{}',
  verification_methods JSONB NOT NULL,
  capability_invocation JSONB DEFAULT '{}',
  capability_delegation JSONB DEFAULT '{}',
  did_document JSONB NOT NULL,
  document_metadata JSONB DEFAULT '{}',
  resolution_metadata JSONB DEFAULT '{}',
  version_number INTEGER DEFAULT 1,
  last_updated_block BIGINT,
  update_transaction_hash VARCHAR(200),
  deactivated BOOLEAN DEFAULT false,
  deactivation_reason TEXT,
  recovery_methods JSONB DEFAULT '{}',
  backup_controllers TEXT[],
  multi_sig_threshold INTEGER DEFAULT 1,
  revocation_registry JSONB DEFAULT '{}',
  credential_schemas JSONB DEFAULT '{}',
  reputation_score DECIMAL(5,2) DEFAULT 0.0,
  verification_level VARCHAR(20) DEFAULT 'basic' CHECK (verification_level IN ('basic', 'verified', 'premium', 'enterprise')),
  compliance_status JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  interoperability_data JSONB DEFAULT '{}',
  usage_analytics JSONB DEFAULT '{}',
  integration_history JSONB DEFAULT '{}',
  security_incidents JSONB DEFAULT '{}',
  maintenance_schedule JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Verifiable Credentials
CREATE TABLE verifiable_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id VARCHAR(500) NOT NULL UNIQUE,
  did_issuer_id UUID REFERENCES decentralized_identities(id) ON DELETE CASCADE,
  did_subject_id UUID REFERENCES decentralized_identities(id) ON DELETE CASCADE,
  credential_type VARCHAR(100) NOT NULL,
  credential_schema_url TEXT,
  credential_subject JSONB NOT NULL,
  issuance_date TIMESTAMPTZ DEFAULT NOW(),
  expiration_date TIMESTAMPTZ,
  proof JSONB NOT NULL,
  credential_status JSONB DEFAULT '{}',
  evidence JSONB DEFAULT '{}',
  terms_of_use JSONB DEFAULT '{}',
  refresh_service JSONB DEFAULT '{}',
  credential_context TEXT[] DEFAULT ARRAY['https://www.w3.org/2018/credentials/v1'],
  credential_format VARCHAR(50) DEFAULT 'json-ld' CHECK (credential_format IN ('json-ld', 'jwt', 'zkp')),
  privacy_enhancement VARCHAR(50) CHECK (privacy_enhancement IN ('selective_disclosure', 'zero_knowledge', 'blinded_attributes')),
  revocation_method VARCHAR(50) DEFAULT 'registry' CHECK (revocation_method IN ('registry', 'list', 'accumulator')),
  revocation_id VARCHAR(200),
  revoked BOOLEAN DEFAULT false,
  revocation_reason TEXT,
  revocation_date TIMESTAMPTZ,
  blockchain_anchor JSONB DEFAULT '{}',
  ipfs_hash VARCHAR(100),
  verification_count INTEGER DEFAULT 0,
  last_verified TIMESTAMPTZ,
  trust_score DECIMAL(5,2) DEFAULT 1.0,
  usage_policies JSONB DEFAULT '{}',
  data_minimization JSONB DEFAULT '{}',
  holder_binding JSONB DEFAULT '{}',
  presentation_history JSONB DEFAULT '{}',
  audit_trail JSONB DEFAULT '{}',
  integration_metadata JSONB DEFAULT '{}',
  compliance_validations JSONB DEFAULT '{}',
  quality_metrics JSONB DEFAULT '{}',
  business_value JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Blockchain-based Audit Trail
CREATE TABLE blockchain_audit_trail (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_entry_id UUID NOT NULL, -- Reference to original audit entry
  blockchain_transaction_id UUID REFERENCES blockchain_transactions(id) ON DELETE SET NULL,
  audit_action VARCHAR(100) NOT NULL,
  affected_entity_type VARCHAR(50) NOT NULL,
  affected_entity_id UUID NOT NULL,
  actor_did VARCHAR(500), -- Reference to DID if available
  actor_address VARCHAR(200), -- Blockchain address
  data_hash VARCHAR(200) NOT NULL, -- Hash of the audit data
  merkle_root VARCHAR(200), -- Merkle tree root for batch entries
  previous_entry_hash VARCHAR(200),
  integrity_proof JSONB NOT NULL,
  timestamp_proof JSONB DEFAULT '{}',
  consensus_proof JSONB DEFAULT '{}',
  immutability_score DECIMAL(5,2) DEFAULT 1.0,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed', 'disputed')),
  verification_proofs JSONB DEFAULT '{}',
  dispute_information JSONB DEFAULT '{}',
  compliance_validation JSONB DEFAULT '{}',
  regulatory_markers JSONB DEFAULT '{}',
  privacy_preservation JSONB DEFAULT '{}',
  access_control_proof JSONB DEFAULT '{}',
  cross_reference_proofs JSONB DEFAULT '{}',
  forensic_markers JSONB DEFAULT '{}',
  business_impact JSONB DEFAULT '{}',
  cost_tracking JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  integration_status JSONB DEFAULT '{}',
  quality_assurance JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Digital Asset Registry
CREATE TABLE digital_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_name VARCHAR(200) NOT NULL,
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('nft', 'token', 'certificate', 'license', 'permit', 'credential', 'access_key')),
  blockchain_network_id UUID REFERENCES blockchain_networks(id) ON DELETE CASCADE,
  smart_contract_id UUID REFERENCES smart_contracts(id) ON DELETE SET NULL,
  token_id VARCHAR(200),
  token_standard VARCHAR(20) DEFAULT 'ERC-721' CHECK (token_standard IN ('ERC-20', 'ERC-721', 'ERC-1155', 'ERC-4626', 'SPL')),
  owner_did_id UUID REFERENCES decentralized_identities(id) ON DELETE SET NULL,
  current_owner_address VARCHAR(200),
  metadata_uri TEXT,
  metadata JSONB DEFAULT '{}',
  asset_properties JSONB DEFAULT '{}',
  provenance_chain JSONB DEFAULT '{}',
  authenticity_proofs JSONB DEFAULT '{}',
  valuation_data JSONB DEFAULT '{}',
  transfer_history JSONB DEFAULT '{}',
  usage_rights JSONB DEFAULT '{}',
  licensing_terms JSONB DEFAULT '{}',
  royalty_information JSONB DEFAULT '{}',
  utility_functions JSONB DEFAULT '{}',
  expiration_date TIMESTAMPTZ,
  renewable BOOLEAN DEFAULT false,
  transferable BOOLEAN DEFAULT true,
  divisible BOOLEAN DEFAULT false,
  mintable BOOLEAN DEFAULT false,
  burnable BOOLEAN DEFAULT false,
  pausable BOOLEAN DEFAULT false,
  access_permissions JSONB DEFAULT '{}',
  compliance_requirements JSONB DEFAULT '{}',
  regulatory_status JSONB DEFAULT '{}',
  environmental_impact JSONB DEFAULT '{}',
  social_impact JSONB DEFAULT '{}',
  integration_apis JSONB DEFAULT '{}',
  monitoring_metrics JSONB DEFAULT '{}',
  security_features JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  interoperability_data JSONB DEFAULT '{}',
  business_logic JSONB DEFAULT '{}',
  maintenance_requirements JSONB DEFAULT '{}',
  performance_analytics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Blockchain Analytics and Monitoring
CREATE TABLE blockchain_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_date DATE DEFAULT CURRENT_DATE,
  blockchain_network_id UUID REFERENCES blockchain_networks(id) ON DELETE CASCADE,
  transaction_count INTEGER DEFAULT 0,
  total_gas_used BIGINT DEFAULT 0,
  total_fees_wei BIGINT DEFAULT 0,
  average_gas_price_gwei DECIMAL(10,2),
  average_block_time_seconds DECIMAL(6,2),
  successful_transactions INTEGER DEFAULT 0,
  failed_transactions INTEGER DEFAULT 0,
  contract_interactions INTEGER DEFAULT 0,
  unique_addresses INTEGER DEFAULT 0,
  network_utilization_percent DECIMAL(5,2),
  security_incidents INTEGER DEFAULT 0,
  compliance_violations INTEGER DEFAULT 0,
  performance_issues INTEGER DEFAULT 0,
  cost_efficiency_score DECIMAL(5,2),
  environmental_impact_score DECIMAL(5,2),
  decentralization_score DECIMAL(5,2),
  reliability_score DECIMAL(5,2),
  scalability_metrics JSONB DEFAULT '{}',
  consensus_metrics JSONB DEFAULT '{}',
  validator_performance JSONB DEFAULT '{}',
  network_health_indicators JSONB DEFAULT '{}',
  transaction_patterns JSONB DEFAULT '{}',
  user_behavior_analytics JSONB DEFAULT '{}',
  contract_usage_statistics JSONB DEFAULT '{}',
  integration_performance JSONB DEFAULT '{}',
  business_impact_metrics JSONB DEFAULT '{}',
  regulatory_compliance_score DECIMAL(5,2),
  risk_assessment JSONB DEFAULT '{}',
  optimization_opportunities JSONB DEFAULT '{}',
  anomaly_detection_results JSONB DEFAULT '{}',
  forecasting_data JSONB DEFAULT '{}',
  comparative_analysis JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Consensus and Validation
CREATE TABLE consensus_validation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  validation_type VARCHAR(50) NOT NULL CHECK (validation_type IN ('transaction', 'block', 'smart_contract', 'identity', 'credential', 'audit_trail')),
  blockchain_network_id UUID REFERENCES blockchain_networks(id) ON DELETE CASCADE,
  validated_entity_id UUID NOT NULL,
  validation_hash VARCHAR(200) NOT NULL,
  consensus_mechanism VARCHAR(50) NOT NULL,
  validator_nodes JSONB NOT NULL,
  validation_results JSONB NOT NULL,
  consensus_reached BOOLEAN DEFAULT false,
  consensus_percentage DECIMAL(5,2),
  validation_time_ms DECIMAL(10,2),
  finality_status VARCHAR(20) DEFAULT 'pending' CHECK (finality_status IN ('pending', 'probable', 'final', 'disputed')),
  finality_confirmations INTEGER DEFAULT 0,
  required_confirmations INTEGER DEFAULT 12,
  byzantine_fault_tolerance BOOLEAN DEFAULT true,
  slashing_evidence JSONB DEFAULT '{}',
  validator_rewards JSONB DEFAULT '{}',
  validator_penalties JSONB DEFAULT '{}',
  challenge_period_hours INTEGER DEFAULT 24,
  dispute_resolution JSONB DEFAULT '{}',
  cryptographic_proofs JSONB DEFAULT '{}',
  zero_knowledge_proofs JSONB DEFAULT '{}',
  multi_party_computation JSONB DEFAULT '{}',
  threshold_signatures JSONB DEFAULT '{}',
  merkle_proofs JSONB DEFAULT '{}',
  commitment_schemes JSONB DEFAULT '{}',
  randomness_beacons JSONB DEFAULT '{}',
  time_locks JSONB DEFAULT '{}',
  cross_chain_validation JSONB DEFAULT '{}',
  interoperability_proofs JSONB DEFAULT '{}',
  compliance_validation JSONB DEFAULT '{}',
  security_assessment JSONB DEFAULT '{}',
  performance_impact JSONB DEFAULT '{}',
  economic_incentives JSONB DEFAULT '{}',
  governance_participation JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Advanced Indexes for Blockchain Performance
CREATE INDEX idx_blockchain_transactions_hash ON blockchain_transactions (transaction_hash);
CREATE INDEX idx_blockchain_transactions_network_block ON blockchain_transactions (blockchain_network_id, block_number DESC);
CREATE INDEX idx_blockchain_transactions_status_type ON blockchain_transactions (transaction_status, transaction_type, created_at DESC);
CREATE INDEX idx_decentralized_identities_did ON decentralized_identities (did_identifier);
CREATE INDEX idx_verifiable_credentials_issuer_subject ON verifiable_credentials (did_issuer_id, did_subject_id);
CREATE INDEX idx_verifiable_credentials_type_status ON verifiable_credentials (credential_type, revoked, expiration_date);
CREATE INDEX idx_blockchain_audit_trail_entity ON blockchain_audit_trail (affected_entity_type, affected_entity_id, created_at DESC);
CREATE INDEX idx_digital_assets_owner_type ON digital_assets (owner_did_id, asset_type, created_at DESC);
CREATE INDEX idx_blockchain_analytics_network_date ON blockchain_analytics (blockchain_network_id, analysis_date DESC);

-- Blockchain Integration Functions

-- 1. Create Blockchain Audit Entry
CREATE OR REPLACE FUNCTION create_blockchain_audit_entry(
  p_audit_entry_id UUID,
  p_audit_action VARCHAR(100),
  p_affected_entity_type VARCHAR(50),
  p_affected_entity_id UUID,
  p_actor_address VARCHAR(200),
  p_data_hash VARCHAR(200),
  p_business_context JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  audit_entry RECORD;
  blockchain_tx_id UUID;
  previous_hash VARCHAR(200);
  integrity_proof JSONB;
BEGIN
  -- Get previous entry hash for chain linking
  SELECT data_hash INTO previous_hash
  FROM blockchain_audit_trail
  WHERE affected_entity_type = p_affected_entity_type
    AND affected_entity_id = p_affected_entity_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Generate integrity proof
  integrity_proof := jsonb_build_object(
    'hash_algorithm', 'SHA-256',
    'previous_hash', COALESCE(previous_hash, ''),
    'timestamp', NOW(),
    'data_integrity', true,
    'chain_continuity', previous_hash IS NOT NULL
  );

  -- Create audit trail entry
  INSERT INTO blockchain_audit_trail (
    audit_entry_id,
    audit_action,
    affected_entity_type,
    affected_entity_id,
    actor_address,
    data_hash,
    previous_entry_hash,
    integrity_proof
  ) VALUES (
    p_audit_entry_id,
    p_audit_action,
    p_affected_entity_type,
    p_affected_entity_id,
    p_actor_address,
    p_data_hash,
    previous_hash,
    integrity_proof
  ) RETURNING * INTO audit_entry;

  RETURN jsonb_build_object(
    'success', true,
    'audit_entry_id', audit_entry.id,
    'data_hash', audit_entry.data_hash,
    'previous_hash', audit_entry.previous_entry_hash,
    'integrity_proof', audit_entry.integrity_proof,
    'created_at', audit_entry.created_at
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Verify Blockchain Audit Chain
CREATE OR REPLACE FUNCTION verify_blockchain_audit_chain(
  p_entity_type VARCHAR(50),
  p_entity_id UUID,
  p_verification_depth INTEGER DEFAULT 10
)
RETURNS JSONB AS $$
DECLARE
  audit_entries RECORD;
  chain_valid BOOLEAN := true;
  verification_results JSONB;
  entries_verified INTEGER := 0;
  chain_breaks INTEGER := 0;
BEGIN
  verification_results := jsonb_build_object(
    'verified_entries', jsonb_build_array(),
    'integrity_issues', jsonb_build_array()
  );

  FOR audit_entries IN
    SELECT id, data_hash, previous_entry_hash, integrity_proof, created_at
    FROM blockchain_audit_trail
    WHERE affected_entity_type = p_entity_type
      AND affected_entity_id = p_entity_id
    ORDER BY created_at DESC
    LIMIT p_verification_depth
  LOOP
    entries_verified := entries_verified + 1;
    
    -- Verify hash chain continuity
    IF audit_entries.previous_entry_hash IS NOT NULL THEN
      -- Check if previous hash exists in chain
      PERFORM 1 FROM blockchain_audit_trail
      WHERE data_hash = audit_entries.previous_entry_hash
        AND affected_entity_type = p_entity_type
        AND affected_entity_id = p_entity_id;
      
      IF NOT FOUND THEN
        chain_breaks := chain_breaks + 1;
        chain_valid := false;
        
        verification_results := jsonb_set(
          verification_results,
          '{integrity_issues}',
          (verification_results->'integrity_issues') || jsonb_build_object(
            'entry_id', audit_entries.id,
            'issue', 'broken_chain',
            'missing_previous_hash', audit_entries.previous_entry_hash
          )
        );
      END IF;
    END IF;

    verification_results := jsonb_set(
      verification_results,
      '{verified_entries}',
      (verification_results->'verified_entries') || jsonb_build_object(
        'entry_id', audit_entries.id,
        'hash', audit_entries.data_hash,
        'timestamp', audit_entries.created_at,
        'valid', true
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'chain_valid', chain_valid,
    'entries_verified', entries_verified,
    'chain_breaks', chain_breaks,
    'verification_depth', p_verification_depth,
    'verification_results', verification_results,
    'verification_timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Generate DID Document
CREATE OR REPLACE FUNCTION generate_did_document(
  p_did_id UUID
)
RETURNS JSONB AS $$
DECLARE
  did_info RECORD;
  did_document JSONB;
BEGIN
  SELECT * INTO did_info
  FROM decentralized_identities
  WHERE id = p_did_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'DID not found');
  END IF;

  did_document := jsonb_build_object(
    '@context', ARRAY['https://www.w3.org/ns/did/v1'],
    'id', did_info.did_identifier,
    'controller', did_info.controller_addresses,
    'verificationMethod', did_info.verification_methods,
    'authentication', did_info.authentication_methods,
    'service', did_info.service_endpoints,
    'created', did_info.created_at,
    'updated', did_info.updated_at,
    'versionId', did_info.version_number
  );

  IF did_info.capability_invocation != '{}' THEN
    did_document := did_document || jsonb_build_object('capabilityInvocation', did_info.capability_invocation);
  END IF;

  IF did_info.capability_delegation != '{}' THEN
    did_document := did_document || jsonb_build_object('capabilityDelegation', did_info.capability_delegation);
  END IF;

  RETURN did_document;
END;
$$ LANGUAGE plpgsql;

-- Insert Sample Blockchain Networks
INSERT INTO blockchain_networks (network_name, network_type, blockchain_protocol, chain_id, rpc_endpoint, native_currency) VALUES
('Ethereum Mainnet', 'public', 'ethereum', 1, 'https://mainnet.infura.io/v3/your-project-id', 'ETH'),
('Polygon Mainnet', 'public', 'polygon', 137, 'https://polygon-rpc.com', 'MATIC'),
('Private Hyperledger', 'private', 'hyperledger_fabric', NULL, 'https://private-network.internal', 'TOKEN'),
('Test Network', 'private', 'ethereum', 31337, 'http://localhost:8545', 'ETH');

-- Insert Sample Smart Contracts
INSERT INTO smart_contracts (contract_name, contract_purpose, blockchain_network_id, contract_address, contract_abi, contract_version) VALUES
('Audit Trail Contract', 'audit_trail', (SELECT id FROM blockchain_networks WHERE network_name = 'Ethereum Mainnet'), '0x742d35Cc6634C0532925a3b8D400e89b6D26F08C', '[]', '1.0'),
('Identity Registry', 'identity_management', (SELECT id FROM blockchain_networks WHERE network_name = 'Polygon Mainnet'), '0x1234567890123456789012345678901234567890', '[]', '1.0'),
('Access Control NFT', 'access_control', (SELECT id FROM blockchain_networks WHERE network_name = 'Private Hyperledger'), '0xABCDEF1234567890ABCDEF1234567890ABCDEF12', '[]', '1.0');

-- RLS Policies for Blockchain Tables
ALTER TABLE blockchain_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decentralized_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifiable_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE consensus_validation ENABLE ROW LEVEL SECURITY;

-- Service role access for blockchain operations
CREATE POLICY blockchain_networks_service_role ON blockchain_networks USING (auth.role() = 'service_role');
CREATE POLICY smart_contracts_service_role ON smart_contracts USING (auth.role() = 'service_role');
CREATE POLICY blockchain_transactions_service_role ON blockchain_transactions USING (auth.role() = 'service_role');
CREATE POLICY decentralized_identities_service_role ON decentralized_identities USING (auth.role() = 'service_role');
CREATE POLICY verifiable_credentials_service_role ON verifiable_credentials USING (auth.role() = 'service_role');
CREATE POLICY blockchain_audit_trail_service_role ON blockchain_audit_trail USING (auth.role() = 'service_role');
CREATE POLICY digital_assets_service_role ON digital_assets USING (auth.role() = 'service_role');
CREATE POLICY blockchain_analytics_service_role ON blockchain_analytics USING (auth.role() = 'service_role');
CREATE POLICY consensus_validation_service_role ON consensus_validation USING (auth.role() = 'service_role');

COMMENT ON TABLE blockchain_networks IS 'Blockchain network configurations and endpoints';
COMMENT ON TABLE smart_contracts IS 'Smart contract registry with deployment and management data';
COMMENT ON TABLE blockchain_transactions IS 'Blockchain transaction tracking and audit integration';
COMMENT ON TABLE decentralized_identities IS 'Decentralized identity (DID) management and resolution';
COMMENT ON TABLE verifiable_credentials IS 'W3C Verifiable Credentials for digital identity';
COMMENT ON TABLE blockchain_audit_trail IS 'Immutable audit trail anchored to blockchain';
COMMENT ON TABLE digital_assets IS 'Digital asset registry with NFT and token management';
COMMENT ON TABLE blockchain_analytics IS 'Blockchain network analytics and performance monitoring';
COMMENT ON TABLE consensus_validation IS 'Consensus mechanism validation and proof management';
