module.exports = {
  caseType: 'aquaculture_site_observation', initialState: 'observed',
  states: ['observed', 'validated', 'diagnosed', 'planned', 'approved', 'work_ordered', 'outcome_recorded'],
  createRoles: ['operator', 'farm_manager', 'admin'],
  evidenceKinds: ['sensor_batch_digest', 'weather_snapshot', 'gis_snapshot', 'lab_result', 'operator_observation', 'work_order', 'outcome_measurement'],
  requiredSignals: ['species', 'region', 'season', 'measurementQuality', 'policyVersion'],
  transitions: [
    { from: 'observed', action: 'validate', to: 'validated', roles: ['operator', 'farm_manager'], requiresEvidence: true },
    { from: 'validated', action: 'record_diagnosis', to: 'diagnosed', roles: ['aquaculture_specialist'], requiresEvidence: true },
    { from: 'diagnosed', action: 'create_plan', to: 'planned', roles: ['aquaculture_specialist', 'farm_manager'], requiresEvidence: true },
    { from: 'planned', action: 'approve', to: 'approved', roles: ['farm_manager'], requiresEvidence: true, dualControl: true },
    { from: 'approved', action: 'issue_work_order', to: 'work_ordered', roles: ['operator', 'farm_manager'], requiresEvidence: true },
    { from: 'work_ordered', action: 'record_outcome', to: 'outcome_recorded', roles: ['operator', 'aquaculture_specialist'], requiresEvidence: true, dualControl: true },
  ],
  assess: (x) => ({ disposition: x.measurementQuality === 'validated' ? 'expert_diagnosis_required' : 'collect_or_validate_measurements', scope: { species: x.species, region: x.region, season: x.season }, recommendation: null }),
};
