# Advanced Configuration Management with Argo CD

## 1. Project Overview

This repository is a complete GitOps reference implementation for deploying a Kubernetes application with Argo CD, Kustomize, Helm, and external secret management. It demonstrates how modern platforms can use Git as the single source of truth for infrastructure and application configuration.

The project is designed to show how to:

- deploy applications with Argo CD
- manage environment-specific configuration with Kustomize overlays
- package reusable application templates with Helm
- inject secrets securely from external systems
- integrate Vault and AWS Secrets Manager into the delivery workflow
- use declarative Application manifests so Argo CD manages deployments automatically

The overall flow is:

```text
Developer changes code or manifests
        |
        v
GitHub repository becomes the source of truth
        |
        v
Argo CD detects drift or new changes
        |
        v
Argo CD renders the correct manifests
        |
        v
Kubernetes cluster is reconciled to the desired state
```

---

## 2. What This Project Demonstrates

This project covers several layers of modern GitOps and configuration management:

1. Application deployment using Kubernetes manifests
2. Environment-specific overlays using Kustomize
3. Helm chart packaging and templated deployment values
4. Argo CD Application resource management
5. Automated sync, self-healing, and pruning
6. Secret management using Vault and AWS Secrets Manager patterns
7. Declarative cluster bootstrap for Argo CD applications

The repository includes both a plain Kubernetes deployment path and a Helm-based deployment path. That allows you to compare and understand how Argo CD can work with different rendering approaches.

---

## 3. Repository Structure

```text
gitops-app-deployment/
├── app/
│   └── index.js
├── argocd/
│   ├── application-dev.yaml
│   ├── application-helm-dev.yaml
│   ├── application-kustomize-dev.yaml
│   ├── application-prod.yaml
│   ├── application-staging.yaml
│   └── kustomization.yaml
├── base/
│   ├── deployment.yaml
│   ├── kustomization.yaml
│   └── service.yaml
├── helm/
│   └── my-app/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── charts/
│       └── templates/
│           ├── _helpers.tpl
│           ├── deployment.yaml
│           ├── NOTES.txt
│           ├── service.yaml
│           └── serviceaccount.yaml
├── overlay/
│   ├── dev/
│   │   ├── deployment_patch.yaml
│   │   ├── kustomization.yaml
│   │   └── replica_count.yaml
│   ├── prod/
│   │   ├── deployment_patch.yaml
│   │   ├── kustomization.yaml
│   │   └── replica_count.yaml
│   └── staging/
│       ├── deployment_patch.yaml
│       ├── kustomization.yaml
│       ├── replica_count.yaml
│       └── service_patch.yaml
├── .github/
│   └── workflows/
│       └── main.yaml
├── Dockerfile
├── package.json
├── vault-dev-deployment.yaml
└── README.md
```

---

## 4. Core Concepts

### 4.1 GitOps

GitOps is the practice of using Git as the source of truth for infrastructure and application deployment. In this project:

- Kubernetes manifests are stored in Git
- Argo CD watches the repository
- Argo CD compares the desired state in Git to the live state in the cluster
- Argo CD reconciles the cluster to match Git

This approach provides:

- auditability
- repeatability
- easy rollback
- consistency across environments

### 4.2 Argo CD

Argo CD is a continuous delivery tool for Kubernetes that uses GitOps principles. It watches Git repositories and applies the desired manifests to a cluster.

It performs three key functions:

- detects changes in Git
- renders manifests into Kubernetes resources
- syncs resources into the cluster

### 4.3 Kustomize

Kustomize is a Kubernetes-native configuration management tool. It allows you to build customized deployment manifests from a shared base while minimizing duplication.

This project uses Kustomize overlays to adjust settings per environment without rewriting the base manifests.

### 4.4 Helm

Helm packages applications as charts. A chart is a collection of templates and values that can be rendered into Kubernetes manifests. Helm is useful for reusable application packaging and parameterization.

This repository includes a Helm chart under [helm/my-app](helm/my-app) that can be deployed by Argo CD as an alternative deployment path.

### 4.5 External Secret Management

Secrets should not be stored as plain literals in Git. This repository demonstrates how secrets can be sourced from secure systems like:

- Vault
- AWS Secrets Manager
- External Secret Operator patterns

The deployment is written so that the application consumes a Kubernetes Secret named `my-secret`, which can be populated from an external secret store rather than static values in Git.

---

## 5. Application Structure

### 5.1 Base Manifests

The base layer contains shared Kubernetes resources that are common across environments.

