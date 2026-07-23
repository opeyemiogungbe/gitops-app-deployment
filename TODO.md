# Fix CRD Sync Error for kustomize-dev App

## Plan Steps
- [x] Analyze the repository and identify root cause
- [x] Get user confirmation on the plan
- [x] **Step 1:** Remove CRD-dependent resources from `base/kustomization.yaml`
  - Removed `secret-store.yaml` (requires External Secrets Operator CRD)
  - Removed `external-secret.yaml` (requires External Secrets Operator CRD)
  - Removed `oauth.yaml` (requires Argo CD Operator CRD)
- [x] **Step 2:** Test the fix by rendering with kustomize - SUCCESS
  - Kustomize renders cleanly with only standard K8s resources:
    - RoleBinding, ConfigMaps, Secret, Service, Deployment
- [x] **Step 3:** Fix complete - ready for Git commit and push