Files:

- [base/deployment.yaml](base/deployment.yaml)
- [base/service.yaml](base/service.yaml)
- [base/kustomization.yaml](base/kustomization.yaml)

These define the common deployment and service for the application.

### 5.2 Environment Overlays

The overlay folders represent environment-specific settings.

- [overlay/dev](overlay/dev)
- [overlay/staging](overlay/staging)
- [overlay/prod](overlay/prod)

Each overlay modifies the base resources for a specific environment, for example:

- changing the replica count
- overriding image tags
- changing environment variables
- adjusting service behavior

### 5.3 Kustomize Patch Strategy

Kustomize overlays are applied in a layered fashion:

1. start from the shared base
2. apply environment-specific patches
3. generate or override ConfigMaps and Secrets
4. produce the final resource set

This approach keeps the base manifests clean while still allowing environment-specific differences.

---

## 6. Kustomize Workflow in This Project

### 6.1 Base Resources

The base model is built from shared manifests in [base](base).

The deployment references:

- a ConfigMap named `my-app-config`
- a Secret named `my-secret`

These are either generated or provided by the overlay layer.

### 6.2 Overlay Files

The development overlay uses:

- [overlay/dev/kustomization.yaml](overlay/dev/kustomization.yaml)
- [overlay/dev/replica_count.yaml](overlay/dev/replica_count.yaml)
- [overlay/dev/deployment_patch.yaml](overlay/dev/deployment_patch.yaml)

These files adjust the deployment for the dev environment.

### 6.3 Why Kustomize Is Useful

Kustomize helps avoid duplication by allowing you to define:

- shared resources once in base
- environment changes once per overlay
- no manual copy-paste of YAML

This is especially useful when you have multiple environments such as dev, staging, and prod.

---

## 7. Helm Workflow in This Project

The project also includes a Helm chart under [helm/my-app](helm/my-app).

### 7.1 Helm Chart Structure

The chart includes:

- [helm/my-app/Chart.yaml](helm/my-app/Chart.yaml)
- [helm/my-app/values.yaml](helm/my-app/values.yaml)
- [helm/my-app/templates/deployment.yaml](helm/my-app/templates/deployment.yaml)
- [helm/my-app/templates/service.yaml](helm/my-app/templates/service.yaml)
- [helm/my-app/templates/serviceaccount.yaml](helm/my-app/templates/serviceaccount.yaml)

### 7.2 Helm Values

The chart’s defaults are defined in [helm/my-app/values.yaml](helm/my-app/values.yaml).

This file contains values such as:

- image repository and tag
- service type and port
- replica count
- environment variables

### 7.3 Why Helm Is Valuable

Helm is helpful because it allows you to:

- parameterize deployment settings
- reuse templates across applications
- make environment configuration easier to manage
- support chart-driven deployments through Argo CD

### 7.4 Argo CD + Helm

Argo CD can deploy a Helm chart directly. The repository includes an Argo CD manifest for the Helm-based dev deployment in [argocd/application-helm-dev.yaml](argocd/application-helm-dev.yaml).

This example shows how Argo CD can point to a Helm chart path and override values inline.

---

## 8. Argo CD Application Manifests

Argo CD applications are defined under [argocd](argocd).

### 8.1 Application Types

This repository contains multiple application manifests:

- [argocd/application-dev.yaml](argocd/application-dev.yaml)
- [argocd/application-helm-dev.yaml](argocd/application-helm-dev.yaml)
- [argocd/application-kustomize-dev.yaml](argocd/application-kustomize-dev.yaml)
- [argocd/application-prod.yaml](argocd/application-prod.yaml)
- [argocd/application-staging.yaml](argocd/application-staging.yaml)

### 8.2 What the Application Manifest Does

Each Argo CD Application tells Argo CD:

- which Git repository to watch
- which branch or revision to track
- which path should be rendered
- which Kubernetes namespace to deploy into
- whether to enable automated sync and self-healing

### 8.3 Sync Policy

The Applications use a sync policy similar to this:

```yaml
spec:
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

This means:

- `prune: true` removes resources that have been deleted from Git
- `selfHeal: true` brings the cluster back into alignment if someone changes resources manually

### 8.4 Why This Matters

With automated sync enabled, changes pushed to Git are reflected in the cluster without manual intervention.

---

## 9. Secret Management in This Project

Secrets should never be stored plainly in Git in real environments. This project demonstrates multiple relevant patterns.

### 9.1 Kubernetes Secret Generation

The base Kustomize configuration previously generated a secret directly. In the advanced configuration flow, those values were moved toward external secret sources.

### 9.2 Vault Integration

A Vault dev deployment is included in [vault-dev-deployment.yaml](vault-dev-deployment.yaml).

This file creates a simple Vault server in development mode to demonstrate how secrets can be served through Vault.

The Vault-manifest deployment includes:

- a Vault container
- a service on port `8200`
- a dev root token
- a simple local development configuration

This is suitable for learning and local testing, but it is not intended for production.

### 9.3 Vault Access Flow

To access Vault locally:

```bash
kubectl -n vault port-forward svc/vault 8200:8200
```

Then open:

```text
http://localhost:8200
```

Use the dev login credentials created during the setup process.

### 9.4 AWS Secrets Manager Integration

The project also includes an AWS Secrets Manager-style External Secrets pattern.

The files added for this purpose are:

- [base/aws-credentials-secret.yaml](base/aws-credentials-secret.yaml)
- [base/secret-store.yaml](base/secret-store.yaml)
- [base/external-secret.yaml](base/external-secret.yaml)

These resources are intended to instruct the cluster to pull secrets from AWS Secrets Manager using the External Secrets Operator.

### 9.5 How the Secret Flow Works

The application consumes a Secret named `my-secret` through [base/deployment.yaml](base/deployment.yaml). That Secret can be managed in one of several ways:

1. directly generated by Kustomize during development
2. created from Vault
3. populated from AWS Secrets Manager via External Secrets

This is the key architecture principle:

- application code consumes a Kubernetes Secret
- the Secret can be sourced from any secure back-end
- Git remains the deployment source of truth

---

## 10. Deployment Workflow

### 10.1 Bootstrap Argo CD Applications

Apply the Argo CD Application manifests once:

```bash
kubectl apply -k argocd
```

Or individually:

```bash
kubectl apply -f argocd/application-dev.yaml
kubectl apply -f argocd/application-staging.yaml
kubectl apply -f argocd/application-prod.yaml
```

### 10.2 Apply the Dev Overlay

To deploy the development environment:

```bash
kubectl apply -k overlay/dev
```

### 10.3 Apply the Vault Setup

To deploy the Vault dev environment:

```bash
kubectl apply -f vault-dev-deployment.yaml
```

### 10.4 Verify Resources

Useful checks:

```bash
kubectl get pods
kubectl get svc
kubectl get deployments
kubectl get applications -n argocd
```

### 10.5 Observe Argo CD

Argo CD watches the Git repository and reconciles the cluster to the desired state.

You can inspect the Application status with:

```bash
kubectl describe application kustomize-dev -n argocd
```

---

## 11. Practical Example: Dev Environment

The development environment uses [overlay/dev](overlay/dev) and the application is deployed into the `dev` namespace.

The overlay changes the deployment to:

- increase or adjust replicas
- apply environment-specific config
- patch the deployment definition for development

This allows the dev environment to differ from staging and production while still inheriting the same core base deployment.

---

## 12. Advanced Configuration Patterns

### 12.1 Resource Customization in Argo CD

Argo CD can be extended with custom health checks and resource behaviors using configuration entries in `argocd-cm`.

This is especially useful when working with custom resources or third-party controllers that need custom health logic.

### 12.2 Ignore Differences

Argo CD can also ignore certain differences for resource fields that change frequently but are not relevant to GitOps drift detection.

This is useful for resources such as annotations that are managed by controllers.

### 12.3 Auto Sync and Self-Healing

These features are central to GitOps:

- auto-sync applies changes as soon as Git changes
- self-healing reverts drift from the cluster back to Git
- pruning ensures stale resources are deleted

---

## 13. Best Practices

### 13.1 Keep Git as the Source of Truth

Never manually modify the cluster state if you want GitOps discipline. Use Git changes to drive deployment.

### 13.2 Separate Base and Environment Configuration

Keep shared configurations in base and environment-specific changes in overlays.

### 13.3 Avoid Hard-Coding Secrets

Use external secret managers instead of writing secrets in manifests.

### 13.4 Use Automated Sync Carefully

Automated sync is powerful, but it should be used intentionally. Test changes in lower environments first.

### 13.5 Prefer Declarative Configuration

Everything should be represented as YAML or templates in Git, rather than executed manually through ad-hoc commands.

---

## 14. Troubleshooting

### 14.1 Argo CD App Does Not Appear

Make sure the Application resource exists in the `argocd` namespace.

```bash
kubectl get applications -n argocd
```

### 14.2 Pods Are Not Starting

Check deployment status and pod logs:

```bash
kubectl get pods -n dev
kubectl describe deployment dev-my-app -n dev
kubectl logs deploy/dev-my-app -n dev
```

### 14.3 Vault Is Not Reachable

Check the Vault pod and service:

```bash
kubectl -n vault get pods
kubectl -n vault get svc
kubectl -n vault logs deploy/vault-dev
```

### 14.4 Secret Is Missing

Verify the Secret exists:

```bash
kubectl get secret my-secret
kubectl describe secret my-secret
```

---

## 15. Summary

This project demonstrates a practical GitOps deployment pipeline that combines:

- Argo CD for declarative deployment automation
- Kustomize for environment-based configuration layering
- Helm for reusable chart-based deployment packaging
- Vault and AWS Secrets Manager patterns for secure secret management
- Git as the single source of truth

It is intended as a learning and reference project for teams wanting to adopt modern Kubernetes delivery practices with strong configuration governance.

---

## 16. Next Steps

To extend this project further, you could:

- add a production-grade Vault configuration instead of dev mode
- configure the External Secrets Operator fully for AWS Secrets Manager
- add ingress resources and TLS termination
- add image promotion strategies between environments
- connect Argo CD notifications and health checks to Slack or Teams
- add multi-cluster Argo CD deployments

---

## 17. Final Takeaway

The central lesson of this repository is that configuration management is not just about YAML files. It is about building a consistent system where:

- source code and manifests live in Git
- deployment behavior is declarative
- environments are derived from reusable bases and overlays
- secrets are managed securely outside the repository
- Argo CD continuously reconciles the cluster to the desired state

That is the foundation of a robust advanced GitOps workflow.

You can also roll back from the Argo CD UI or CLI:

```bash
argocd app history kustomize-dev
argocd app rollback kustomize-dev <history-id>
```

However, if automated sync is enabled and Git still points to the bad version, Argo CD may eventually sync back to that Git state. For this reason, Git-based rollback is usually the safest and cleanest approach.

## Application Deletion

When deleting an Argo CD Application, the deletion propagation policy controls what happens to the resources it manages.

| Policy | Behavior |
|---|---|
| `Foreground` | Deletes child resources first, then removes the Application |
| `Background` | Deletes the Application and lets Kubernetes clean up child resources afterward |
| `Non-cascading` | Deletes only the Argo CD Application; workloads remain running |

For normal cleanup, `Foreground` is a good default. Use `Non-cascading` only when you want Argo CD to stop managing the app but leave the Kubernetes resources in place.

## Useful Commands

Render Kustomize overlays locally:

```bash
kubectl kustomize overlay/dev
kubectl kustomize overlay/staging
kubectl kustomize overlay/prod
```

Register Argo CD Applications:

```bash
kubectl apply -k argocd
```

Check Argo CD Applications:

```bash
kubectl get applications -n argocd
kubectl describe application kustomize-dev -n argocd
kubectl describe application kustomize-staging -n argocd
kubectl describe application kustomize-prod -n argocd
```

Check workloads:

```bash
kubectl get pods -n dev
kubectl get pods -n staging
kubectl get pods -n prod
```

## Troubleshooting

### Argo CD Did Not Deploy After a Push

Confirm the Application exists:

```bash
kubectl get applications -n argocd
```

Confirm the app is watching the correct branch and path:

```bash
kubectl describe application kustomize-dev -n argocd
```

### GitHub Actions Failed With `write_package`

This means GitHub Actions could not push the image to GitHub Container Registry.

Check:

- Repository workflow permissions allow read and write access.
- The workflow has `packages: write`.
- The GHCR package allows this repository to publish images.

### Application Is Synced But Pods Are Failing

Check pod events:

```bash
kubectl describe pod <pod-name> -n dev
```

Common causes include missing images, private image permissions, bad environment variables, or failing application startup.

### Staging or Prod Synced Even Without a New Push

If the Argo CD Applications were newly created, Argo CD performs an initial reconciliation for all registered apps. This is expected. Each app still tracks its own configured branch.

## Summary

This project now follows a clean GitOps workflow:

- Kubernetes manifests live in Git.
- Kustomize manages environment differences.
- Argo CD Applications are declared as YAML.
- GitHub Actions builds and pushes container images.
- Argo CD syncs the cluster to match Git.
- Rollbacks are handled cleanly through Git history.

With this structure, deployment is repeatable, auditable, and easier to manage across development, staging, and production.
